//
// Copyright 2020 DXOS.org
//

import { dxos } from '../proto/gen/testing';

import { IFeedMeta } from '../feeds';

export type ItemID = string;
export type ItemType = string;

export interface IEchoStream {
  meta: IFeedMeta;
  data: dxos.echo.testing.IEchoEnvelope;
}
