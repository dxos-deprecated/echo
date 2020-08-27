//
// Copyright 2020 DXOS.org
//

import React from 'react';
import { withKnobs } from '@storybook/addon-knobs';

import { FullScreen } from '@dxos/gem-core';

export default {
  title: 'Experimental',
  decorators: [withKnobs]
};

export const withHello = () => {
  return (
    <FullScreen>
      <div>Hello</div>
    </FullScreen>
  );
};
