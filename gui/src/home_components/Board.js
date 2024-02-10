import React from 'react';
import { Chessboard } from 'react-chessboard';

function Board() {
    return (
      <div style={{ maxWidth: '500px', margin: 'auto' }}>
        <Chessboard />
      </div>
    );
  }
  
  export default Board;