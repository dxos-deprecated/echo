//
// Copyright 2020 DxOS.org
//

import { EchoModel } from './model';

test('EchoModel', () => {
    const TYPE_TEST_ECHO_OBJECT = 'wrn_dxos_org_canvas_echo_object';
    const model = new EchoModel();
    const itemId = model.createItem(TYPE_TEST_ECHO_OBJECT, {prop1: 'prop1value'});
    model.updateItem(itemId, {prop2: 'prop2value'})
    const objects = model.getObjectsByType(TYPE_TEST_ECHO_OBJECT);
    expect(objects.length).toBe(1);
    const object = objects[0];
    expect(object).toHaveProperty('prop1', 'prop1value');
    expect(object).toHaveProperty('prop2', 'prop2value');
});
