import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { Button, Box, Typography } from '@mui/material';

const StockPage = () => {
  const [stockData, setStockData] = useState([]);
  const [averagePrice, setAveragePrice] = useState(null);
  const [timeInterval, setTimeInterval] = useState(30); // default: 30 minutes

  useEffect(() => {
    // backend server is running on port 3001
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/stocks/NVDA?minutes=${timeInterval}`);
        const data = response.data.priceHistory;

        setStockData(data);

        // calculate average price
        const avgPrice = data.reduce((sum, current) => sum + current.price, 0) / data.length;
        setAveragePrice(avgPrice.toFixed(2));
      } catch (error) {
        console.error('Error fetching stock data:', error);
      }
    };

    fetchData();
  }, [timeInterval]);

  const handleIntervalChange = (minutes) => {
    setTimeInterval(minutes);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4">Stock Price: GOOG</Typography>
      <Typography variant="h6">Last {timeInterval} minutes</Typography>

      <Box sx={{ marginBottom: 2 }}>
        <Button variant="contained" onClick={() => handleIntervalChange(15)}>Last 15 minutes</Button>
        <Button variant="contained" sx={{ marginLeft: 1 }} onClick={() => handleIntervalChange(30)}>Last 30 minutes</Button>
        <Button variant="contained" sx={{ marginLeft: 1 }} onClick={() => handleIntervalChange(60)}>Last 60 minutes</Button>
      </Box>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={stockData}>
          <XAxis dataKey="lastUpdatedAt" />
          <YAxis />
          <Tooltip />
          <CartesianGrid strokeDasharray="3 3" />
          <Legend />
          <Line type="monotone" dataKey="price" stroke="#8884d8" name="Price" />
          <Line
            type="monotone"
            dataKey={() => averagePrice} // draw flat average line
            stroke="#ff7300"
            name="Average"
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <Typography variant="h6" sx={{ marginTop: 2 }}>
        Average Price: {averagePrice}
      </Typography>
    </Box>
  );
};

export default StockPage;
