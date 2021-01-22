//
// Copyright 2020 DXOS.org
//

import { createModelTestBench } from '@dxos/echo-db';

import { ObjectModel } from './object-model';

test('replication', async () => {
  const { peers, items: [item1, item2] } = await createModelTestBench({
    model: ObjectModel,
    props: { x: 100 }
  });

  expect(item1.id).toEqual(item2.id);

  expect(item1.model.toObject()).toEqual({ x: 100 });
  expect(item2.model.toObject()).toEqual({ x: 100 });

  for await (const peer of peers) {
    await peer.close();
  }
});

test('Add and remove from set', async () => {
  const [peer1] = await createModelTestBench({ model: ObjectModel, props: { x: 100 } });
  const { model } = peer1;

  expect(model.toObject()).toEqual({ x: 100 });

  await model.addToSet('labels', 'green');
  expect(model.toObject()).toEqual({ x: 100, labels: ['green'] });

  await model.addToSet('labels', 'red');
  await model.addToSet('labels', 'blue');
  await model.addToSet('labels', 'green'); // duplicate
  expect(model.toObject()).toEqual({ x: 100, labels: ['green', 'red', 'blue'] });

  await model.removeFromSet('labels', 'blue');
  expect(model.toObject()).toEqual({ x: 100, labels: ['green', 'red'] });
});

test('Push to an array', async () => {
  const [peer1] = await createModelTestBench({ model: ObjectModel, props: { x: 100 } });
  const { model } = peer1;

  expect(model.toObject()).toEqual({ x: 100 });

  await model.pushToArray('numbers', '1');
  expect(model.toObject()).toEqual({ x: 100, numbers: ['1'] });

  await model.pushToArray('numbers', '2');
  await model.pushToArray('numbers', '3');
  await model.pushToArray('numbers', '1'); // duplicate
  expect(model.toObject()).toEqual({ x: 100, numbers: ['1', '2', '3', '1'] });
});
