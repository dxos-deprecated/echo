//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';

import { schema } from '@dxos/echo-protocol';
import { NetworkManager, SwarmProvider } from '@dxos/network-manager';
import { ObjectModel } from '@dxos/object-model';

import { Party, PartyFactory, PartyInternal } from './parties';
import { createTestInstance } from './testing';

const log = debug('dxos:snapshot:test');

test('loading large party', async () => {
  const { echo: echo1, feedStore, keyStore } = await createTestInstance({ initialized: true });
  const party1 = await echo1.createParty();
  const item1 = await party1.database.createItem({ model: ObjectModel });
  for (let i = 0; i < 1_000; i++) {
    item1.model.setProperty('foo', i);
  }
  await item1.model.setProperty('foo', 'done');

  const startTime = Date.now();
  const { echo: echo2, identityManager } = await createTestInstance({ feedStore, keyStore });
  await identityManager.keyring.load();
  await echo2.open();
  const party2 = echo2.getParty(party1.key);
  assert(party2);

  await party2.database.queryItems().update.waitFor(() => {
    const item = party2.database.getItem(item1.id);
    return item?.model.getProperty('foo') === 'done';
  });
  log(`Load took ${Date.now() - startTime}ms`);
});

test('can produce & serialize a snapshot', async () => {
  const { echo } = await createTestInstance({ initialized: true });
  const party = await echo.createParty();
  const item = await party.database.createItem({ model: ObjectModel, props: { foo: 'foo' } });
  await item.model.setProperty('foo', 'bar');

  const snapshot = ((party as any)._impl as PartyInternal).createSnapshot();

  expect(snapshot.database?.items).toHaveLength(2);
  expect(snapshot.database?.items?.find(i => i.itemId === item.id)?.mutations).toHaveLength(2);
  expect(snapshot.halo?.messages && snapshot.halo?.messages?.length > 0).toBeTruthy();
  expect(snapshot.timeframe?.frames).toHaveLength(1);

  const serialized = schema.getCodecForType('dxos.echo.snapshot.PartySnapshot').encode(snapshot);

  expect(serialized instanceof Uint8Array).toBeTruthy();
});

test('restored party is identical to the source party', async () => {
  const { echo, identityManager, feedStoreAdapter, modelFactory } = await createTestInstance({ initialized: true });
  const party = await echo.createParty();
  const item = await party.database.createItem({ model: ObjectModel, props: { foo: 'foo' } });
  await item.model.setProperty('foo', 'bar');

  const snapshot = ((party as any)._impl as PartyInternal).createSnapshot();

  const partyFactory = new PartyFactory(
    identityManager,
    feedStoreAdapter,
    modelFactory,
    new NetworkManager(feedStoreAdapter.feedStore, new SwarmProvider()) // recreating network manager to avoid "Already joined swarm" errors.
  );

  const restoredPartyInternal = await partyFactory.constructPartyFromSnapshot(snapshot);
  const restoredParty = new Party(restoredPartyInternal);

  expect(restoredParty.isOpen).toBeTruthy();
  expect(restoredParty.key).toEqual(party.key);
  expect(restoredParty.queryMembers().value).toEqual(party.queryMembers().value);
  expect(restoredParty.database.queryItems().value.length).toEqual(restoredParty.database.queryItems().value.length);
  expect(restoredParty.database.getItem(item.id)?.model.toObject()).toEqual(item.model.toObject());
});
