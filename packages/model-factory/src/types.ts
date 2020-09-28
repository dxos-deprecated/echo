//
// Copyright 2020 DXOS.org
//

import { FeedMeta, ItemID } from '@dxos/echo-protocol';

//
// Types
//

export type ModelType = string;

export type MessageType = string;

export type ModelMeta = {
  type: ModelType,
  mutation: MessageType
}

export type ModelConstructor<T> =
  (new (meta: ModelMeta, itemId: ItemID, writeStream?: NodeJS.WritableStream) => T) & { meta: ModelMeta };

export type ModelMessage<T> = {
  meta: FeedMeta,
  mutation: T
}