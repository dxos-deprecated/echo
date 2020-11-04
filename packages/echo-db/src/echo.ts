//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import memdown from 'memdown';

import { Event } from '@dxos/async';
import { Keyring, KeyStore, KeyType } from '@dxos/credentials';
import { humanize } from '@dxos/crypto';
import { codec, PartyKey } from '@dxos/echo-protocol';
import { FeedStore } from '@dxos/feed-store';
import { ModelConstructor, ModelFactory } from '@dxos/model-factory';
import { NetworkManager, SwarmProvider } from '@dxos/network-manager';
import { ObjectModel } from '@dxos/object-model';
import { Storage } from '@dxos/random-access-multi-storage';

import { FeedStoreAdapter } from './feed-store-adapter';
import { InvitationDescriptor, SecretProvider } from './invitations';
import { OfflineInvitationClaimer } from './invitations/offline-invitation-claimer';
import { IdentityManager, Party, PartyFactory, PartyFilter, PartyManager, PartyMember } from './parties';
import { HALO_CONTACT_LIST_TYPE } from './parties/halo-party';
import { createRamStorage } from './persistant-ram-storage';
import { ResultSet } from './result';
import { SnapshotStore } from './snapshot-store';

export interface Options {
  readOnly?: false;
  readLogger?: (msg: any) => void;
  writeLogger?: (msg: any) => void;
}

export type Contact = PartyMember;

/**
 * Various options passed to `ECHO.create`.
 */
export interface EchoCreationOptions {
  /**
   * Storage used for feeds. Defaults to in-memory.
   */
  feedStorage?: Storage

  /**
   * Storage used for keys. Defaults to in-memory.
   */
  keyStorage?: any

  /**
   * Storage used for snapshots. Defaults to in-memory.
   */
  snapshotStorage?: Storage

  /**
   * Networking provider. Defaults to in-memory networking.
   */
  swarmProvider?: SwarmProvider,

  /**
   * Whether to save and load snapshots. Defaults to `true`.
   */
  snapshots?: boolean

  /**
   * Number of messages after which snapshot will be created. Defaults to 100.
   */
  snapshotInterval?: number

  readLogger?: (msg: any) => void;
  writeLogger?: (msg: any) => void;
}

export interface CreateProfileOptions {
  publicKey?: Buffer
  secretKey?: Buffer
  username?: string
}

/**
 * This is the root object for the ECHO database.
 * It is used to query and mutate the state of all data accessible to the containing node.
 * Shared datasets are contained within `Parties` which consiste of immutable messages within multiple `Feeds`.
 * These feeds are replicated across peers in the network and stored in the `FeedStore`.
 * Parties contain queryable data `Items` which are reconstituted from an ordered stream of mutations by
 * different `Models`. The `Model` also handles `Item` mutations, which are streamed back to the `FeedStore`.
 * When opened, `Parties` construct a pair of inbound and outbound pipelines that connects each `Party` specific
 * `ItemManager` to the `FeedStore`.
 * Messages are streamed into the pipeline (from the `FeedStore`) in logical order, determined by the
 * `Spactime` `Timeframe` (which implements a vector clock).
 */
export class ECHO {
  private readonly _partyManager: PartyManager;

  private readonly _feedStore: FeedStore;

  private readonly _keyring: Keyring;

  private readonly _identityManager: IdentityManager;

  private readonly _snapshotStore: SnapshotStore;

  private readonly _networkManager: NetworkManager;

  private readonly _modelFactory: ModelFactory;

  /**
   * Creates a new instance of ECHO.
   *
   * Without any parameters will create an in-memory database.
   */
  constructor ({
    feedStorage = createRamStorage(),
    keyStorage = memdown(),
    snapshotStorage = createRamStorage(),
    swarmProvider = new SwarmProvider(),
    snapshots = true,
    snapshotInterval = 100,
    readLogger,
    writeLogger
  }: EchoCreationOptions = {}) {
    this._feedStore = new FeedStore(feedStorage, { feedOptions: { valueEncoding: codec } });
    const feedStoreAdapter = new FeedStoreAdapter(this._feedStore);

    const keyStore = new KeyStore(keyStorage);
    this._keyring = new Keyring(keyStore);
    this._identityManager = new IdentityManager(this._keyring);

    this._modelFactory = new ModelFactory()
      .registerModel(ObjectModel);

    const options = {
      readLogger,
      writeLogger,
      snapshots,
      snapshotInterval
    };

    this._networkManager = new NetworkManager(this._feedStore, swarmProvider);
    this._snapshotStore = new SnapshotStore(snapshotStorage);
    const partyFactory = new PartyFactory(this._identityManager, feedStoreAdapter, this._modelFactory, this._networkManager, this._snapshotStore, options);
    this._partyManager = new PartyManager(this._identityManager, feedStoreAdapter, partyFactory, this._snapshotStore);
  }

  get identityKey () {
    return this._identityManager.identityKey;
  }

