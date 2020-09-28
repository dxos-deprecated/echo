//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';
import { Readable } from 'readable-stream';

import { Event } from '@dxos/async';
import { keyToString } from '@dxos/crypto';
import { createBatchStream, FeedDescriptor, FeedStore } from '@dxos/feed-store';
import { Trigger } from '@dxos/util';

import { FeedBlock, FeedKey } from '../types';

const log = debug('dxos:echo:feed-store-iterator');

// TODO(burdon): Redesign FeedStore:
// - event handlers
// - remove path and metadata
// - construction separate from open

// TODO(burdon): Invert (ask for set of feed keys).
export interface FeedSetProvider {
  get(): FeedKey[]
  added: Event<FeedKey>
}

export type MessageSelector = (candidates: FeedBlock[]) => number | undefined;
export type FeedSelector = (descriptor: FeedDescriptor) => boolean;

/**
 * Creates an ordered stream.
 *
 * @param feedStore
 * @param [feedSelector] - Filter for desired feeds.
 * @param [messageSelector] - Returns the index of the selected message candidate (or undefined).
 * @readonly {NodeJS.ReadableStream} readStream stream.
 */
export async function createIterator (
  feedStore: FeedStore,
  feedSelector: FeedSelector = () => true,
  messageSelector: MessageSelector = () => 0
): Promise<FeedStoreIterator> {
  assert(!feedStore.closing && !feedStore.closed);
  if (!feedStore.opened) {
    await feedStore.open();
    await feedStore.ready();
  }
  const iterator = new FeedStoreIterator(feedSelector, messageSelector);

  // TODO(burdon): Only add feeds that belong to party (or use feedSelector).
  const initialDescriptors = feedStore.getDescriptors().filter(descriptor => descriptor.opened);
  for (const descriptor of initialDescriptors) {
    iterator.addFeedDescriptor(descriptor);
  }

  // TODO(burdon): Only add feeds that belong to party (or use feedSelector).
  (feedStore as any).on('feed', (_: never, descriptor: FeedDescriptor) => {
    iterator.addFeedDescriptor(descriptor);
  });

  return iterator;
}

/**
 * We are using an iterator here instead of a stream to ensure we have full control over how and at what time
 * data is read. This allows the consumer (e.g., PartyProcessor) to control the order in which data is generated.
 * (Streams would not be suitable since NodeJS streams have intenal buffer that the system tends to eagerly fill.)
 */
// TODO(marik-d): Add stop method.
export class FeedStoreIterator implements AsyncIterable<FeedBlock> {
  /** Curent set of active feeds. */
  private readonly _candidateFeeds = new Set<FeedDescriptor>();

  /** Feed key as hex => feed state */
  private readonly _openFeeds = new Map<string, {
    descriptor: FeedDescriptor,
    iterator: AsyncIterator<FeedBlock[]>,
    sendQueue: FeedBlock[], // TODO(burdon): Why "send"?
    frozen: boolean,
  }>();

  private readonly _trigger = new Trigger();
  private readonly _generatorInstance = this._generator();

  // Needed for round-robin ordering.
  private _messageCount = 0;

  private _destroyed = false;

  constructor (
    private readonly _feedSelector: FeedSelector,
    private readonly _messageSelector: MessageSelector
  ) {
    assert(_feedSelector);
    assert(_messageSelector);
  }

  /**
   * Adds a feed to be consumed.
   * @param descriptor
   */
  addFeedDescriptor (descriptor: FeedDescriptor) {
    this._candidateFeeds.add(descriptor);
    this._trigger.wake();
    return this;
  }

  /**
   *
   */
  // TODO(burdon): Rename close?
  // TODO(marik-d): Does this need to close the streams, or will they be garbage-collected automatically?
  destroy () {
    this._destroyed = true;
    this._trigger.wake();
  }

  /**
   * This gets called by `for await` loop to get the iterator instance that's then polled on each loop iteration.
   * We return a singleton here to ensure that the `_generator` function only gets called once.
   */
  [Symbol.asyncIterator] () {
    return this._generatorInstance;
  }

  /**
   * @private
   */
  // TODO(burdon): Comment.
  private async _reevaluateFeeds () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [keyHex, feed] of this._openFeeds) {
      if (!this._feedSelector(feed.descriptor)) {
        feed.frozen = true;
      }
    }

    // Get candidate snapshot since we will be mutating the collection.
    for (const descriptor of Array.from(this._candidateFeeds.values())) {
      if (this._feedSelector(descriptor)) {
        const stream = new Readable({ objectMode: true })
          .wrap(createBatchStream(descriptor.feed, { live: true }));

        this._openFeeds.set(keyToString(descriptor.key), {
          descriptor,
          // TODO(burdon): stream[Symbol.asyncIterator] is not a function (in the browser).
          iterator: stream[Symbol.asyncIterator](),
          frozen: false,
          sendQueue: []
        });

        this._candidateFeeds.delete(descriptor);
      }
    }
  }

  /**
   * @private
   */
  // TODO(burdon): Comment.
  private _popSendQueue () {
    const openFeeds = Array.from(this._openFeeds.values());
    const candidates = openFeeds
      .filter(feed => !feed.frozen && feed.sendQueue.length > 0)
      .map(feed => feed.sendQueue[0]);

    if (candidates.length === 0) {
      return undefined;
    }

    const selected = this._messageSelector(candidates);
    if (selected === undefined) {
      return;
    }

    const pickedCandidate = candidates[selected];
    const feed = this._openFeeds.get(keyToString(pickedCandidate.key));
    assert(feed);

    return feed.sendQueue.shift();
  }

  /**
   *
   * @private
   */
  // TODO(burdon): Comment.
  private _pollFeeds () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, feed] of this._openFeeds) {
      if (feed.sendQueue.length === 0) {
        // TODO(burdon): then/catch?
        feed.iterator.next()
          .then(result => {
            assert(!result.done);
            feed.sendQueue.push(...result.value);
            this._trigger.wake();
          }, console.error); // TODO(marik-d): Proper error handling.
      }
    }
  }

  /**
   *
   * @private
   */
  // TODO(burdon): Comment.
  private async _waitForData () {
    this._pollFeeds();

    // TODO(burdon): This should timeout.
    //   There is a (rare) potential race condition where one feed gets blocked on a message that is enqueue
    //   in a demuxed stream. Meanwhile the inbound queue dries up (or is deadlocked) so this trigger is not
    //   awoken. A timeout would enable the iterator to restart.
    //   NOTE: When implementing this mechanism be sure to maintain the comment above.
    await this._trigger.wait();

    log('Ready');
    this._trigger.reset(); // TODO(burdon): Reset atomically?
  }

  /**
   *
   */
  // TODO(burdon): Comment.
  async * _generator () {
    while (!this._destroyed) {
      while (true) {
        await this._reevaluateFeeds();

        // TODO(burdon): This always seems to be undefined.
        const message = this._popSendQueue();
        if (message === undefined) {
          log('Paused...');
          break;
        }

        this._messageCount++;

        // TODO(burdon): Add feedKey (FeedMessage)?
        yield message;
      }

      await this._waitForData();
    }
  }
}