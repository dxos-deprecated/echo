//
// Copyright 2020 DXOS.org
//

import debug from 'debug';
import hypercore from 'hypercore';

import { synchronized } from '@dxos/async';
import { AuthPlugin, Authenticator } from '@dxos/credentials';
import { discoveryKey, keyToString } from '@dxos/crypto';
import { FeedKey, PartyKey } from '@dxos/echo-protocol';
import { NetworkManager } from '@dxos/network-manager';
import { Protocol } from '@dxos/protocol';
import { Replicator } from '@dxos/protocol-plugin-replicator';

import { FeedStoreAdapter } from './feed-store-adapter';
import { FeedSetProvider } from './parties';

const log = debug('dxos:echo:replication-adapter');

export interface CredentialsProvider {
  /**
   * The credentials (eg, a serialized AuthMessage) as a bytes.
   */
  get(): Buffer
}

/**
 * Joins a network swarm with replication protocol. Coordinates opening new feeds in the feed store.
 */
export class ReplicationAdapter {
  private _started = false;

  constructor (
    private readonly _networkManager: NetworkManager,
    private readonly _feedStore: FeedStoreAdapter,
    private readonly _peerId: Buffer,
    private readonly _partyKey: PartyKey,
    private readonly _activeFeeds: FeedSetProvider,
    private readonly _credentials: CredentialsProvider,
    private readonly _authenticator: Authenticator
  ) {}

  start (): void {
    if (this._started) {
      return;
    }
    this._started = true;

    log('Start', keyToString(this._partyKey));
    this._networkManager.joinProtocolSwarm(Buffer.from(this._partyKey), ({ channel }: any) => this._createProtocol(channel));
  }

  stop (): void {
    if (!this._started) {
      return;
    }
    log('Stop');

    // TODO(marik-d): Not implmented.
    this._started = false;
  }

  @synchronized
  private async _openFeed (key: FeedKey): Promise<hypercore.Feed> {
    return this._feedStore.getFeed(key) ?? await this._feedStore.createReadOnlyFeed(key, this._partyKey);
  }

  private _createProtocol (channel: any) {
    const auth = new AuthPlugin(this._peerId, this._authenticator, [Replicator.extension]);

    const replicator = new Replicator({
      load: async () => {
        const partyFeeds = await Promise.all(this._activeFeeds.get().map(feedKey => this._openFeed(feedKey)));
        log(`load feeds ${partyFeeds.map(feed => keyToString(feed.key))}`);
        return partyFeeds.map((feed) => {
          return { discoveryKey: feed.discoveryKey };
        });
      },

      subscribe: (addFeedToReplicatedSet: (feed: any) => void) => this._activeFeeds.added.on(async (feedKey) => {
        log(`add feed ${keyToString(feedKey)}`);
        const feed = await this._openFeed(feedKey);
        addFeedToReplicatedSet({ discoveryKey: feed.discoveryKey });
      }),

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      replicate: async (remoteFeeds: any, info: any) => {
        // We can ignore remoteFeeds entirely, because the set of feeds we want to replicate is dictated by the Party.
        // TODO(telackey): why are we opening feeds? Necessary or belt/braces thinking, or because open party does it?
        log(`replicate: peerId=${info.session.peerId.toString('hex')}, feeds=${this._activeFeeds.get().map(keyToString)}`);
        return Promise.all(this._activeFeeds.get().map(feedKey => this._openFeed(feedKey)));
      }
    });

    const protocol = new Protocol({
      streamOptions: {
        live: true
      },

      discoveryToPublicKey: (dk: any) => {
        if (!discoveryKey(this._partyKey).equals(dk)) {
          return undefined;
        }

        // TODO(marik-d): Why does this do side effects.
        // TODO(burdon): Remove need for external closure (i.e., pass object to this callback).
        protocol.setContext({ topic: keyToString(this._partyKey) });
        return this._partyKey;
      }
    })
      .setSession({
        peerId: this._peerId,
        // TODO(telackey): This ought to be the CredentialsProvider itself, so that fresh credentials can be minted.
        credentials: this._credentials.get().toString('base64')
      })
      .setExtensions([
        auth.createExtension(),
        // TODO(telackey): Offline Invitation handler goes here: new GreetingCommandPlugin....
        replicator.createExtension()
      ])
      .init(channel);

    return protocol;
  }
}
