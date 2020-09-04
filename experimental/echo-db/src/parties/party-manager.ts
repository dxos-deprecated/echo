//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';
import hypercore from 'hypercore';
import pify from 'pify';

import { Event, Lock } from '@dxos/async';
import { createPartyGenesisMessage, Keyring, KeyType } from '@dxos/credentials';
import { keyToString } from '@dxos/crypto';
import { createOrderedFeedStream, FeedKey, PartyKey, PublicKey } from '@dxos/experimental-echo-protocol';
import { ModelFactory } from '@dxos/experimental-model-factory';
import { ObjectModel } from '@dxos/experimental-object-model';
import { createWritableFeedStream, ComplexMap } from '@dxos/experimental-util';
import { FeedDescriptor, FeedStore } from '@dxos/feed-store';

import { ReplicatorFactory } from '../replication';
import { Party, PARTY_ITEM_TYPE } from './party';
import { Pipeline } from './pipeline';
import { TestPartyProcessor } from './test-party-processor';
import { InvitationResponder } from '../invitation';
import { PartyProcessor } from './party-processor';

const log = debug('dxos:echo:party-manager');

interface Options {
  readLogger?: NodeJS.ReadWriteStream;
  writeLogger?: NodeJS.ReadWriteStream;
  readOnly?: boolean;
  partyProcessorFactory?: (partyKey: PartyKey, feedKeys: FeedKey[]) => PartyProcessor;
}

/**
 * Manages the life-cycle of parties.
 */
export class PartyManager {
  // Map of parties by party key.
  private readonly _parties = new ComplexMap<PublicKey, Party>(keyToString);

  private readonly _feedStore: FeedStore;
  private readonly _modelFactory: ModelFactory;
  private readonly _options: Options;

  private readonly _onFeed: (feed: hypercore.Feed, descriptor: FeedDescriptor) => void;

  // External event listener.
  // TODO(burdon): Wrap with subscribe.
  readonly update = new Event<Party>();

  // TODO(telackey): Workaround for pre-existing race condition. See longer comment in _constructParty.
  private readonly _lock = new Lock();

  /**
   * @param feedStore
   * @param modelFactory
   * @param options
   */
  constructor (
    feedStore: FeedStore,
    modelFactory: ModelFactory,
    private readonly replicatorFactory?: ReplicatorFactory,
    options?: Options
  ) {
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
      if (!this._parties.has(partyKey)) {
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
    assert(!this._options.readOnly);

    // TODO(telackey): Proper identity and keyring management.
    const keyring = new Keyring();
    const partyKey = await keyring.createKeyRecord({ type: KeyType.PARTY });
    const identityKey = await keyring.createKeyRecord({ type: KeyType.IDENTITY });

    const feed = await this._feedStore.openFeed(partyKey.key, { metadata: { partyKey: partyKey.publicKey } } as any);
    const feedKey = await keyring.addKeyRecord({
      publicKey: feed.key,
      secretKey: feed.secretKey,
      type: KeyType.FEED
    });

    const party = await this._constructParty(partyKey.publicKey);
    log(`Created: ${String(party)}`);

    // TODO(burdon): Call party processor to write genesis, etc.
    const message = createPartyGenesisMessage(keyring, partyKey, feedKey, identityKey);
    await pify(feed.append.bind(feed))({ halo: message });

    // Connect the pipeline.
    await party.open();

    // Create special properties item.
    await party.createItem(ObjectModel.meta.type, PARTY_ITEM_TYPE);

    return party;
  }

  /**
   * Construct a party object and start replicating with the remote peer that created that party.
   * @param partyKey
   * @param feeds Set of feeds belonging to that party
   */
  async addParty (partyKey: PartyKey, feeds: FeedKey[]) {
    const keyring = new Keyring();
    const feed = await this._feedStore.openFeed(keyToString(partyKey), { metadata: { partyKey } } as any);
    const feedKey = await keyring.addKeyRecord({
      publicKey: feed.key,
      secretKey: feed.secretKey,
      type: KeyType.FEED
    });

    const party = await this._constructParty(partyKey, feeds);

    return new InvitationResponder(
      party,
      keyring,
      feedKey
    );
  }

  /**
   * Gets existing party object or constructs a new one.
   * @param partyKey
   */
  async _getOrCreateParty (partyKey: PartyKey): Promise<Party> {
    return this._parties.get(partyKey)
      ?? await this._constructParty(partyKey);
  }

  /**
   * Constructs and registers a party object.
   * @param partyKey
   * @param feedKeys Extra set of feeds to be included in the party
   */
  async _constructParty (partyKey: PartyKey, feedKeys: FeedKey[] = []): Promise<Party> {
    // TODO(telackey): I added this lock as a workaround for a race condition in the existing (before this PR) party
    // creation code that caused intermittent database test failures for me. The race is between creating a Party, which
    // makes a new feed and calls _constructParty, and the FeedStore firing its onFeed event, the handler for which
    // calls _getOrCreateParty. If the event handler happens to be executed before the first call to _constructParty
    // has finished, this will result in _constructParty being called twice for the same party key.
    // For discussion: how to fix this race properly.
    return await this._lock.executeSynchronized(async () => {
      if (this._parties.has(partyKey)) {
        return this._parties.get(partyKey)!;
      }

      // TODO(burdon): Ensure that this node's feed (for this party) has been created first.
      //   I.e., what happens if remote feed is synchronized first triggering 'feed' event above.
      //   In this case create pipeline in read-only mode.
      const descriptor = this._feedStore.getDescriptors().find(descriptor => descriptor.path === keyToString(partyKey));
      assert(descriptor, `Feed not found for party: ${keyToString(partyKey)}`);
      const feed = descriptor.feed;

      // Create pipeline.
      // TODO(telackey): To use HaloPartyProcessor here we cannot keep passing FeedKey[] arrays around, instead
      // we need to use createFeedAdmitMessage to a write a properly signed message FeedAdmitMessage and write it,
      // like we do above for the PartyGenesis message.
      const partyProcessorFactory = this._options.partyProcessorFactory ?? ((partyKey, feedKeys) => new TestPartyProcessor(partyKey, feedKeys));
      const partyProcessor = partyProcessorFactory(partyKey, [feed.key, ...feedKeys]);
      await partyProcessor.init();
      const feedReadStream = await createOrderedFeedStream(
        this._feedStore, partyProcessor.feedSelector, partyProcessor.messageSelector);
      const feedWriteStream = createWritableFeedStream(feed);
      const pipeline = new Pipeline(partyProcessor, feedReadStream, feedWriteStream, this.replicatorFactory, this._options);

      // Create party.
      const party = new Party(this._modelFactory, pipeline, partyProcessor, feed.key);
      assert(!this._parties.has(party.key));
      this._parties.set(party.key, party);

      return party;
    });
  }
}
