import { createId } from '@dxos/crypto';
// TODO(burdon): Remove dependency (via adapter). Or move to other package.
import { Model } from '@dxos/model-factory';

import { raise } from './util';
import {ModelMessage} from "@dxos/echo-db/dist/src/common/ModelMessage";

// TODO(marik-d): Reuse existing ObjectModel mutation mechanisms and CRDTs
export interface ViewMutation {
  ['__type_url']: string
  viewId: string
  displayName?: string
  deleted?: boolean
  metadata?: Record<string, any>
}

export interface View<M extends {} = {}> {
  type: string
  viewId: string
  displayName: string
  deleted: boolean
  metadata: M
}

export class ViewModel<M extends {} = {}> extends Model {
  private readonly _views = new Map<string, View<M>>()

  getById (viewId: string): View<M> | undefined {
    return this._views.get(viewId);
  }

  getAllViews (): View<M>[] {
    return Array.from(this._views.values()).filter(view => !view.deleted);
  }

  getAllDeletedViews (): View<M>[] {
    return Array.from(this._views.values()).filter(view => view.deleted);
  }

  getAllForType (type: string): View<M>[] {
    const res: View<M>[] = [];
    for (const view of this._views.values()) {
      if (view.type === type && !view.deleted) {
        res.push(view);
      }
    }
    return res;
  }

  onUpdate (messages: ViewMutation[]) {
    for (const message of messages) {
      const view = this.getById(message.viewId);
      if (view) {
        this._views.set(message.viewId, {
          ...view,
          displayName: message.displayName ?? view.displayName,
          deleted: message.deleted ?? view.deleted,
          metadata: {
            ...view.metadata,
            ...message.metadata
          }
        });
      } else {
        this._views.set(message.viewId, {
          type: message.__type_url,
          viewId: message.viewId,
          displayName: message.displayName ?? message.viewId,
          deleted: message.deleted ?? false,
          metadata: (message.metadata ?? {}) as M
        });
      }
    }
  }

  createView (type: string, displayName: string, metadata: M = {} as any): string {
    const viewId = createId();
    super.appendMessage(new ModelMessage({ __type_url: type, viewId, displayName, metadata }));
    return viewId;
  }

  renameView (viewId: string, displayName: string) {
    const view = this.getById(viewId) ?? raise(new Error(`View not found for id: ${viewId}`));
    if (view.deleted) throw new Error(`Cannot rename deleted view with id: ${viewId}`);
    super.appendMessage(new ModelMessage({ viewId, __type_url: view.type, displayName }));
  }

  updateView (viewId: string, metadata: Partial<M>) {
    const view = this.getById(viewId) ?? raise(new Error(`View not found for id: ${viewId}`));
    if (view.deleted) throw new Error(`Cannot update deleted view with id: ${viewId}`);
    super.appendMessage(new ModelMessage({ viewId, __type_url: view.type, metadata }));
  }

  deleteView (viewId: string) {
    const view = this.getById(viewId) ?? raise(new Error(`View not found for id: ${viewId}`));
    if (view.deleted) return;
    super.appendMessage(new ModelMessage({ viewId, __type_url: view.type, deleted: true }));
  }

  restoreView (viewId: string) {
    const view = this.getById(viewId) ?? raise(new Error(`View not found for id: ${viewId}`));
    if (!view.deleted) return;
    super.appendMessage(new ModelMessage({ viewId, __type_url: view.type, deleted: false }));
  }
}
