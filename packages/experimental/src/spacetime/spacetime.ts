//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { keyToString } from '@dxos/crypto';

import { dxos } from '../proto/gen/testing';

import { FeedKey } from '../feeds';

// Required to access property by variable.
export interface IIndexable {
  [key: string]: any;
}

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

  get (frame: dxos.echo.testing.Timeframe.IFrame): T {
    return (frame as IIndexable)[this._key];
  }

  toArray (timeframe: dxos.echo.testing.ITimeframe): [T, number][] {
    const { frames = [] } = timeframe;
    assert(frames);
    return frames.map(frame => [(frame as IIndexable)[this._key], frame.seq as number]);
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

  toJson (timeframe: dxos.echo.testing.ITimeframe) {
    assert(timeframe);
    const { frames = [] } = timeframe;
    return frames?.map(frame => ({
      key: this._keyMapper.toScalar(this._keyMapper.get(frame)),
      seq: frame.seq
    }));
  }

  stringify (timeframe: dxos.echo.testing.ITimeframe) {
    assert(timeframe);
    return JSON.stringify(this.toJson(timeframe));
  }

  createTimeframe (frames: [any, number][]): dxos.echo.testing.ITimeframe {
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
  removeKeys (timeframe: dxos.echo.testing.ITimeframe, keys: any[]): dxos.echo.testing.ITimeframe {
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
   * Compares two timeframes and returns an array of frames from the first timeframe where the sequence number
   * is greater than the associated sequence number from the second timeframe.
   *
   * @param tf1
   * @param tf2
   */
  dependencies<T> (tf1: dxos.echo.testing.ITimeframe, tf2: dxos.echo.testing.ITimeframe): dxos.echo.testing.ITimeframe {
    return {
      // Return false (i.e., omit) if tf2 contains an equal or higher sequence number.
      frames: tf1.frames?.filter(frame => {
        assert(frame.seq);
        const key = this._keyMapper.get(frame);
        const { seq } = tf2.frames?.find(frame => this._keyMapper.get(frame) === key) || {};
        return (!seq || seq < frame.seq);
      })
    };
  }
}
