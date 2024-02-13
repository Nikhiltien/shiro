import React from 'react';
import { Paper, Box, IconButton } from '@mui/material';
import ForwardIcon from '@mui/icons-material/Forward';
import ReplayIcon from '@mui/icons-material/Replay';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

function BottomPanel({ flipBoard, onNavigateBackward, onNavigateForward}) {
  return (
    <Paper>
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <IconButton size="small"><ReplayIcon /></IconButton>
        <IconButton size="small" onClick={onNavigateBackward}><RotateLeftIcon /></IconButton>
        <IconButton size="small" onClick={flipBoard}><FlipCameraAndroidIcon /></IconButton>
        <IconButton size="small" onClick={onNavigateForward}><ForwardIcon /></IconButton>
        <IconButton size="small" color="primary"><PlayCircleOutlineIcon /></IconButton>
      </Box>
    </Paper>
  );
}

export default BottomPanel;