  get modelFactory () {
    return this._modelFactory;
  }

  toString () {
    return `Database(${JSON.stringify({
      parties: this._partyManager.parties.length
    })})`;
  }

  /**
   * Opens the pary and constructs the inbound/outbound mutation streams.
   */
  async open () {
    await this._keyring.load();
    await this._partyManager.open();
  }

  /**
   * Closes the party and associated streams.
   */
  async close () {
    await this._networkManager.close();
    await this._partyManager.close();
  }

  /**
   * Removes all data and closes this ECHO instance.
   */
  async reset () {
    if (this._feedStore.storage.destroy) {
      await this._feedStore.storage.destroy();
    }

    await this._keyring.deleteAllKeyRecords();

    // TODO(marik-d): Delete snapshots.

    await this.close();
  }

  /**
   * Create Profile. Add Identity key if public and secret key are provided. Then initializes profile with given username.
   * If not public and secret key are provided it relies on keyring to contain an identity key.
   */
  async createProfile ({ publicKey, secretKey, username }: CreateProfileOptions = {}) {
    if (publicKey && secretKey) {
      if (this._identityManager.identityKey) {
        throw new Error('Identity key already exists. Call createProfile without a keypair to only create a halo party.');
      }

      await this._keyring.addKeyRecord({ publicKey, secretKey, type: KeyType.IDENTITY });
    }

    if (!this._identityManager.identityKey) {
      throw new Error('Cannot create profile. Either no keyPair (public and secret key) was provided or cannot read Identity from keyring.');
    }
    await this._partyManager.createHalo({
      identityDisplayName: username || humanize(this._identityManager.identityKey.publicKey)
    });
  }

  registerModel (constructor: ModelConstructor<any>): this {
    this._modelFactory.registerModel(constructor);
    return this;
  }

  /**
   * Creates a new party.
   */
  async createParty (): Promise<Party> {
    await this.open();

    const impl = await this._partyManager.createParty();
    await impl.open();

    return new Party(impl);
  }

  /**
   * Returns an individual party by it's key.
   * @param {PartyKey} partyKey
   */
  getParty (partyKey: PartyKey): Party | undefined {
    assert(this._partyManager.opened, 'Database not open.');

    const impl = this._partyManager.parties.find(party => Buffer.compare(party.key, partyKey) === 0);
    return impl && new Party(impl);
  }

  /**
   * Queries for a set of Parties matching the optional filter.
   * @param {PartyFilter} filter
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  queryParties (filter?: PartyFilter): ResultSet<Party> {
    assert(this._partyManager.opened, 'Database not open.');

    return new ResultSet(this._partyManager.update.discardParameter(), () => this._partyManager.parties.map(impl => new Party(impl)));
  }

  /**
   * Joins a party that was created by another peer and starts replicating with it.
   * @param invitationDescriptor
   * @param secretProvider
   */
  async joinParty (invitationDescriptor: InvitationDescriptor, secretProvider?: SecretProvider): Promise<Party> {
    assert(this._partyManager.opened, 'Database not open.');

    const actualSecretProvider = secretProvider ?? OfflineInvitationClaimer.createSecretProvider(this._partyManager.identityManager);

    const impl = await this._partyManager.joinParty(invitationDescriptor, actualSecretProvider);
    return new Party(impl);
  }

  /**
   * Joins an existing Identity HALO by invitation.
   */
  async joinHalo (invitationDescriptor: InvitationDescriptor, secretProvider: SecretProvider) {
    assert(this._partyManager.opened, 'Database not open.');
    assert(!this._partyManager.identityManager.halo, 'HALO already exists.');

    const impl = await this._partyManager.joinHalo(invitationDescriptor, secretProvider);
    return new Party(impl);
  }

  /**
   * Joins an existing Identity HALO from a recovery seed phrase.
   */
  async recoverHalo (seedPhrase: string) {
    assert(this._partyManager.opened, 'Database not open.');
    assert(!this._partyManager.identityManager.halo, 'HALO already exists.');
    assert(!this._partyManager.identityManager.identityKey, 'Identity key already exists.');

    const impl = await this._partyManager.recoverHalo(seedPhrase);
    return new Party(impl);
  }

  /**
   * Query for contacts.  Contacts represent member keys across all known Parties.
   */
  queryContacts (): ResultSet<Contact> {
    assert(this._partyManager.opened, 'Database not open.');
    assert(this._partyManager.identityManager.halo, 'HALO required.');
    assert(this._partyManager.identityManager.halo.itemManager, 'ItemManager required.');

    const results = this._partyManager.identityManager.halo.itemManager.queryItems({ type: HALO_CONTACT_LIST_TYPE });

    const getter = () => {
      const [contactListItem] = results.value;
      const contacts = contactListItem?.model.toObject();
      return contacts ? Object.values(contacts) as Contact[] : [];
    };

    const event = new Event();
    results.subscribe(() => {
      event.emit();
    });

    return new ResultSet(event, getter);
  }
}
