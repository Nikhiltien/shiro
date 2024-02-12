import React, { useEffect, useRef, useState } from 'react';
import Board from './home_components/Board';
import MenuBar from './home_components/MenuBar';
import SidePanel from './home_components/SidePanel';
import BottomPanel from './home_components/BottomPanel';
import { Grid } from '@mui/material';

function Homepage() {
  const [boardPosition, setBoardPosition] = useState('start');
  const [initialFenLoaded, setInitialFenLoaded] = useState(false);
  const [orientation, setOrientation] = useState('white'); // New state for board orientation
  const flipBoard = () => {
    setOrientation(orientation === 'white' ? 'black' : 'white');
  };

  const websocket = useRef(null);

  useEffect(() => {
    const fetchCurrentFen = async () => {
      try {
        const response = await fetch('http://localhost:5000/current_fen');
        const data = await response.json();
        console.log("Fetched FEN:", data.fen);
        if (data.fen) {
          console.log("Current board position before setting:", boardPosition);
          if (!initialFenLoaded) {
            setBoardPosition(data.fen);
            setInitialFenLoaded(true);
            console.log("Board position set to:", data.fen);
          }
        } else {
          console.error('Failed to fetch current FEN:', data.error);
        }
      } catch (error) {
        console.error('Error fetching current FEN:', error);
      }
    };

    fetchCurrentFen();

    websocket.current = new WebSocket('ws://localhost:5000/ws');
    websocket.current.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.fen) {
          // Update the board position only if a valid FEN is received
          setBoardPosition(data.fen);
        } else if (data.error) {
          // Handle illegal move or other errors (optional)
          console.error('Illegal move or error:', data.error);
          // Optionally display error message to the user
        }
      };
  

    websocket.current.onerror = function(event) {
      console.error("WebSocket error observed:", event);
    };

    return () => {
        if (websocket.current) {
          websocket.current.close();
        }
      };
    }, [boardPosition, initialFenLoaded]);

  const onDrop = (sourceSquare, targetSquare) => {
    // Send move to backend and wait for confirmation before updating board
    const move = sourceSquare + targetSquare;
    if (move && websocket.current) {
      websocket.current.send(JSON.stringify({ move }));
    } else {
      console.error("Attempted to send an invalid move or WebSocket not connected.");
    }
  };

  return (
    <div>
      <MenuBar />
      <Grid container spacing={2}>
        <Grid item xs={9}>
          <Board
            key={initialFenLoaded ? 'initial-fen' : 'default'}
            position={boardPosition}
            onPieceDrop={onDrop}
            orientation={orientation} // Pass orientation to Board
          />
        </Grid>
        <Grid item xs={3}>
          <SidePanel flipBoard={flipBoard} />
        </Grid>
        <Grid item xs={12}>
          <BottomPanel />
        </Grid>
      </Grid>
    </div>
  );
}

export default Homepage;