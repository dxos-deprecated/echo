//
// Copyright 2020 DXOS.org
//

import debug from 'debug';

import { expectToThrow } from '@dxos/async';
import { createKeyPair, createId } from '@dxos/crypto';
import { WritableArray } from '@dxos/util';

import { ValueUtil } from './mutation';
import { ObjectModel } from './object-model';

const log = debug('dxos:echo:object-model:testing');
debug.enable('dxos:echo:*');

describe('object model', () => {
  test('read-only', async () => {
    const itemId = createId();
    const model = new ObjectModel(ObjectModel.meta, itemId);
    expect(model.itemId).toBe(itemId);
    expect(model.toObject()).toEqual({});
    log(model.toObject());

    expectToThrow(async () => {
      await model.setProperty('title', 'DXOS');
    });
  });

  test('mutation', async () => {
    const buffer = new WritableArray<Uint8Array>();

    const itemId = createId();
    const model = new ObjectModel(ObjectModel.meta, itemId, buffer);
    expect(model.itemId).toBe(itemId);
    expect(model.toObject()).toEqual({});
    log(model.toObject());

    // Update.
    await model.setProperty('title', 'DXOS');
    expect(buffer.objects).toHaveLength(1);
    const { mutations } = ObjectModel.meta.mutation.decode(buffer.objects[0]);
    expect(mutations).toHaveLength(1);
    const mutation = mutations![0];
    expect(mutation).toStrictEqual({
      operation: 0,
      key: 'title',
      value: ValueUtil.createMessage('DXOS')
    });

    // Process.
    const { publicKey: feedKey } = createKeyPair();
    const meta = { feedKey, seq: 0 };
    await model.processMessage(meta, ObjectModel.meta.mutation.decode(buffer.objects[0]));
    expect(model.toObject()).toStrictEqual({
      title: 'DXOS'
    });
  });
});
