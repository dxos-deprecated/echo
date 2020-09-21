import { Codec } from '@dxos/codec-experimental-runtime';
//
// Copyright 2020 DXOS.org
//

import { FeedMeta, ItemID } from '@dxos/experimental-echo-protocol';

//
// Types
//

export type ModelType = string;

export type ModelMeta = {
  type: ModelType,
  mutation: Codec<any> // TODO(marik-d): Specify generic type param here to match model's expected message type
}

export type ModelConstructor<T> =
  (new (meta: ModelMeta, itemId: ItemID, writeStream?: NodeJS.WritableStream) => T) & { meta: ModelMeta };

export type ModelMessage<T> = {
  meta: FeedMeta,
  mutation: T
}
