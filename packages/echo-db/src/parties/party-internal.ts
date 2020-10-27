//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { synchronized } from '@dxos/async';
import { PartyKey, PartySnapshot } from '@dxos/echo-protocol';
import { ModelFactory } from '@dxos/model-factory';
import { NetworkManager } from '@dxos/network-manager';
import { ObjectModel } from '@dxos/object-model';

import {
  GreetingResponder, InvitationDescriptor, InvitationDescriptorType, InvitationAuthenticator, InvitationOptions
} from '../invitations';
import { createItemDemuxer, Item, ItemManager } from '../items';
import { DatabaseSnasphotRecorder } from '../items/snapshot-recorder';
import { TimeframeClock } from '../items/timeframe-clock';
import { ReplicationAdapter } from '../replication';
import { IdentityManager } from './identity-manager';
import { PartyProcessor } from './party-processor';
import { Pipeline } from './pipeline';

// TODO(burdon): Format?
export const PARTY_ITEM_TYPE = 'wrn://dxos.org/item/party';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PartyFilter {}

/**
 * A Party represents a shared dataset containing queryable Items that are constructed from an ordered stream
 * of mutations.
 */
export class PartyInternal {
  private _itemManager: ItemManager | undefined;
  private _itemDemuxer: NodeJS.WritableStream | undefined;
  private _unsubscribePipelineErrors: (() => void) | undefined;
  private _snapshotRecorder: DatabaseSnasphotRecorder | undefined;

  /**
   * The Party is constructed by the `Database` object.
   */
  constructor (
    private readonly _modelFactory: ModelFactory,
    private readonly _partyProcessor: PartyProcessor,
    private readonly _pipeline: Pipeline,
    private readonly _identityManager: IdentityManager,
    private readonly _networkManager: NetworkManager,
    private readonly _replicator: ReplicationAdapter,
    private readonly _timeframeClock: TimeframeClock
  ) {
    assert(this._modelFactory);
    assert(this._partyProcessor);
    assert(this._pipeline);
  }

  get key (): PartyKey {
    return this._pipeline.partyKey;
  }

  get isOpen (): boolean {
    return !!this._itemManager;
  }

  get itemManager () {
    return this._itemManager;
  }

  get processor () {
    return this._partyProcessor;
  }

  get pipeline () {
    return this._pipeline;
  }

  /**
   * Opens the pipeline and connects the streams.
   */
  @synchronized
  async open () {
    if (this._itemManager) {
      return this;
    }

    // TODO(burdon): Support read-only parties.
    const [readStream, writeStream] = await this._pipeline.open();

    // Connect to the downstream item demuxer.
    this._itemManager = new ItemManager(this.key, this._modelFactory, this._timeframeClock, writeStream);
    this._snapshotRecorder = new DatabaseSnasphotRecorder(this._itemManager);
    this._itemDemuxer = createItemDemuxer(this._itemManager, this._snapshotRecorder);
    readStream.pipe(this._itemDemuxer);

    if (this._pipeline.outboundHaloStream) {
      this._partyProcessor.setOutboundStream(this._pipeline.outboundHaloStream);
    }

    // Replication.
    this._replicator.start();

    // TODO(burdon): Propagate errors.
    this._unsubscribePipelineErrors = this._pipeline.errors.on(err => console.error(err));

    return this;
  }

  /**
   * Closes the pipeline and streams.
   */
  @synchronized
  async close () {
    if (!this._itemManager) {
      return this;
    }

    this._replicator.stop();

    // Disconnect the read stream.
    this._pipeline.inboundEchoStream?.unpipe(this._itemDemuxer);

    this._itemManager = undefined;
    this._itemDemuxer = undefined;

    // TODO(burdon): Create test to ensure everything closes cleanly.
    await this._pipeline.close();

    this._unsubscribePipelineErrors!();

    return this;
  }

  /**
   * Creates an invition for a remote peer.
   */
  async createInvitation (authenticationDetails: InvitationAuthenticator, options: InvitationOptions = {}) {
    assert(this._pipeline.outboundHaloStream);
    assert(this._networkManager);

    const responder = new GreetingResponder(
      this._identityManager,
      this._networkManager,
      this._partyProcessor
    );

    const { secretValidator, secretProvider } = authenticationDetails;
    const { onFinish, expiration } = options;

    const swarmKey = await responder.start();
    const invitation = await responder.invite(secretValidator, secretProvider, onFinish, expiration);

    return new InvitationDescriptor(
      InvitationDescriptorType.INTERACTIVE,
      swarmKey,
      invitation,
      this.isHalo ? Buffer.from(this.key) : undefined
    );
  }

  /**
   * Returns a special Item that is used by the Party to manage its properties.
   */
  getPropertiestItem (): Item<ObjectModel> {
    assert(this._itemManager);
    const { value: items } = this._itemManager.queryItems({ type: PARTY_ITEM_TYPE });
    assert(items.length === 1);
    return items[0];
  }

  get isHalo () {
    // The PartyKey of the HALO is the Identity key.
    return this._identityManager.identityKey.publicKey.equals(this.key);
  }

  makeSnapshot (): PartySnapshot {
    assert(this._snapshotRecorder, 'Party not open.');
    return {
      timeframe: this._timeframeClock.timeframe,
      database: this._snapshotRecorder.makeSnapshot(),
      halo: this._partyProcessor.makeSnapshot()
    };
  }
}
