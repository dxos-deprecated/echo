//
// Copyright 2020 DXOS.org
//

import debug from 'debug';
import ram from 'random-access-memory';

import { createKeyPair, keyToString } from '@dxos/crypto';
import { FeedStore } from '@dxos/feed-store';

import { codec } from '../proto';
import { ModelFactory } from '../models';
import { createPartyGenesis, TestModel } from '../testing';
import { PartyManager } from './party-manager';
import { createWritableFeedStream } from '../feeds';
import { latch } from '../util';

const log = debug('dxos:echo:party-manager-test');
debug.enable('dxos:echo:*');

describe('Party manager', () => {
  test('Created locally', async () => {
    const feedStore = new FeedStore(ram, { feedOptions: { valueEncoding: codec } });
    const modelFactory = new ModelFactory().registerModel(TestModel.type, TestModel);
    const partyManager = new PartyManager(feedStore, modelFactory);
    await partyManager.open();

    const [update, setUpdated] = latch();
    const unsubscribe = partyManager.update.on((party) => {
      log('Open:', String(party));
      unsubscribe();
      setUpdated();
    });

    const party = await partyManager.createParty();
    await party.open();
    expect(party.isOpen).toBeTruthy();

    await update;
  });

  test('Created via sync', async () => {
    const feedStore = new FeedStore(ram, { feedOptions: { valueEncoding: codec } });
    const modelFactory = new ModelFactory().registerModel(TestModel.type, TestModel);
    const partyManager = new PartyManager(feedStore, modelFactory);
    await partyManager.open();

    const [update, setUpdated] = latch();
    const unsubscribe = partyManager.update.on((party) => {
      log('Open:', String(party));
      expect(party.isOpen).toBeTruthy();
      unsubscribe();
      setUpdated();
    });

    // Create raw party.
    const { publicKey: partyKey } = createKeyPair();
    const feed = await feedStore.openFeed(keyToString(partyKey), { metadata: { partyKey } } as any);
    const feedStream = createWritableFeedStream(feed);
    await feedStream.write(createPartyGenesis(partyKey, feed.key));

    await update;
  });
});
