import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

function MenuBar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6">
          Chess App
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default MenuBar;
