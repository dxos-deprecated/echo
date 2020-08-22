//
// Copyright 2020 DXOS.org
//

import debug from 'debug';
import ram from 'random-access-memory';

import { createId, createKeyPair } from '@dxos/crypto';
import { FeedStore } from '@dxos/feed-store';

import { createOrderedFeedStream, createWritableFeedStream } from '../../../echo-protocol/src/feeds';
import { IEchoStream } from '../items';
import { codec, jsonReplacer } from '../../../echo-protocol/src/proto';
import { createWritable, latch } from '../../../util/src';
import { Pipeline } from './pipeline';
import { createAppendPropertyMutation } from '../testing';
import { TestPartyProcessor } from './test-party-processor';

const log = debug('dxos:echo:pipeline:test');
debug.enable('dxos:echo:*');

// TODO(burdon): Test read-only.
describe('pipeline', () => {
  test('streams', async () => {
    const feedStore = new FeedStore(ram, { feedOptions: { valueEncoding: codec } });
    const feedReadStream = await createOrderedFeedStream(feedStore);
    const feed = await feedStore.openFeed('test-feed');
    const writeStream = createWritableFeedStream(feed);

    //
    // Create pipeline.
    //
    const { publicKey: partyKey } = createKeyPair();
    const partyProcessor = new TestPartyProcessor(partyKey, feed.key);
    const pipeline = new Pipeline(partyProcessor, feedReadStream);
    const [readStream] = await pipeline.open();
    expect(readStream).toBeTruthy();

    //
    // Pipeline consumer.
    // TODO(burdon): Check order (re-use feed-store-iterator test logic).
    //
    const numMessages = 5;
    const [counter, updateCounter] = latch(numMessages);
    readStream.pipe(createWritable<IEchoStream>(async message => {
      log('Processed:', JSON.stringify(message, jsonReplacer, 2));
      updateCounter();
    }));

    //
    // Write directly to feed store.
    // TODO(burdon): Write to multiple feeds.
    //

    const itemId = createId();
    for (let i = 0; i < numMessages; i++) {
      const message = createAppendPropertyMutation(itemId, 'value', String(i));
      writeStream.write(message);
    }

    await counter;
  });
});
