//
// Copyright 2020 DXOS.org
//

import ram from 'random-access-memory';

import { FeedDescriptor, FeedStore } from '@dxos/feed-store';

import { codec } from '../proto';
import pify from 'pify';
import { dxos } from '../proto/gen/testing';

describe('Feed tests:', () => {
  test('codec', () => {
    const feedDescriptor = new FeedDescriptor('test-feed');

    const message1: dxos.echo.testing.IFeedMessage = {
      halo: {
        genesis: {
          feedKey: feedDescriptor.key
        }
      }
    };

    const buffer = codec.encode(message1);

    const message2: dxos.echo.testing.IFeedMessage = codec.decode(buffer);

    expect(message1).toEqual(message2);
  });

  test('hypercore', async () => {
    const feedStore = new FeedStore(ram, { feedOptions: { valueEncoding: codec } });
    await feedStore.open();

    const feed = await feedStore.openFeed('test-feed');
    expect(feed.length).toBe(0);

    const data: dxos.echo.testing.IFeedMessage = {
      halo: {
        genesis: {
          feedKey: feed.key
        }
      }
    };

    await pify(feed.append.bind(feed))(data);

    expect(feed.length).toBe(1);
    const block = await pify(feed.get.bind(feed))(0);
    expect(block).toEqual(data);
  });
});
