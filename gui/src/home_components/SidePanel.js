import React, { useState, useEffect } from 'react';
import { Paper, Tabs, Tab, Box, IconButton, Divider } from '@mui/material';
import ForwardIcon from '@mui/icons-material/Forward';
import ReplayIcon from '@mui/icons-material/Replay';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import D3Tree from './D3Tree'; 

function SidePanel({ flipBoard, gameTree }) {
  const [selectedTab, setSelectedTab] = useState(0);

  // useEffect(() => {
  //   console.log("Current gameTree data in SidePanel:", gameTree);
  // }, [gameTree]);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Paper style={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={selectedTab}
        onChange={handleChange}
        aria-label="Side panel tabs"
        variant="scrollable"
        scrollButtons="auto"
        style={{ borderBottom: '1px solid #e0e0e0' }}
      >
        <Tab label="Engine" />
        <Tab label="Game Tree" />
        <Tab label="Analysis" />
        <Tab label="Stats" />
      </Tabs>

      <Divider />

      <Box p={2} flexGrow={1}>
        {selectedTab === 1 && <D3Tree moves={gameTree} />}
        {/* Render D3Tree component when Game Tree tab is selected */}
      </Box>

      <Box display="flex" justifyContent="center" alignItems="center" p={1}>
        <IconButton size="small"><ReplayIcon /></IconButton>
        <IconButton size="small"><RotateLeftIcon /></IconButton>
        <IconButton size="small" onClick={flipBoard}><FlipCameraAndroidIcon /></IconButton>
        <IconButton size="small"><ForwardIcon /></IconButton>
        <IconButton size="small" color="primary"><PlayCircleOutlineIcon /></IconButton>
      </Box>
    </Paper>
  );
}

export default SidePanel;
