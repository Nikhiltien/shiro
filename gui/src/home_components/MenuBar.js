import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Tabs, Tab } from '@mui/material';

function MenuBar() {
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <AppBar position="fixed" sx={{
      boxShadow: 'none',
      backgroundColor: 'rgba(120, 120, 120, 0.7)', // Example: Adjust with a light grey color
      backdropFilter: 'blur(10px) brightness(150%) contrast(120%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: 'black',
      zIndex: theme => theme.zIndex.drawer + 1, // Ensures AppBar is above other content
    }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }}>
          Shiro
        </Typography>
        <Tabs value={activeTab} onChange={handleChange} sx={{ '& button': { color: 'inherit' } }}>
          <Tab label="Profiles" />
          <Tab label="Game Library" />
        </Tabs>
        <Button variant="outlined" sx={{ borderColor: 'inherit', color: 'inherit' }}>
          Sign In
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default MenuBar;
