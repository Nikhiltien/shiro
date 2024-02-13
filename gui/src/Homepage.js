import React, { useEffect, useRef, useState } from 'react';
import Board from './home_components/Board';
import EvaluationBar from './home_components/EvaluationBar';
import MenuBar from './home_components/MenuBar';
import SidePanel from './home_components/SidePanel';
import BottomPanel from './home_components/BottomPanel';
import { Grid } from '@mui/material';

function Homepage() {
  const [boardPosition, setBoardPosition] = useState('start');
  const [initialFenLoaded, setInitialFenLoaded] = useState(false);
  const [orientation, setOrientation] = useState('white');
  const [gameTree, setGameTree] = useState(null);
  const [evaluationScore, setEvaluationScore] = useState(0);
  const websocket = useRef(null);

  const flipBoard = () => {
    setOrientation(orientation === 'white' ? 'black' : 'white');
  };

  useEffect(() => {
    const fetchCurrentFen = async () => {
      try {
        const response = await fetch('http://localhost:5000/current_fen');
        const data = await response.json();
        console.log("Fetched FEN:", data.fen);
        if (data.fen) {
          console.log("Current board position before setting:", boardPosition);
          setBoardPosition(data.fen);
          setInitialFenLoaded(true);
        } else {
          console.error('Failed to fetch current FEN:', data.error);
        }
      } catch (error) {
        console.error('Error fetching current FEN:', error);
      }
    };

    fetchCurrentFen();
  }, []);

  useEffect(() => {
    websocket.current = new WebSocket('ws://localhost:5000/ws');

    websocket.current.onmessage = function(event) {
      const data = JSON.parse(event.data);
      // console.log("Received data from WebSocket:", event.data);
      if (data.fen) {
        setBoardPosition(data.fen);
      } else if (data.game_tree) {
        setGameTree(JSON.parse(data.game_tree)); // Update the game tree data
      } else if (data.value) {
        setEvaluationScore(data.value);
      } else if (data.error) {
        console.error('Illegal move or error:', data.error);
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
  }, []); // Empty dependency array to ensure this runs only once on mount

  const onDrop = (sourceSquare, targetSquare) => {
    const move = sourceSquare + targetSquare;
    if (move && websocket.current) {
      websocket.current.send(JSON.stringify({ move }));
    } else {
      console.error("Attempted to send an invalid move or WebSocket not connected.");
    }
  };

  const navigateForward = async () => {
    try {
      const response = await fetch('http://localhost:5000/navigate_forward', { method: 'POST' });
      const data = await response.json();
      if (data.fen) {
        setBoardPosition(data.fen);
      } else {
        console.error('Error in navigating forward:', data.error);
      }
    } catch (error) {
      console.error('Error in navigating forward:', error);
    }
  };
  
  const navigateBackward = async () => {
    try {
      const response = await fetch('http://localhost:5000/navigate_backward', { method: 'POST' });
      const data = await response.json();
      if (data.fen) {
        setBoardPosition(data.fen);
      } else {
        console.error('Error in navigating backward:', data.error);
      }
    } catch (error) {
      console.error('Error in navigating backward:', error);
    }
  };  

  return (
    <div>
      <MenuBar />
      <Grid container spacing={2}>
      <Grid item xs={2}>
        <EvaluationBar score={evaluationScore} />
        </Grid>
        <Grid item xs={7}>
          <Board
            key={initialFenLoaded ? 'initial-fen' : 'default'}
            position={boardPosition}
            onPieceDrop={onDrop}
            orientation={orientation}
          />
        </Grid>
        <Grid item xs={3}>
          <SidePanel
            flipBoard={flipBoard}
            gameTree={gameTree}
            onNavigateForward={navigateForward}
            onNavigateBackward={navigateBackward}
            />
        </Grid>
        <Grid item xs={12}>
          <BottomPanel />
        </Grid>
      </Grid>
    </div>
  );
}

export default Homepage;