import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, ButtonGroup, Button } from '@mui/material';

function NewGamePopup({ open, handleClose }) {
  const [pgn, setPgn] = useState('');

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5000/pgn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pgn }),
      });
      if (response.ok) {
        // Handle successful PGN submission
        handleClose();
      } else {
        // Handle errors
        console.error('Error submitting PGN');
      }
    } catch (error) {
      console.error('Error submitting PGN:', error);
    }
  };
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Game</DialogTitle>
      <DialogContent>
        <ButtonGroup fullWidth variant="contained" aria-label="outlined primary button group">
          <Button onClick={handleSubmit}>PGN</Button>
          <Button>Chess.com</Button>
          <Button>Lichess.org</Button>
          <Button>Database</Button>
          </ButtonGroup>
        <TextField 
          fullWidth 
          label="Enter PGN" 
          margin="normal"
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default NewGamePopup;