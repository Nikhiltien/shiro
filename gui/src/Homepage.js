import React from 'react';
import MenuBar from './home_components/MenuBar';
import Board from './home_components/Board';
import SidePanel from './home_components/SidePanel';
import BottomPanel from './home_components/BottomPanel';
import { Grid } from '@mui/material';

function Homepage() {
  return (
    <div>
      <MenuBar />
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <Board />
        </Grid>
        <Grid item xs={3}>
          <SidePanel />
        </Grid>
        <Grid item xs={12}>
          <BottomPanel />
        </Grid>
      </Grid>
    </div>
  );
}

export default Homepage;