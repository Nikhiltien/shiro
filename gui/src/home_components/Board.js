import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';

function Board({ position, onPieceDrop, orientation }) {
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

  // console.log("Board component render with position:", position);

  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <Chessboard
        position={position}
        onPieceDrop={handlePieceDrop}
        animationDuration={lastInteraction === 'drag' ? 0 : 300}
        boardOrientation={orientation} // Use the orientation prop here
      />
    </div>
  );
}

export default Board;
