import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';

function Board({ position, onPieceDrop }) {
  const [lastInteraction, setLastInteraction] = useState('click');

  const handlePieceDrop = (sourceSquare, targetSquare, piece, newPos, oldPos, orientation) => {
    // Check if it was a drag or a click
    if (sourceSquare === targetSquare) {
      setLastInteraction('click');
    } else {
      setLastInteraction('drag');
    }

    // Call the provided onPieceDrop function
    if (onPieceDrop) {
      onPieceDrop(sourceSquare, targetSquare);
    }
  };

  console.log("Board component render with position:", position);

  return (
    <div style={{ maxWidth: '500px', margin: 'auto' }}>
      <Chessboard
        position={position}
        onPieceDrop={handlePieceDrop}
        animationDuration={lastInteraction === 'drag' ? 0 : 300} // No animation on drag, default duration on click
      />
    </div>
  );
}

export default Board;
