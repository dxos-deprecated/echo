//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { humanize } from '@dxos/crypto';

import { createItemDemuxer, Item, ItemFilter, ItemManager, ItemType } from '../items';
import { ResultSet } from '../result';
import { ModelFactory, ModelType } from '../models';
import { Pipeline } from './pipeline';
import { PartyKey } from './types';

/**
 * Party.
 */
export class Party {
  private readonly _modelFactory: ModelFactory;
  private readonly _pipeline: Pipeline;

  private _itemManager: ItemManager | undefined;
  private _itemDemuxer: NodeJS.WritableStream | undefined;

  /**
   * @param modelFactory
   * @param pipeline
   */
  constructor (modelFactory: ModelFactory, pipeline: Pipeline) {
    assert(modelFactory);
    assert(pipeline);
    this._modelFactory = modelFactory;
    this._pipeline = pipeline;
  }

  toString () {
    return `Party(${JSON.stringify({ key: humanize(this.key) })})`;
  }

  get key (): PartyKey {
    return this._pipeline.partyKey;
  }

  get isOpen (): boolean {
    return !!this._itemManager;
  }

  /**
   * Opens the pipeline.
   */
  async open () {
    if (this._itemManager) {
      return this;
    }

    // TODO(burdon): Support read-only parties.
    const [readStream, writeStream] = await this._pipeline.open();

    // Connect to the downstream item demuxer.
    this._itemManager = new ItemManager(this._modelFactory, writeStream);
    this._itemDemuxer = createItemDemuxer(this._itemManager);
    readStream.pipe(this._itemDemuxer);

    return this;
  }

  /**
   * Closes the pipeline.
   */
  async close () {
    if (!this._itemManager) {
      return this;
    }

    // Disconnect the read stream.
    this._pipeline.readStream?.unpipe(this._itemDemuxer);

    this._itemManager = undefined;
    this._itemDemuxer = undefined;

    await this._pipeline.close();

    return this;
  }

  // TODO(burdon): Construct special Item for party properties.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setProperty (key: string, value: any): Promise<Party> {
    assert(this.isOpen);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getProperty (key: string): Promise<any> {
    assert(this.isOpen);
    return undefined;
  }

  async createItem (itemType: ItemType, modelType: ModelType): Promise<Item> {
    assert(this._itemManager);
    return this._itemManager.createItem(itemType, modelType);
  }

  async queryItems (filter?: ItemFilter): Promise<ResultSet<Item>> {
    assert(this._itemManager);
    return this._itemManager.queryItems(filter);
  }
}
