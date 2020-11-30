//
// Copyright 2020 DXOS.org
//

import { createId, createKeyPair, PublicKey } from '@dxos/crypto';
import { PartySnapshot } from '@dxos/echo-protocol';

import { SnapshotStore } from './snapshot-store';
import { createRamStorage } from './util/persistant-ram-storage';

const createPublicKey = () => PublicKey.from(createKeyPair().publicKey);

test('in-memory', async () => {
  const store = new SnapshotStore(createRamStorage());

  const key1 = createPublicKey();
  const key2 = createPublicKey();

  expect(await store.load(key1)).toBeUndefined();
  expect(await store.load(key2)).toBeUndefined();

  const snapshot: PartySnapshot = {
    partyKey: key1.asBuffer(),
    database: {
      items: [{
        itemId: createId(),
        itemType: 'foo'
      }]
    }
  };

  await store.save(snapshot);

  expect(await store.load(key1)).toEqual(snapshot);
  expect(await store.load(key2)).toBeUndefined();
});
