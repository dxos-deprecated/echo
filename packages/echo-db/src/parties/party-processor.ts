//
// Copyright 2020 DXOS.org
//

import debug from 'debug';

import { Event } from '@dxos/async';
import { Party as PartyStateMachine, KeyType, KeyRecord } from '@dxos/credentials';
import { keyToString } from '@dxos/crypto';
import { PartyKey, IHaloStream, FeedKey, PublicKey } from '@dxos/echo-protocol';
import { jsonReplacer } from '@dxos/util';

const log = debug('dxos:echo:halo-party-processor');

export interface FeedSetProvider {
  get(): FeedKey[]
  added: Event<FeedKey>
}

/**
 * Party processor for testing.
 */
export class PartyProcessor {
  protected readonly _feedAdded = new Event<FeedKey>()

  private readonly _stateMachine: PartyStateMachine;

  public readonly keyAdded: Event<KeyRecord>;

  constructor (
    private readonly _partyKey: PartyKey
  ) {
    this._stateMachine = new PartyStateMachine(this._partyKey);

    // TODO(telackey) @dxos/credentials was only half converted to TS. In its current state, the KeyRecord type
    // is not exported, and the PartyStateMachine being used is not properly understood as an EventEmitter by TS.
    // Casting to 'any' is a workaround for the compiler, but the fix is fully to convert @dxos/credentials to TS.
    const state = this._stateMachine as any;

    // TODO(marik-d): Use Event.wrap here.
    state.on('admit:feed', (keyRecord: any) => {
      log(`Feed key admitted ${keyToString(keyRecord.publicKey)}`);
      this._feedAdded.emit(keyRecord.publicKey);
    });

    this.keyAdded = Event.wrap(state, 'admit:key');
  }

  get partyKey () {
    return this._partyKey;
  }

  get feedKeys () {
    return this._stateMachine.memberFeeds;
  }

  get memberKeys () {
    return this._stateMachine.memberKeys;
  }

  get credentialMessages () {
    return this._stateMachine.credentialMessages;
  }

  get infoMessages () {
    return this._stateMachine.infoMessages;
  }

  get genesisRequired () {
    return this._stateMachine.credentialMessages.size === 0;
  }

  isFeedAdmitted (feedKey: FeedKey) {
    return this._stateMachine.credentialMessages.has(keyToString(feedKey));
  }

  getMemberInfo (publicKey: PublicKey) {
    // TODO(telackey): Normalize PublicKey types in @dxos/credentials.
    return this._stateMachine.getInfo(Buffer.from(publicKey));
  }

  // TODO(burdon): Rename xxxProvider.
  getActiveFeedSet (): FeedSetProvider {
    return {
      get: () => this.feedKeys,
      added: this._feedAdded
    };
  }

  async takeHints (feedKeys: FeedKey[]) {
    log(`addHints ${feedKeys.map(key => keyToString(key))}`);
    // Gives state machine hints on initial feed set from where to read party genesis message.
    // TODO(telackey): Hints were not intended to provide a feed set for PartyGenesis messages. They are about
    // what feeds and keys to trust immediately after Greeting, before we have had the opportunity to replicate the
    // credential messages for ourselves.
    await this._stateMachine.takeHints(feedKeys.map(publicKey => ({ publicKey, type: KeyType.FEED })));
  }

  async processMessage (message: IHaloStream): Promise<void> {
    log(`Processing: ${JSON.stringify(message, jsonReplacer)}`);
    const { data } = message;
    return this._stateMachine.processMessages([data]);
  }
}
