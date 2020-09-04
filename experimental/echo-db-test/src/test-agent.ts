//
// Copyright 2020 DXOS.org
//

import { keyToBuffer, keyToString, randomBytes } from '@dxos/crypto';
import { ModelFactory } from '@dxos/experimental-model-factory';
import { ObjectModel } from '@dxos/experimental-object-model';
import { FeedStore } from '@dxos/feed-store';
import { NetworkManager } from '@dxos/network-manager';
import { Agent, Environment, JsonObject } from '@dxos/node-spawner';
import { codec, Database, Inviter, Party, PartyManager, createReplicatorFactory, HaloPartyProcessor } from '@dxos/experimental-echo-db';

export default class TestAgent implements Agent {
  private party?: Party;
  private db!: Database;
  private inviter?: Inviter;

  constructor (private environment: Environment) {}

  async init (): Promise<void> {
    const { storage, swarmProvider } = this.environment;

    const feedStore = new FeedStore(storage, { feedOptions: { valueEncoding: codec } });

    const networkManager = new NetworkManager(feedStore, swarmProvider);

    const modelFactory = new ModelFactory()
      .registerModel(ObjectModel.meta, ObjectModel);

    const partyManager = new PartyManager(
      feedStore,
      modelFactory,
      createReplicatorFactory(networkManager, feedStore, randomBytes()),
      {
        partyProcessorFactory: (partyKey) => new HaloPartyProcessor(partyKey)
      }
    );
    this.db = new Database(partyManager);
    await this.db.open();
  }

  async onEvent (event: JsonObject) {
    if (event.command === 'CREATE_PARTY') {
      this.party = await this.db.createParty();

      const items = await this.party.queryItems();
      this.environment.metrics.set('item.count', items.value.length);
      items.subscribe(items => {
        this.environment.metrics.set('item.count', items.length);
      });

      this.inviter = this.party.createInvitation();
      this.environment.log('invitation', {
        partyKey: keyToString(this.inviter.invitation.partyKey as any),
        feeds: this.inviter.invitation.feeds.map(key => keyToString(Buffer.from(key)))
      });
    } else if (event.command === 'ACCEPT_INVITATION') {
      const { response, party } = await this.db.joinParty({
        partyKey: keyToBuffer((event.invitation as any).partyKey),
        feeds: (event.invitation as any).feeds.map(keyToBuffer)
      });
      this.party = party;
      const items = await this.party.queryItems();
      items.subscribe(items => {
        this.environment.metrics.set('item.count', items.length);
      });

      this.environment.log('invitationResponse', {
        peerFeedKey: keyToString(Buffer.from(response.peerFeedKey)),
        feedAdmitMessage: codec.encode({ halo: response.feedAdmitMessage }).toString('hex')
      });
    } else if (event.command === 'FINALIZE_INVITATION') {
      this.inviter!.finalize({
        peerFeedKey: keyToBuffer((event.invitationResponse as any).peerFeedKey),
        feedAdmitMessage: codec.decode(Buffer.from((event.invitationResponse as any).feedAdmitMessage, 'hex')).halo,
      });
    } else {
      this.party!.createItem(ObjectModel);
    }
  }

  async snapshot () {
    const items = await this.party?.queryItems();
    return {
      items: items?.value.map(item => ({
        id: item.id,
        type: item.type
        // model: JSON.parse(JSON.stringify(item.model)), // TODO(marik-d): Use a generic way to serialize items
      }))
    };
  }

  async destroy (): Promise<void> { }
}
