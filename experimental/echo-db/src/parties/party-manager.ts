//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';
import hypercore from 'hypercore';
import pify from 'pify';

import { Event } from '@dxos/async';
import { createKeyPair, keyToString, keyToBuffer } from '@dxos/crypto';
import { FeedDescriptor, FeedStore } from '@dxos/feed-store';
import { createOrderedFeedStream, createPartyGenesis, PartyKey, FeedKey } from '@dxos/experimental-echo-protocol';
import { ModelFactory } from '@dxos/experimental-model-factory';
import { ObjectModel } from '@dxos/experimental-object-model';
import { createWritableFeedStream } from '@dxos/experimental-util';

import { Party, PARTY_ITEM_TYPE } from './party';
import { Pipeline } from './pipeline';
import { TestPartyProcessor } from './test-party-processor';
import { FeedSetProvider } from './party-processor';

const log = debug('dxos:echo:party-manager');

export interface Options {
  readLogger?: NodeJS.ReadWriteStream;
  writeLogger?: NodeJS.ReadWriteStream;
  replicationMixin?: (partyKey: Uint8Array, feedSet: FeedSetProvider) => void,
}

/**
 * Manages the life-cycle of parties.
 */
export class PartyManager {
  // Map of parties by party key.
  // NOTE: Buffer equivalence doesn't work for map.
  private readonly _parties = new Map<string, Party>();

  private readonly _feedStore: FeedStore;
  private readonly _modelFactory: ModelFactory;
  private readonly _options: Options;

  private readonly _onFeed: (feed: hypercore.Feed, descriptor: FeedDescriptor) => void;

  // External event listener.
  // TODO(burdon): Wrap with subscribe.
  readonly update = new Event<Party>();

  /**
   * @param feedStore
   * @param modelFactory
   * @param options
   */
  constructor (feedStore: FeedStore, modelFactory: ModelFactory, options?: Options) {
    assert(feedStore);
    assert(modelFactory);
    this._feedStore = feedStore;
    this._modelFactory = modelFactory;
    this._options = options || {};

    // Listen for feed construction.
    this._onFeed = async (feed: hypercore.Feed, descriptor: FeedDescriptor) => {
      // NOTE: Party creation (below) creates a new feed which immediately triggers this event.
      // We need to defer execution of the event processing until the Party object has been
      // constructed and mapped -- otherwise we will inadvertantly cause a new instance to be created.
      setImmediate(async () => {
        const { metadata: { partyKey } } = descriptor;
        assert(partyKey);
        const party = await this._getOrCreateParty(partyKey);
        await party.open();
        this.update.emit(party);
      });
    };
  }

  async open () {
    await this._feedStore.open();
    (this._feedStore as any).on('feed', this._onFeed);

    // Iterate descriptors and pre-create Party objects.
    for (const descriptor of this._feedStore.getDescriptors()) {
      const { metadata: { partyKey } } = descriptor;
      assert(partyKey);
      if (!this._parties.has(keyToString(partyKey))) {
        await this._constructParty(partyKey);
      }
    }
  }

  async close () {
    (this._feedStore as any).off('feed', this._onFeed);
    await this._feedStore.close();
  }

  get parties (): Party[] {
    return Array.from(this._parties.values());
  }

  /**
   * Creates a new party, writing its genesis block to the stream.
   */
  async createParty (): Promise<Party> {
    const { publicKey: partyKey } = createKeyPair();
    const feed = await this._feedStore.openFeed(keyToString(partyKey), { metadata: { partyKey } } as any);
    const party = await this._constructParty(partyKey);
    log(`Created: ${String(party)}`);

    // TODO(burdon): Call party processor to write genesis, etc.
    const message = createPartyGenesis(partyKey, feed.key);
    await pify(feed.append.bind(feed))(message);

    // Connect the pipeline.
    await party.open();

    // Create special properties item.
    await party.createItem(PARTY_ITEM_TYPE, ObjectModel.meta.type);

    return party;
  }

  /**
   * Gets existing party object or constructs a new one.
   * @param partyKey
   */
  async _getOrCreateParty (partyKey: PartyKey): Promise<Party> {
    let party = this._parties.get(keyToString(partyKey));
    if (!party) {
      party = await this._constructParty(partyKey);
    }

    return party;
  }

  /**
   * Constructs and registers a party object.
   * @param partyKey
   */
  async _constructParty (partyKey: PartyKey): Promise<Party> {
    // TODO(burdon): Ensure that this node's feed (for this party) has been created first.
    //   I.e., what happens if remote feed is synchronized first triggering 'feed' event above.
    //   In this case create pipeline in read-only mode.
    const descriptor = this._feedStore.getDescriptors().find(descriptor => descriptor.path === keyToString(partyKey));
    assert(descriptor, `Feed not found for party: ${keyToString(partyKey)}`);
    const feed = descriptor.feed;

    // Create pipeline.
    const partyProcessor = new TestPartyProcessor(partyKey, [feed.key]);
    const feedReadStream = await createOrderedFeedStream(
      this._feedStore, partyProcessor.feedSelector, partyProcessor.messageSelector);
    const feedWriteStream = createWritableFeedStream(feed);
    const pipeline = new Pipeline(partyProcessor, feedReadStream, feedWriteStream, this._options);

    // Kick off replication
    // TODO(marik-d): Set-up cleanup callbacks
    this._options.replicationMixin?.(partyKey, partyProcessor.getActiveFeedSet());

    // Create party.
    const party = new Party(this._modelFactory, pipeline, partyProcessor);
    this._parties.set(keyToString(party.key), party);

    return party;
  }

  async constructRemoteParty(partyKey: PartyKey, feeds: FeedKey[]) {
    const feed = await this._feedStore.openFeed(keyToString(partyKey), { metadata: { partyKey } } as any);
    // TODO(marik-d): Duplicated code
     const partyProcessor = new TestPartyProcessor(partyKey, [...feeds, feed.key]);
     const feedReadStream = await createOrderedFeedStream(
       this._feedStore, partyProcessor.feedSelector, partyProcessor.messageSelector);
     const feedWriteStream = createWritableFeedStream(feed);
     const pipeline = new Pipeline(partyProcessor, feedReadStream, feedWriteStream, this._options);
 
     // Kick off replication
     // TODO(marik-d): Set-up cleanup callbacks
     this._options.replicationMixin?.(partyKey, partyProcessor.getActiveFeedSet());
 
     // Create party.
     const party = new Party(this._modelFactory, pipeline, partyProcessor);
     this._parties.set(keyToString(party.key), party);
 
     return { party, ownFeed: feed.key };
  }
}
