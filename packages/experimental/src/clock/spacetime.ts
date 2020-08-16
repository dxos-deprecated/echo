//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { keyToString } from '@dxos/crypto';

import { dxos } from '../proto/gen/testing';

import { FeedKey } from '../feeds';

/**
 * Abstraction of the key field and type.
 * Assumes that the key type is mappable to a sortable scalar value.
 * This anticipates that the initial FeedKey based approach will be superceded by a compact
 * mapped indexed based approach (where each node can impute the feed admission order of each other).
 */
export abstract class KeyMapper<T, S> {
  private readonly _key: string;

  constructor (key: string) {
    this._key = key;
  }

  get key () {
    return this._key;
  }

  get (frame) {
    return frame[this._key];
  }

  toArray (timeframe): [T, number][] {
    const { frames = [] } = timeframe;
    return frames.map(frame => [frame[this._key], frame.seq]);
  }

  fromArray (frames: [T, number][]): dxos.echo.testing.ITimeframe {
    return {
      frames: frames.map(([key, seq]) => ({ [this._key]: key, seq }))
    };
  }

  abstract toScalar (value: T): S;
  abstract fromScalar (value: S): T;
}

export class FeedKeyMapper extends KeyMapper<FeedKey, string> {
  toScalar (value: FeedKey): string {
    return keyToString(value);
  }

  fromScalar (value: string): FeedKey {
    return Buffer.from(value);
  }
}

export class FeedIndexMapper extends KeyMapper<number, number> {
  toScalar (value: number): number { return value; }
  fromScalar (value: number): number { return value; }
}

/**
 * Utility class to manipulate Timeframe protocol buffers.
 */
export class Spacetime {
  private readonly _keyMapper: KeyMapper<any, any>;

  constructor (keyMapper: KeyMapper<any, any>) {
    this._keyMapper = keyMapper;
  }

  get keyMapper () {
    return this._keyMapper;
  }

  toJson (timeframe) {
    assert(timeframe);
    const { frames = [] } = timeframe;
    return frames.map(frame => ({
      key: this._keyMapper.toScalar(this._keyMapper.get(frame)),
      seq: frame.seq
    }));
  }

  stringify (timeframe) {
    assert(timeframe);
    return JSON.stringify(this.toJson(timeframe));
  }

  createTimeframe (frames): dxos.echo.testing.ITimeframe {
    return {
      frames: frames.map(([key, seq]) => ({ [this._keyMapper.key]: key, seq }))
    };
  }

  /**
   * Merges the values, updating the highest sequence numbers.
   * @param timeframes
   */
  merge (...timeframes: dxos.echo.testing.ITimeframe[]): dxos.echo.testing.ITimeframe {
    const map = new Map();
    const arrays = timeframes.map(timeframes => this._keyMapper.toArray(timeframes));
    arrays.reduce((a, b) => [...a, ...b], []).forEach(([key, seq]) => {
      assert(key);
      assert(seq !== undefined);
      const current = map.get(key);
      if (current === undefined || seq > current) {
        map.set(key, seq);
      }
    });

    return this._keyMapper.fromArray(Array.from(map));
  }

  /**
   * Removes the specified keys.
   * @param timeframe
   * @param keys
   */
  removeKeys (timeframe, keys): dxos.echo.testing.ITimeframe {
    return {
      frames: this._keyMapper.toArray(timeframe)
        .filter(([key]) => keys.indexOf(key) === -1)
        .map(([key, seq]) => ({
          [this._keyMapper.key]: key,
          seq
        }))
    };
  }

  /**
   * Compare two timeframes.
   * Compare all sequence numbers for all common keys.
   *
   *   [X] [Y] [Z]
   * A: 1   2   -     A = B
   * B: 1   -   2
   *
   *   [X] [Y] [Z]
   * A: 1   2   -     A < B
   * B: 2   4   3
   *
   *   [X] [Y] [Z]
   * A: 3   -   1     A > B
   * B: 2   4   -
   *
   *   [X] [Y] [Z]
   * A: 1   2   3     A < B (since Node "A" sorts lower than Node "B")
   * B: 2   1   3
   *
   * @param tf1
   * @param tf2
   */
  // TODO(burdon): Does it matter if the higher node is missing values that the other node has?
  compare (tf1: dxos.echo.testing.ITimeframe, tf2: dxos.echo.testing.ITimeframe): number {
    const frames1 = this._keyMapper.toArray(tf1);
    const frames2 = this._keyMapper.toArray(tf2);

    console.log(frames1);
    console.log(frames2);

    return 0;
  }

  /**
   * Sort timeframes.
   * @param timeframes
   */
  sort (...timeframes: dxos.echo.testing.ITimeframe[]): dxos.echo.testing.ITimeframe[] {
    return timeframes.sort((a, b) => this.compare(a, b));
  }
}
