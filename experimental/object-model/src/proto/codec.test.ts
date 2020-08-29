//
// Copyright 2020 DXOS.org
//

import { createId } from '@dxos/crypto';
import { Codec } from '@dxos/codec-protobuf';
import { protocol_dxos, Schema } from '@dxos/experimental-echo-protocol';
import { createAny } from '@dxos/experimental-util';

import ObjectSchema from './gen/object.json';

import { dxos as object_dxos } from './gen/object';

const codec = new Codec('dxos.FeedMessage')
  .addJson(Schema)
  .addJson(ObjectSchema)
  .build();

describe('Protobuf', () => {
  test('merge definitions', () => {
    const message1: protocol_dxos.FeedMessage = {
      echo: {
        itemId: createId(),
        mutation: createAny<object_dxos.echo.object.IObjectMutation>({
          operation: object_dxos.echo.object.ObjectMutation.Operation.SET,
          key: 'title',
          value: {
            string: 'DXOS'
          }
        }, 'dxos.echo.object.ObjectMutation')
      }
    };

    const buffer = codec.encode(message1);
    const message2 = codec.decode(buffer);
    expect(message1).toEqual(message2);
  });
});
