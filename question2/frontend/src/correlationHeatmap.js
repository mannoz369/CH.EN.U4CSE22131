import React, { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';

const CorrelationHeatmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCorrelationData = async () => {
      try {
        const response = await fetch('/api/correlation');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching correlation data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCorrelationData();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div>
      {data ? (
        <div>
          {/* Render your heatmap here */}
          <p>Correlation Heatmap Data Loaded</p>
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default CorrelationHeatmap;
