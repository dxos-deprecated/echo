//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';
import pify from 'pify';

import { Event, trigger } from '@dxos/async';
import { createId } from '@dxos/crypto';
import { protocol, ItemID, ItemType, IEchoStream } from '@dxos/experimental-echo-protocol';
import { Model, ModelType, ModelFactory, ModelMessage } from '@dxos/experimental-model-factory';
import { checkType, createTransform } from '@dxos/experimental-util';

import { ResultSet } from '../result';
import { Item } from './item';

const log = debug('dxos:echo:item-manager');

export interface ItemFilter {
  type: ItemType | undefined
}

/**
 * Manages the creation and indexing of items.
 */
export class ItemManager {
  private readonly _itemUpdate = new Event<Item<any>>();

  // Map of active items.
  private _items = new Map<ItemID, Item<any>>();

  // TODO(burdon): Lint issue: Unexpected whitespace between function name and paren
  // Map of item promises (waiting for item construction after genesis message has been written).
  // eslint-disable-next-line
  private _pendingItems = new Map<ItemID, (item: Item<any>) => void>();

  _modelFactory: ModelFactory;
  _writeStream?: NodeJS.WritableStream;

  /**
   * @param modelFactory
   * @param writeStream Outbound `dxos.echo.IEchoEnvelope` mutation stream.
   */
  constructor (modelFactory: ModelFactory, writeStream?: NodeJS.WritableStream) {
    assert(modelFactory);
    this._modelFactory = modelFactory;
    this._writeStream = writeStream;
  }

  /**
   * Creates an item and writes the genesis message.
   * @param {ModelType} modelType
   * @param {ItemType} [itemType]
   */
  async createItem (modelType: ModelType, itemType?: ItemType): Promise<Item<any>> {
    assert(this._writeStream);
    assert(modelType);

    if (!this._modelFactory.hasModel(modelType)) {
      throw new Error(`Unknown model: ${modelType}`);
    }

    // Pending until constructed (after genesis block is read from stream).
    const [waitForCreation, callback] = trigger<Item<any>>();

    const itemId = createId();
    this._pendingItems.set(itemId, callback);

    // Write Item Genesis block.
    log('Item Genesis:', itemId);
    await pify(this._writeStream.write.bind(this._writeStream))(checkType<protocol.dxos.echo.IEchoEnvelope>({
      itemId,
      genesis: {
        itemType,
        modelType
      }
    }));

    // Unlocked by construct.
    log('Pending Item:', itemId);
    // TODO(burdon): Type trigger.
    return await (waitForCreation as any)();
  }

  /**
   * Constructs an item with the appropriate model.
   * @param itemId
   * @param modelType
   * @param itemType
   * @param readStream - Inbound mutation stream (from multiplexer).
   */
  async constructItem (itemId: ItemID, modelType: ModelType, itemType: ItemType, readStream: NodeJS.ReadableStream) {
    assert(this._writeStream);
    assert(itemId);
    assert(modelType);
    assert(readStream);

    // TODO(burdon): Skip genesis message (and subsequent messages) if unknown model. Build map of ignored items.
    if (!this._modelFactory.hasModel(modelType)) {
      throw new Error(`Unknown model: ${modelType}`);
    }

    //
    // Convert inbound envelope message to model specific mutation.
    //
    const inboundTransform = createTransform<IEchoStream, ModelMessage<any>>(async (message: IEchoStream) => {
      const { meta, data: { itemId: mutationItemId, mutation } } = message;
      assert(mutationItemId === itemId);
      const response: ModelMessage<any> = {
        meta,
        mutation
      };

      return response;
    });

    //
    // Convert model-specific outbound mutation to outbound envelope message.
    //
    const outboundTransform = createTransform<any, protocol.dxos.echo.IEchoEnvelope>(async (mutation) => {
      const response: protocol.dxos.echo.IEchoEnvelope = {
        itemId,
        mutation
      };

      return response;
    });

    // Create the model with the outbound stream.
    const model: Model<any> = this._modelFactory.createModel(modelType, itemId, outboundTransform);
    assert(model, `Invalid model: ${modelType}`);

    // Connect the streams.
    readStream.pipe(inboundTransform).pipe(model.processor);
    outboundTransform.pipe(this._writeStream);

    // Create the Item.
    const item = new Item(itemId, itemType, model, this._writeStream);
    assert(!this._items.has(itemId));
    this._items.set(itemId, item);
    log('Constructed:', String(item));

    // Notify Item was udpated.
    // TODO(burdon): Update the item directly?
    this._itemUpdate.emit(item);

    // Notify pending creates.
    this._pendingItems.get(itemId)?.(item);
    return item;
  }

  /**
   * Retrieves a item from the index.
   * @param itemId
   */
  getItem (itemId: ItemID): Item<any> | undefined {
    return this._items.get(itemId);
  }

  /**
   * Return matching items.
   * @param [filter]
   */
  queryItems (filter?: ItemFilter): ResultSet<Item<any>> {
    const { type } = filter || {};
    return new ResultSet<Item<any>>(this._itemUpdate, () => Array.from(this._items.values())
      .filter(item => !type || type === item.type));
  }
}
