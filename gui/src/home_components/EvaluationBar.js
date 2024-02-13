import React, { useState, useEffect } from 'react';

function EvaluationBar({ score }) {
//   const [evaluation, setEvaluation] = useState(null);

//   // Function to fetch evaluation data
//   const fetchEvaluation = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/evaluation');
//       const data = await response.json();
//       setEvaluation(data.value); // Assuming the API returns an object with a 'value' property
//     } catch (error) {
//       console.error('Error fetching evaluation:', error);
//     }
//   };

//   useEffect(() => {
//     const interval = setInterval(fetchEvaluation, 500000); // Fetch every 5 seconds
//     return () => clearInterval(interval); // Cleanup on unmount
//   }, []);

  return (
    <div style={{ padding: '10px', backgroundColor: '#f0f0f0', height: '100%' }}>
      <h4>Evaluation:</h4>
      <div>
        {score !== null ? (typeof score === 'number' ? score.toFixed(2) : score) : 'Loading...'}
      </div>
    </div>
  );
}

export default EvaluationBar;