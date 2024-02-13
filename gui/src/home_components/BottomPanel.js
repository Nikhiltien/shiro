import React, { useState } from 'react';
import { Paper, Box, IconButton } from '@mui/material';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowBackIosOutlinedIcon from '@mui/icons-material/ArrowBackIosOutlined';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import NewGamePopup from './NewGamePopup';

function BottomPanel({ flipBoard, onNavigateBackward, onNavigateForward, onResetBoard }) {
  const [isPopupOpen, setPopupOpen] = useState(false);

  const handleOpenPopup = () => {
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
  };

  return (
    <Paper>
      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <IconButton size="large" onClick={onResetBoard}><ReplayIcon /></IconButton>
        <IconButton size="large" onClick={onNavigateBackward}><ArrowBackIosOutlinedIcon /></IconButton>
        <IconButton size="large" onClick={flipBoard}><FlipCameraAndroidIcon /></IconButton>
        <IconButton size="large" onClick={onNavigateForward}><ArrowForwardIosOutlinedIcon /></IconButton>
        <IconButton size="large" color="primary" onClick={handleOpenPopup}><AddOutlinedIcon /></IconButton>
      </Box>
      <NewGamePopup open={isPopupOpen} handleClose={handleClosePopup} />
    </Paper>
  );
}

export default BottomPanel;
