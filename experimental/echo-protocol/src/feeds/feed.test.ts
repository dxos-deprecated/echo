//
// Copyright 2020 DXOS.org
//

import pify from 'pify';
import ram from 'random-access-memory';

import { FeedDescriptor, FeedStore } from '@dxos/feed-store';

import { protocol, codec } from '../proto';

describe('Feed tests:', () => {
  test('codec', () => {
    const feedDescriptor = new FeedDescriptor('test-feed');

    const message1: protocol.dxos.IFeedMessage = {
      halo: {}
    };

    const buffer = codec.encode(message1);

    const message2: protocol.dxos.IFeedMessage = codec.decode(buffer);

    expect(message1).toEqual(message2);
  });

  test('hypercore', async () => {
    const feedStore = new FeedStore(ram, { feedOptions: { valueEncoding: codec } });
    await feedStore.open();

    const feed = await feedStore.openFeed('test-feed');
    expect(feed.length).toBe(0);

    const data: protocol.dxos.IFeedMessage = {
      halo: {}
    };

    await pify(feed.append.bind(feed))(data);

    expect(feed.length).toBe(1);
    const block = await pify(feed.get.bind(feed))(0);
    expect(block).toEqual(data);
  });
});
