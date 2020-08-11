//
// Copyright 2020 DXOS.org
//

import debug from 'debug';

import { keyToString } from '@dxos/crypto';
import { Codec } from '@dxos/codec-protobuf';

import TestingSchema from './proto/gen/testing.json';

import { google, dxos } from './proto/gen/testing';

import IAny = google.protobuf.IAny;
import ITestEnvelope = dxos.echo.testing.ITestEnvelope;
import ITestPayload = dxos.echo.testing.ITestPayload;
import TestPayload = dxos.echo.testing.TestPayload;
import TestEnvelope = dxos.echo.testing.TestEnvelope;

const log = debug('dxos:echo:prototesting');

const codec = new Codec('dxos.echo.testing.Envelope')
  .addJson(TestingSchema)
  .build();

describe('Protocol buffers and typescript types.', () => {
  test('flatjson', () => {
    // Test case coded like protobuf.test.ts : passes

    const consumePayload = (payload: ITestPayload): number => {
      // TODO(richburdon): How do we want to code this? Magic undefined cast as below, or
      // if undefined throw exception, or codec implements required field?
      return payload.testfield!;
    };

    // This only works because the return type is not checked (it isn't ITestPayload).
    const producePayload = (value: number) => {
      const payload = {
        __type_url: 'dxos.echo.testing.TestPayload',
        testfield: value
      };
      return payload;
    };

    const message1 = producePayload(123);
    // Output: {"__type_url":"dxos.echo.testing.TestPayload","testfield":123}
    log(`message1: ${JSON.stringify(message1)}`);

    const buffer = codec.encode({ message: message1 });
    log(`buffer: ${keyToString(buffer)}`);

    const message2 = codec.decode(buffer).message;
    // Output: 0a230a1d64786f732e6563686f2e74657374696e672e546573745061796c6f61641202087b -- message was encoded.
    log(`message2: ${JSON.stringify(message2)}`);

    expect(message1).toEqual(message2);

    const value = consumePayload(message2);

    expect(value).toEqual(123);
  });

  test('flatts', () => {
    // Test case coded like models written in ts would be coded : fails

    const consumePayload = (payload: ITestPayload): number => {
      return payload.testfield!;
    };

    const producePayload = (value: number): ITestPayload => {
      const payload = new TestPayload();
      payload.testfield = value;
      // We need this line for the codec to work, but it throws a TS2339 error.
      // payload.__type_url = 'dxos.echo.testing.TestPayload';
      return payload;
    };

    const message1 = producePayload(123);
    // Output: message1: {"testfield":123} -- no __type_url property.
    log(`message1: ${JSON.stringify(message1)}`);

    const buffer = codec.encode({ message: message1 });
    // Output: buffer: 0a00 -- nothing encoded because __type_url missing (no exception thrown??).
    log(`buffer: ${keyToString(buffer)}`);

    const message2 = codec.decode(buffer).message;
    log(`message2: ${JSON.stringify(message2)}`);

    // Fails because we encoded to zero bytes above.
    expect(message1).toEqual(message2);

    const value = consumePayload(message2);

    expect(value).toEqual(123);
  });

  test('flatts-hack', () => {
    // Test case above hacked to force __type_url with casting -- passes.

    const consumePayload = (payload: ITestPayload): number => {
      return payload.testfield!;
    };

    const producePayload = (value: number): any => {
      const payload = new TestPayload();
      payload.testfield = value;
      const payloadAsAny = payload as any;
      payloadAsAny.__type_url = 'dxos.echo.testing.TestPayload';
      return payloadAsAny;
    };

    const message1 = producePayload(123);
    // Output: message1: {"testfield":123} -- no __type_url property.
    log(`message1: ${JSON.stringify(message1)}`);

    const buffer = codec.encode({ message: message1 });
    // Output: buffer: 0a00 -- nothing encoded because __type_url missing (no exception thrown??).
    log(`buffer: ${keyToString(buffer)}`);

    const message2 = codec.decode(buffer).message;
    log(`message2: ${JSON.stringify(message2)}`);

    // Fails because we encoded to zero bytes above.
    expect(message1).toEqual(message2);

    const value = consumePayload(message2);

    expect(value).toEqual(123);
  });

  test('nestedts', () => {
    const consumeEnvelope = (envelope: ITestEnvelope): number => {
      const payload: ITestPayload = envelope.payload as ITestPayload;
      return payload.testfield!;
    };

    const produceEnvelope = (value: number): ITestEnvelope => {
      const payload = new TestPayload();
      payload.testfield = value;
      // Next line produces TS2339 compiler error.
      // payload.__type_url = 'dxos.echo.testing.TestPayload';
      const envelope = new TestEnvelope();
      log(`payload: ${JSON.stringify(payload)}`);
      // This doesn't work (payload is not seen by encode later):
      envelope.payload = payload as IAny;
      return envelope;
    };

    const message1 = produceEnvelope(123);
    log(`message1: ${JSON.stringify(message1)}`);

    const buffer = codec.encode({ message: message1 });
    log(`buffer: ${keyToString(buffer)}`);

    const message2 = codec.decode(buffer).message;
    log(`message2: ${JSON.stringify(message2)}`);

    expect(message1).toEqual(message2);

    const value = consumeEnvelope(message2);

    expect(value).toEqual(123);
  });

  test('toJSON/StrictEqual', () => {
    const produceEnvelope = (value: number): ITestEnvelope => {
      const payload = new TestPayload();
      payload.testfield = value;
      // Next line produces TS2339 compiler error.
      // payload.__type_url = 'dxos.echo.testing.TestPayload';
      const envelope = new TestEnvelope();
      log(`payload: ${JSON.stringify(payload)}`);
      // This doesn't work (payload is not seen by encode later):
      envelope.payload = payload as IAny;
      return envelope;
    };

    const message1 = produceEnvelope(123);
    // Output : {"payload":{}} -- the contents of message1.payload appear vanished!
    log(`message1: ${JSON.stringify(message1)}`);

    const copy = { ...message1 };
    // Output : {"payload":{"testfield":123}} -- the contents of message1.payload came back!
    log(`copy: ${JSON.stringify(copy)}`);
    expect(copy).toStrictEqual({ payload: new TestPayload({ testfield: 123 }) });

    // This will fail, even though message1.payload === {"testfield":123} because toStrictEqual()
    // depends on toJSON(), which doesn't work (see above).
    expect(message1).toStrictEqual({ payload: new TestPayload({ testfield: 123 }) });
  });
});