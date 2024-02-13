import React from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, ButtonGroup, Button } from '@mui/material';

function NewGamePopup({ open, handleClose }) {
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Game</DialogTitle>
      <DialogContent>
        <ButtonGroup fullWidth variant="contained" aria-label="outlined primary button group">
          <Button>PGN</Button>
          <Button>Chess.com</Button>
          <Button>Lichess.org</Button>
          <Button>Database</Button>
        </ButtonGroup>
        <TextField 
          fullWidth 
          label="Enter details" 
          margin="normal"
        />
      </DialogContent>
    </Dialog>
  );
}

export default NewGamePopup;