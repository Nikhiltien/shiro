import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box } from '@mui/material';

const EvaluationBar = ({ score }) => {
    const [progressHeight, setProgressHeight] = useState('50%');

    useEffect(() => {
        if (typeof score === 'number') {
            const normalizedHeight = score >= 0 
                ? 50 + ((score / 10) * 50) // Positive scores fill from top
                : 50 - ((Math.abs(score) / 10) * 50); // Negative scores fill from bottom
            setProgressHeight(`${Math.max(0, Math.min(100, normalizedHeight))}%`);
        } else {
            setProgressHeight('0%'); // No bar for non-numeric scores
        }
    }, [score]);

    const barColor = score > 0 ? '#D3D3D3' : '#A9A9A9'; // Light grey for positive, dark grey for negative

    const displayScore = typeof score === 'number' 
        ? score.toFixed(2).toString() 
        : (score === null ? 'null' : '∞'); // Display infinity symbol for string scores

        return (
            <Paper style={{ width: '30px', height: '600px', marginLeft: '20px', textAlign: 'center', backgroundColor: '#333333', position: 'relative' }}>
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: '2px',
                        right: '2px',
                        height: progressHeight,
                        backgroundColor: barColor,
                        border: '1px solid #888',
                        transition: 'height 0.5s ease-in-out',
                    }}
                />
                <Typography variant="body1" style={{ 
                    position: 'absolute', 
                    width: '100%', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#FFFFFF',
                    fontSize: 'small', // smaller text size
                    fontWeight: 'bold', // bolder text
                }}>
                    {displayScore}
                </Typography>
            </Paper>
        );
    };
    
export default EvaluationBar;
