//
// Copyright 2020 DXOS.org
//

import { FeedKey } from '../defs';
import { TestModel } from './test-model';
import { LogicalClockStamp } from '../clock/logical-clock-stamp';
import { ItemID } from '../items';

//
// Test generators.
// TODO(burdon): Move to testing.
//

export const createAdmit = (feedKey: FeedKey) => ({
  message: {
    __type_url: 'dxos.echo.testing.Admit',
    feedKey
  }
});

export const createRemove = (feedKey: FeedKey) => ({
  message: {
    __type_url: 'dxos.echo.testing.Remove',
    feedKey
  }
});

// TODO(burdon): Use mutation instead.
export const createMessage = (data: number) => ({
  message: {
    __type_url: 'dxos.echo.testing.TestData',
    data
  }
});

export const createItemGenesis = (itemId: ItemID, type: string, timestamp?: LogicalClockStamp) => ({
  message: {
    __type_url: 'dxos.echo.testing.ItemEnvelope',
    itemId,
    timestamp: timestamp ? LogicalClockStamp.encode(timestamp) : undefined,
    payload: {
      __type_url: 'dxos.echo.testing.ItemGenesis',
      type,
      model: TestModel.type
    }
  }
});

export const createItemMutation = (itemId: ItemID, key: string, value: string, timestamp?: LogicalClockStamp) => ({
  message: {
    __type_url: 'dxos.echo.testing.ItemEnvelope',
    itemId,
    timestamp: timestamp ? LogicalClockStamp.encode(timestamp) : undefined,
    payload: {
      __type_url: 'dxos.echo.testing.ItemMutation',
      key,
      value
    }
  }
});

export const createTestMessageWithTimestamp = (timestamp: LogicalClockStamp, feedKey: Buffer, seq: number) => ({
  data: {
    message: {
      __type_url: 'dxos.echo.testing.ItemEnvelope',
      timestamp: LogicalClockStamp.encode(timestamp)
    }
  },
  key: feedKey,
  seq
});

export const createExpectedFeedMessage = (data: any) => ({ data, key: expect.any(Buffer), seq: expect.any(Number), sync: expect.any(Boolean) });

/**
 * Turns a stream into constantly mutating array of all messages emmited by the stream.
 * Triggers stream consumption.
 * @param stream
 */
export const collect = (stream: NodeJS.ReadableStream) => {
  const arr: any[] = [];
  stream.on('data', data => { arr.push(data); });
  return arr;
};
