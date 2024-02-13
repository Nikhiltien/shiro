import React, { useState } from 'react';
import { Paper, Tabs, Tab, Box, IconButton, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import ForwardIcon from '@mui/icons-material/Forward';
import ReplayIcon from '@mui/icons-material/Replay';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import D3Tree from './D3Tree';

Chart.register(...registerables);

function createData(evaluation, line) {
  return { evaluation, line };
}

const rows = [
  createData('Line 1', 159),
  createData('Line 2', 237),
  createData('Line 3', -262),
  // Add more rows as needed
];

function SidePanel({ gameTree }) {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Sample data for the graph
  const data = {
    labels: ['Move 1', 'Move 2', 'Move 3', 'Move 4', 'Move 5', 'Move 6'],
    datasets: [
      {
        label: 'Evaluation Graph',
        data: [12, 19, -16, -5, 14, 11],
        fill: true,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return (
    <Paper style={{ 
      height: '100%', 
      overflow: 'auto', 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '600px',
      background: 'linear-gradient(180deg, #333333 0%, #4d4d4d 100%)'
    }}>
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
        {selectedTab === 0 && (
          <>
            <TableContainer component={Paper}>
              <Table size="small" aria-label="a dense table">
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.evaluation}>
                      <TableCell component="th" scope="row">
                        {row.line}
                      </TableCell>
                      <TableCell align="right">{row.evaluation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Line data={data} />
            <Box display="flex" justifyContent="center" alignItems="center" p={1}>
              <Button variant="contained" color="primary">Game Review</Button>
            </Box>
          </>
        )}
        {selectedTab === 1 && <D3Tree moves={gameTree} />}
        {/* Render D3Tree component when Game Tree tab is selected */}
      </Box>
    </Paper>
  );
}

export default SidePanel;