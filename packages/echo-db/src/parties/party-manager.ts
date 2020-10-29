//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';

import { Event, synchronized } from '@dxos/async';
import { KeyHint } from '@dxos/credentials';
import { keyToString } from '@dxos/crypto';
import { PartyKey, PublicKey } from '@dxos/echo-protocol';
import { ComplexMap } from '@dxos/util';

import { FeedStoreAdapter } from '../feed-store-adapter';
import { SecretProvider } from '../invitations/common';
import { InvitationDescriptor } from '../invitations/invitation-descriptor';
import { SnapshotStore } from '../snapshot-store';
import { IdentityManager } from './identity-manager';
import { HaloCreationOptions, PartyFactory } from './party-factory';
import { HALO_PARTY_DESCRIPTOR_TYPE, PartyInternal } from './party-internal';

const log = debug('dxos:echo:party-manager');

/**
 * Manages the life-cycle of parties.
 */
export class PartyManager {
  // Has the PartyManager been opened.
  private _opened = false;

  // Map of parties by party key.
  private readonly _parties = new ComplexMap<PublicKey, PartyInternal>(keyToString);

  // External event listener.
  // TODO(burdon): Wrap with subscribe.
  readonly update = new Event<PartyInternal>();

  constructor (
    private readonly _identityManager: IdentityManager,
    private readonly _feedStore: FeedStoreAdapter,
    private readonly _partyFactory: PartyFactory,
    private readonly _snapshotStore: SnapshotStore
  ) { }

  get parties (): PartyInternal[] {
    return Array.from(this._parties.values());
  }

  get opened () {
    return this._opened;
  }

  @synchronized
  async open () {
    if (this._opened) {
      return;
    }
    await this._feedStore.open();

    // Open the HALO first (if present).
    if (this._identityManager.identityKey) {
      if (this._feedStore.queryWritableFeed(this._identityManager.identityKey.publicKey)) {
        // TODO(marik-d): Snapshots for halo party?
        const halo = await this._partyFactory.constructParty(this._identityManager.identityKey.publicKey);
        // Always open the HALO.
        await halo.open();
        await this._identityManager.initialize(halo);
      }
    }

    // Iterate descriptors and pre-create Party objects.
    for (const partyKey of this._feedStore.getPartyKeys()) {
      if (!this._parties.has(partyKey) && !this._isHalo(partyKey)) {
        let party: PartyInternal | undefined;

        const snapshot = await this._snapshotStore.load(partyKey);
        if (snapshot) {
          party = await this._partyFactory.constructPartyFromSnapshot(snapshot);
        } else {
          party = await this._partyFactory.constructParty(partyKey);
        }

        // TODO(telackey): Should parties be auto-opened?
        await party.open();
        this._parties.set(party.key, party);
        this.update.emit(party);
      }
    }

    this._opened = true;
  }

  @synchronized
  async close () {
    await this._feedStore.close();
    this._opened = false;
  }

  /**
   * Joins an existing Identity HALO.
   */
  @synchronized
  async joinHalo (invitationDescriptor: InvitationDescriptor, secretProvider: SecretProvider) {
    assert(this._opened, 'PartyManager is not open.');
    assert(!this._identityManager.halo, 'HALO already exists.');

    const halo = await this._partyFactory.joinHalo(invitationDescriptor, secretProvider);
    await this._setHalo(halo);

    return halo;
  }

  /**
   * Creates the Identity HALO.
   */
  @synchronized
  async createHalo (options: HaloCreationOptions = {}): Promise<PartyInternal> {
    assert(this._opened, 'PartyManager is not open.');
    assert(!this._identityManager.halo, 'HALO already exists.');

    const halo = await this._partyFactory.createHalo(options);
    await this._setHalo(halo);

    return halo;
  }

  /**
   * Creates a new party, writing its genesis block to the stream.
   */
  @synchronized
  async createParty (): Promise<PartyInternal> {
    assert(this._opened, 'PartyManager is not open.');
    assert(this._identityManager.initialized, 'IdentityManager has not been initialized with the HALO.');

    const party = await this._partyFactory.createParty();

    if (this._parties.has(party.key)) {
      await party.close();
      throw new Error(`Party already exists ${keyToString(party.key)}`); // TODO(marik-d): Handle this gracefully
    }
    this._parties.set(party.key, party);
    this.update.emit(party);
    return party;
  }

  /**
   * Construct a party object and start replicating with the remote peer that created that party.
   * @param partyKey
   * @param hints
   */
  // TODO(telackey): Remove 'feeds' since should not be listed here. The set of trusted feeds is the
  // under the authority of the PartyStateMachine.
  @synchronized
  async addParty (partyKey: PartyKey, hints: KeyHint[] = []) {
    assert(this._opened, 'PartyManager is not open.');
    assert(this._identityManager.initialized, 'IdentityManager has not been initialized with the HALO.');

    log(`Adding party partyKey=${keyToString(partyKey)} hints=${hints.length}`);
    assert(!this._parties.has(partyKey));
    const party = await this._partyFactory.addParty(partyKey, hints);

    if (this._parties.has(party.key)) {
      await party.close();
      throw new Error(`Party already exists ${keyToString(party.key)}`); // TODO(marik-d): Handle this gracefully
    }
    this._parties.set(party.key, party);
    this.update.emit(party);
  }

  @synchronized
  async joinParty (invitationDescriptor: InvitationDescriptor, secretProvider: SecretProvider) {
    assert(this._opened, 'PartyManager is not open.');
    assert(this._identityManager.initialized, 'IdentityManager has not been initialized with the HALO.');

    // TODO(marik-d): Somehow check that we don't already have this party
    const party = await this._partyFactory.joinParty(invitationDescriptor, secretProvider);

    if (this._parties.has(party.key)) {
      await party.close();
      throw new Error(`Party already exists ${keyToString(party.key)}`); // TODO(marik-d): Handle this gracefully
    }
    this._parties.set(party.key, party);
    this.update.emit(party);
    return party;
  }

  // Only call from a @synchronized method.
  private async _setHalo (halo: PartyInternal) {
    assert(halo.itemManager, 'ItemManger is required');
    await this._identityManager.initialize(halo);

    const result = await halo.itemManager.queryItems({ type: HALO_PARTY_DESCRIPTOR_TYPE });
    result.subscribe(async (values) => {
      for (const partyDesc of values) {
        const partyKey = partyDesc.model.getProperty('publicKey');
        if (!this._parties.has(partyKey)) {
          log(`Auto-opening new Party from HALO: ${keyToString(partyKey)}`);

          // TODO(telackey): Fix ObjectModel's handling of arrays.
          const hints = Object.values(partyDesc.model.getProperty('hints')) as KeyHint[];
          await this.addParty(partyKey, hints);
        }
      }
    });
  }

  private _isHalo (partyKey: PublicKey) {
    assert(this._identityManager.identityKey, 'No identity key');
    return Buffer.compare(partyKey, this._identityManager.identityKey.publicKey) === 0;
  }
}
