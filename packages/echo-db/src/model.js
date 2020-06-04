//
// Copyright 2020 DxOS.org
//

import debug from 'debug';

// TODO(burdon): Remove dependency (via adapter). Or move to other package.
import { Model } from '@dxos/data-client';

import { MutationUtil } from './mutation';
import { ObjectStore, fromObject } from './object-store';
import { createObjectId, parseObjectId } from './util';

const log = debug('dxos:echo:model');

/**
 * Stream adapter.
 */
// TODO(burdon): Rename ObjectModel.
export class EchoModel extends Model {
  _model = new ObjectStore();

  getObjectsByType (type) {
    return this._model.getObjectsByType(type);
  }

  createItem (type, properties) {
    log('create', type, properties);

    const id = createObjectId(type);
    const mutations = fromObject({ id, properties });

    this.appendMessage({
      __type_url: type,
      ...mutations
    });

    return id;
  }

  updateItem (id, properties) {
    log('update', id, properties);

    const { type } = parseObjectId(id);
    const mutations = fromObject({
      id,
      properties
    });

    this.appendMessage({
      __type_url: type,
      ...mutations
    });
  }

  deleteItem (id) {
    log('delete', id);

    const { type } = parseObjectId(id);
    const mutation = MutationUtil.createMessage(id, undefined, { deleted: true });

    this.appendMessage({
      __type_url: type,
      ...mutation
    });
  }

  onUpdate (messages) {
    this._model.applyMutations(messages);
  }
}
