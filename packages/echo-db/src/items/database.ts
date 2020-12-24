//
// Copyright 2020 DXOS.org
//
import assert from 'assert';

import { synchronized } from '@dxos/async';
import { EchoEnvelope, FeedWriter, ItemID, ItemType, DatabaseSnapshot } from '@dxos/echo-protocol';
import { Model, ModelConstructor, validateModelClass, ModelFactory } from '@dxos/model-factory';
import { ObjectModel } from '@dxos/object-model';

import { ResultSet } from '../result';
import { Item } from './item';
import { ItemDemuxer } from './item-demuxer';
import { ItemFilter, ItemManager } from './item-manager';
import { Link } from './link';
import { SelectFilter, Selection, SelectFilterByLink, SelectFilterByType } from './selection';
import { TimeframeClock } from './timeframe-clock';

export interface ItemCreationOptions<M> {
  model: ModelConstructor<M>
  type?: ItemType
  parent?: ItemID
  props?: any // TODO(marik-d): Type this better.
}

export interface LinkCreationOptions<M, L extends Model<any>, R extends Model<any>> {
  model?: ModelConstructor<M>
  type?: ItemType
  source: Item<L>
  target: Item<R>
  props?: any // TODO(marik-d): Type this better.
}

enum State {
  INITIAL = 'INITIAL',
  OPEN = 'OPEN',
  DESTROYED = 'DESTROYED',
}

/**
 * Represents a shared dataset containing queryable Items that are constructed from an ordered stream
 * of mutations.
 */
export class Database {
  private readonly _itemManager: ItemManager;
  private readonly _itemDemuxer: ItemDemuxer;
  private _itemDemuxerInboundStream: NodeJS.WritableStream | undefined;

  private _state = State.INITIAL;

  /**
   * Creates a new database instance. `database.init()` must be called afterwards to complete the initialization.
   */
  constructor (
    private readonly _modelFactory: ModelFactory,
    private readonly _timeframeClock: TimeframeClock,
    private readonly _inboundStream: NodeJS.ReadableStream,
    private readonly _outboundStream: FeedWriter<EchoEnvelope> | null,
    private readonly _snapshot?: DatabaseSnapshot
  ) {
    this._itemManager = new ItemManager(this._modelFactory, this._timeframeClock, this._outboundStream ?? undefined);
    this._itemDemuxer = new ItemDemuxer(this._itemManager, this._modelFactory, { snapshots: true });
  }

  get isReadOnly () {
    return !!this._outboundStream;
  }

  @synchronized
  async init () {
    if (this._state !== State.INITIAL) {
      throw new Error('Invalid state, database was already initialized.');
    }

    this._itemDemuxerInboundStream = this._itemDemuxer.open();
    this._inboundStream.pipe(this._itemDemuxerInboundStream);

    if (this._snapshot) {
      await this._itemDemuxer.restoreFromSnapshot(this._snapshot);
    }
    this._state = State.OPEN;
  }

  @synchronized
  async destroy () {
    if (this._state === State.DESTROYED || this._state === State.INITIAL) {
      return;
    }

    this._inboundStream?.unpipe(this._itemDemuxerInboundStream);
    this._state = State.DESTROYED;
  }

  /**
   * Creates a new item with the given queryable type and model.
   */
  // TODO(burdon): Get modelType from somewhere other than ObjectModel.meta.type.
  createItem <M extends Model<any>> (options: ItemCreationOptions<M>): Promise<Item<M>> {
    this._assertInitialized();

    if (!options.model) {
      throw new TypeError('You must specify the model for this item.');
    }

    validateModelClass(options.model);

    if (options.type && typeof options.type !== 'string') {
      throw new TypeError('Optional item type must be a string URL.');
    }

    if (options.parent && typeof options.parent !== 'string') {
      throw new TypeError('Optional parent item id must be a string id of an existing item.');
    }

    return this._itemManager.createItem(options.model.meta.type, options.type, options.parent, options.props);
  }

  createLink<M extends Model<any>, L extends Model<any>, R extends Model<any>> (options: LinkCreationOptions<M, L, R>): Promise<Link<M, L, R>> {
    this._assertInitialized();

    const model = options.model ?? ObjectModel;

    if (!model) {
      throw new TypeError('You must specify the model for this item.');
    }

    validateModelClass(model);

    if (options.type && typeof options.type !== 'string') {
      throw new TypeError('Optional item type must be a string URL.');
    }

    assert(options.source instanceof Item);
    assert(options.target instanceof Item);

    return this._itemManager.createLink(model.meta.type, options.type, options.source.id, options.target.id, options.props);
  }

  /**
   * Queries for a set of Items matching the optional filter.
   * @param filter
   */
  queryItems (filter?: ItemFilter): ResultSet<Item<any>> {
    this._assertInitialized();
    return this._itemManager.queryItems(filter);
  }

  /**
   * Retrieves a item from the index.
   * @param itemId
   */
  getItem (itemId: ItemID): Item<any> | undefined {
    this._assertInitialized();
    return this._itemManager.getItem(itemId);
  }

  /**
   * Waits for item matching the filter to be present and returns it.
   */
  async waitForItem<T extends Model<any> = any> (filter: ItemFilter): Promise<Item<T>> {
    const query = this.queryItems(filter);
    if (query.value.length > 0) {
      return query.value[0];
    } else {
      const [item] = await query.update.waitFor(items => items.length > 0);
      return item;
    }
  }

  select(filter: SelectFilterByType): Selection<Item<any>>;
  select(filter: SelectFilterByLink): Selection<Link<any, any, any>>;

  select (filter: SelectFilter): Selection<any> {
    const result = this._itemManager.queryItems({});
    return new Selection(result.value, result.update.discardParameter()).select(filter as any);
  }

  createSnapshot () {
    this._assertInitialized();
    return this._itemDemuxer.createSnapshot();
  }

  private _assertInitialized () {
    if (this._state !== State.OPEN) {
      throw new Error('Database not initialized.');
    }
  }
}
