//
// Copyright 2020 DXOS.org
//

import { Event } from '@dxos/async';
import { EchoEnvelope, ItemID, ItemMutation, ItemType, FeedWriter } from '@dxos/echo-protocol';
import { Model, ModelMeta } from '@dxos/model-factory';

import type { Link } from './link';

export interface LinkData {
  fromId: ItemID
  toId: ItemID
  from?: Item<any>
  to?: Item<any>
}

/**
 * A globally addressable data item.
 * Items are hermetic data structures contained within a Party. They may be hierarchical.
 * The Item data structure is governed by a Model class, which implements data consistency.
 */
export class Item<M extends Model<any>> {
  // Parent item (or null if this item is a root item).
  private _parent: Item<any> | null = null;

  // Link data (if this item is a link). Only to be set on item genesis.
  protected _link: LinkData | null = null;

  private readonly _children = new Set<Item<any>>();

  /**
   * Links that reference this item.
   */
  private readonly _xrefs = new Set<Link<any, any, any>>();

  private readonly _onUpdate = new Event<this>();

  /**
   * Items are constructed by a `Party` object.
   * @param {ItemID} _itemId      - Addressable ID.
   * @param {ItemType} _itemType  - User defined type (WRN).
   * @param {Model} _modelMeta    - Data model metadata.
   * @param {Model} _model        - Data model (provided by `ModelFactory`).
   * @param [_writeStream]        - Write stream (if not read-only).
   * @param {Item<any>} [parent]  - Parent Item (if not a root Item).
   */
  constructor (
    private readonly _itemId: ItemID,
    private readonly _itemType: ItemType | undefined,
    private readonly _modelMeta: ModelMeta, // TODO(burdon): Why is this not part of the Model interface?
    private readonly _model: M,
    private readonly _writeStream?: FeedWriter<EchoEnvelope>,
    parent?: Item<any> | null,
    link?: LinkData | null
  ) {
    this._updateParent(parent);
    this._setLink(link ?? null);

    // Model updates mean Item updates, so make sure we are subscribed as well.
    this._onUpdate.addEffect(() => this._model.subscribe(() => this._onUpdate.emit(this)));
  }

  toString () {
    return `Item(${JSON.stringify({ itemId: this._itemId, parentId: this.parent?.id, itemType: this._itemType })})`;
  }

  get id (): ItemID {
    return this._itemId;
  }

  get type (): ItemType | undefined {
    return this._itemType;
  }

  get modelMeta (): ModelMeta {
    return this._modelMeta;
  }

  get model (): M {
    return this._model;
  }

  get readOnly () {
    return !!this._writeStream;
  }

  get parent (): Item<any> | null {
    return this._parent;
  }

  get children (): Item<any>[] {
    return Array.from(this._children.values());
  }

  get isLink () {
    return !!this._link;
  }

  // TODO(burdon): Move?
  get isDanglingLink () {
    return this._link && (!this._link.from || !this._link.to);
  }

  // TODO(burdon): Move?
  get xrefs (): Link<any, any, any>[] {
    return Array.from(this._xrefs.values()).filter(link => !link.isDanglingLink);
  }

  /**
   * Subscribe for updates.
   * @param listener
   */
  subscribe (listener: (item: Item<M>) => void) {
    return this._onUpdate.on(listener);
  }

  // TODO(telackey): This does not allow null or undefined as a parentId, but should it since we allow a null parent?
  async setParent (parentId: ItemID): Promise<void> {
    if (!this._writeStream) {
      throw new Error(`Read-only model: ${this._itemId}`);
    }

    // Wait for mutation below to be processed.
    // TODO(burdon): Refine to wait for this specific mutation.
    const onUpdate = this._onUpdate.waitFor(() => parentId === this._parent?.id);

    await this._writeStream.write({
      itemId: this._itemId,
      itemMutation: {
        parentId
      }
    });

    await onUpdate;
  }

  /**
   * Process a mutation on this item. Package-private.
   * @private
   */
  _processMutation (mutation: ItemMutation, getItem: (itemId: ItemID) => Item<any> | undefined) {
    const { parentId } = mutation;

    if (parentId) {
      const parent = getItem(parentId);
      this._updateParent(parent);
    }

    this._onUpdate.emit(this);
  }

  private _updateParent (parent: Item<any> | null | undefined) {
    if (this._parent) {
      this._parent._children.delete(this);
    }

    if (parent) {
      this._parent = parent;
      this._parent._children.add(this);
    } else {
      this._parent = null;
    }
  }

  private _setLink (linkData: LinkData | null) {
    this._link = linkData;
    if (linkData) {
      linkData?.from?._xrefs?.add(this as any);
      linkData?.to?._xrefs?.add(this as any);
    }
  }
}
