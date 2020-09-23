//
// Copyright 2020 DXOS.org
//

import { humanize } from '@dxos/crypto';
import { ItemType, PartyKey } from '@dxos/experimental-echo-protocol';
import { Model, ModelConstructor } from '@dxos/experimental-model-factory';

import { InvitationDetails } from '../invitations';
import { Item, ItemFilter } from '../items';
import { ResultSet } from '../result';
import { PartyImplementation } from './party-implementation';

/**
 * A Party represents a shared dataset containing queryable Items that are constructed from an ordered stream
 * of mutations.
 */
export class Party {
  constructor (
    private readonly _impl: PartyImplementation
  ) {}

  toString () {
    return `Party(${JSON.stringify({ key: humanize(this.key), open: this.isOpen })})`;
  }

  get key (): PartyKey {
    return this._impl.key;
  }

  get isOpen (): boolean {
    return !!this._impl.isOpen;
  }

  /**
   * Opens the pipeline and connects the streams.
   */
  async open () {
    await this._impl.open();
    return this;
  }

  /**
   * Closes the pipeline and streams.
   */
  async close () {
    await this._impl.close();

    return this;
  }

  /**
   * Sets a party property.
   * @param {string} key
   * @param value
   */
  async setProperty (key: string, value: any): Promise<this> {
    const item = await this._impl.getPropertiestItem();
    await item.model.setProperty(key, value);
    return this;
  }

  /**
   * Returns a party property value.
   * @param key
   */
  async getProperty (key: string): Promise<any> {
    const item = await this._impl.getPropertiestItem();
    return item.model.getProperty(key);
  }

  /**
   * Creates a new item with the given queryable type and model.
   * @param {ModelType} model
   * @param {ItemType} [itemType]
   */
  // TODO(burdon): Get modelType from somewhere other than ObjectModel.meta.type.
  // TODO(burdon): Pass in { type, parent } as options.
  async createItem <M extends Model<any>> (model: ModelConstructor<M>, itemType?: ItemType | undefined): Promise<Item<M>> {
    return this._impl.createItem(model, itemType);
  }

  /**
   * Queries for a set of Items matching the optional filter.
   * @param filter
   */
  async queryItems (filter?: ItemFilter): Promise<ResultSet<Item<any>>> {
    return this._impl.queryItems(filter);
  }

  /**
   * Creates an invition for a remote peer.
   */
  async createInvitation (inviteDetails: InvitationDetails) {
    return this._impl.createInvitation(inviteDetails);
  }
}
