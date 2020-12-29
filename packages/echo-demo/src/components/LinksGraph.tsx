//
// Copyright 2020 DXOS.org
//

import React, { useState } from 'react'
import useResizeAware from 'react-resize-aware';

import { Database } from '@dxos/echo-db'
import {
  createSimulationDrag,
  Graph,
  ForceLayout,
  LinkProjector,
  NodeProjector,
  Markers,
} from '@dxos/gem-spore';
import { FullScreen, SVG, useGrid, Grid } from '@dxos/gem-core';

import { useSelection } from '../hooks/useSelection'
import { graphSelector } from '../types';

interface LinksGraphProps {
  database: Database
}

const LinksGraph = ({ database }: LinksGraphProps) => {
  const data = useSelection(database.select(), graphSelector, []);
  const [resizeListener, size] = useResizeAware();
  const { width, height } = size;
  const grid = useGrid({ width, height });
  const [nodeProjector] = useState(() => new NodeProjector({ node: { showLabels: true } }));
  const [linkProjector] = useState(() => new LinkProjector({ nodeRadius: 8, showArrows: true }));
  const [layout] = useState(() => new ForceLayout());
  const [drag] = useState(() => createSimulationDrag(layout.simulation, { link: 'metaKey' }));

  return (
    <FullScreen>
      {resizeListener}
      <SVG width={size.width} height={size.height}>
        <Grid grid={grid} />
        <Markers arrowSize={8}/>
        <Graph
          grid={grid}
          data={data}
          layout={layout}
          drag={drag}
          nodeProjector={nodeProjector}
          linkProjector={linkProjector}
        />
      </SVG>
    </FullScreen>
  );
};

export default LinksGraph;
