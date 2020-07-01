//
// Copyright 2020 DxOS.org
//

import { Model } from '@dxos/model-factory';
import { Doc, applyUpdate } from 'yjs';

export class TextModel extends Model {
  _doc = new Doc();

  constructor (options) {
    super(options);

    this._doc.on('update', this._handleDocUpdated.bind(this));
  }

  get doc () {
    return this._doc;
  }

  _handleDocUpdated (update, origin) {
    const remote = origin && origin.docClientId !== this._doc.clientID;

    if (!remote) {
      this.appendMessage({
        __type_url: 'testing.document.Update',
        update,
        origin: { docClientId: this._doc.clientID }
      });
    }
  }

  _transact (fn) {
    return this._doc.transact(fn, this._doc.clientID);
  }

  onUpdate (messages) {
    messages.forEach(message => {
      const { update, origin } = message;

      if (origin.docClientId !== this._doc.clientID) {
        return applyUpdate(this._doc, update, origin);
      }
    });
  }

  onDestroy () {
    this._doc.off('update', this._handleDocUpdated.bind(this));
  }
}
