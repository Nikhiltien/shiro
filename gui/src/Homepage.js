import React, { useEffect, useRef, useState } from 'react';
import Board from './home_components/Board';
import EvaluationBar from './home_components/EvaluationBar';
import MenuBar from './home_components/MenuBar';
import SidePanel from './home_components/SidePanel';
import BottomPanel from './home_components/BottomPanel';
import { Box } from '@mui/material';

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

  const resetBoard = async () => {
    try {
      const response = await fetch('http://localhost:5000/reset', { method: 'POST' });
      const data = await response.json();
      if (data.fen) {
        setBoardPosition(data.fen); // Update the board position with the new FEN
      } else {
        console.error('Error in resetting the board:', data.error);
      }
    } catch (error) {
      console.error('Error in resetting the board:', error);
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
    <Box sx={{ flexGrow: 1 }}>
      <MenuBar />
      <Box sx={{ pt: '40px', display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          {/* Board and EvaluationBar inline */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EvaluationBar score={evaluationScore} />
            <Box sx={{ flexGrow: 1, minHeight: '600px', minWidth: '600px' }}>
              <Board
                key={initialFenLoaded ? 'initial-fen' : 'default'}
                position={boardPosition}
                onPieceDrop={onDrop}
                orientation={orientation}
              />
            </Box>
          </Box>
          {/* SidePanel with padding */}
          <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
            <SidePanel
              gameTree={gameTree}
            />
          </Box>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <BottomPanel
            flipBoard={flipBoard}
            onNavigateForward={navigateForward}
            onNavigateBackward={navigateBackward}
            onResetBoard={resetBoard}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default Homepage;