//
// Copyright 2020 DXOS.org
//

import { FeedKey, PartyKey, createOrderedFeedStream } from '@dxos/experimental-echo-protocol';
import { FeedStoreAdapter } from './feed-store-adapter';
import { keyToString, keyToBuffer } from '@dxos/crypto';
import assert from 'assert';
import { PartyProcessor, Pipeline } from './parties';
import { createWritableFeedStream } from '@dxos/experimental-util';
import { ReplicatorFactory } from './replication';
import { ModelFactory } from '@dxos/experimental-model-factory';
import { Party, PARTY_ITEM_TYPE } from './parties/party';
import { Keyring, KeyType, createPartyGenesisMessage } from '@dxos/credentials';

import { ObjectModel } from '@dxos/experimental-object-model';
import pify from 'pify';

interface Options {
  readLogger?: NodeJS.ReadWriteStream;
  writeLogger?: NodeJS.ReadWriteStream;
  readOnly?: boolean;
}

export class PartyFactory {
  private readonly _keyring = new Keyring();

  constructor (
    private readonly _feedStore: FeedStoreAdapter,
    private readonly _modelFactory: ModelFactory,
    private readonly _replicatorFactory: ReplicatorFactory | undefined,
    private readonly _options: Options = {}
  ) { }

  get keyring () { return this._keyring; }

  async createParty (): Promise<Party> {
    assert(!this._options.readOnly);

    // TODO(telackey): Proper identity and keyring management.
    const partyKey = await this._keyring.createKeyRecord({ type: KeyType.PARTY });
    const identityKey = await this._keyring.createKeyRecord({ type: KeyType.IDENTITY });

    const feed = await this._feedStore.openFeed(keyToBuffer(partyKey.key), partyKey.publicKey);
    const feedKey = await this._keyring.addKeyRecord({
      publicKey: feed.key,
      secretKey: feed.secretKey,
      type: KeyType.FEED
    });

    const party = await this.constructParty(partyKey.publicKey, []);

    // TODO(burdon): Call party processor to write genesis, etc.
    const message = createPartyGenesisMessage(this._keyring, partyKey, feedKey, identityKey);
    await pify(feed.append.bind(feed))({ halo: message });

    // Connect the pipeline.
    await party.open();

    // Create special properties item.
    await party.createItem(ObjectModel.meta.type, PARTY_ITEM_TYPE);

    return party;
  }

  async addParty (partyKey: PartyKey, feeds: FeedKey[]) {
    const feed = await this._feedStore.openFeed(partyKey, partyKey);
    const feedKey = await this._keyring.addKeyRecord({
      publicKey: feed.key,
      secretKey: feed.secretKey,
      type: KeyType.FEED
    });

    const party = await this.constructParty(partyKey, feeds);
    await party.open();
    // TODO(marik-d): Refactor so it doesn't return a tuple
    return { party, feedKey };
  }

  async constructParty (partyKey: PartyKey, feedKeys: FeedKey[]) {
    // TODO(burdon): Ensure that this node's feed (for this party) has been created first.
    //   I.e., what happens if remote feed is synchronized first triggering 'feed' event above.
    //   In this case create pipeline in read-only mode.
    const feed = this._feedStore.getFeed(partyKey);
    assert(feed, `Feed not found for party: ${keyToString(partyKey)}`);

    // Create pipeline.
    // TODO(telackey): To use HaloPartyProcessor here we cannot keep passing FeedKey[] arrays around, instead
    // we need to use createFeedAdmitMessage to a write a properly signed message FeedAdmitMessage and write it,
    // like we do above for the PartyGenesis message.
    const partyProcessor = new PartyProcessor(partyKey);
    await partyProcessor.addHints([feed.key, ...feedKeys]);
    const feedReadStream = await createOrderedFeedStream(
      this._feedStore.feedStore, partyProcessor.feedSelector, partyProcessor.messageSelector);
    const feedWriteStream = createWritableFeedStream(feed);
    const pipeline =
      new Pipeline(partyProcessor, feedReadStream, feedWriteStream, this._replicatorFactory, this._options);

    // Create party.
    const party = new Party(this._modelFactory, pipeline, partyProcessor);

    return party;
  }
}
