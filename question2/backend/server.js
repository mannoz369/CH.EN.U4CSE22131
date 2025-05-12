// server.js
const express = require('express');
const axios = require('axios');
const moment = require('moment');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDYxMzAwLCJpYXQiOjE3NDcwNjEwMDAsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjUzMDJlNmU5LWUxYmMtNGM2Zi1iZmQzLWEzYzA1MDFkODhjOCIsInN1YiI6Im1hbm5venNyaWlzYWlAZ21haWwuY29tIn0sImVtYWlsIjoibWFubm96c3JpaXNhaUBnbWFpbC5jb20iLCJuYW1lIjoibWFub2ogc3JpIHNhaSBib2RhcHVkaSIsInJvbGxObyI6ImNoLmVuLnU0Y3NlMjIxMzEiLCJhY2Nlc3NDb2RlIjoiU3d1dUtFIiwiY2xpZW50SUQiOiI1MzAyZTZlOS1lMWJjLTRjNmYtYmZkMy1hM2MwNTAxZDg4YzgiLCJjbGllbnRTZWNyZXQiOiJoSmd4a2FDQVRjcUFFdVRIIn0.agACs7117SOvorvY6IMinIuL8xLVNhNfc6DiUQHRpXM'; 

app.get('/stocks/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { minutes } = req.query;

  const minutesInt = parseInt(minutes, 10);
  if (isNaN(minutesInt)) {
    return res.status(400).json({ error: 'Invalid "minutes" parameter' });
  }

  try {
    
    const response = await axios.get(`http://your-api-endpoint/${ticker}?minutes=${minutes}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const priceHistory = response.data;

    const currentTime = moment();
    const filteredPrices = priceHistory.filter(priceData => {
      const priceTime = moment(priceData.lastUpdatedAt);
      return currentTime.diff(priceTime, 'minutes') <= minutesInt;
    });

    if (filteredPrices.length === 0) {
      return res.status(404).json({ error: 'No stock price data available for the given time range' });
    }

    const averagePrice = filteredPrices.reduce((sum, data) => sum + data.price, 0) / filteredPrices.length;

    res.json({
      averageStockPrice: averagePrice,
      priceHistory: filteredPrices
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stock prices' });
  }
});

app.get('/stockcorrelation', async (req, res) => {
  const { minutes, tickers } = req.query;
  const tickerArray = tickers.split(',');

  if (tickerArray.length < 2) {
    return res.status(400).json({ error: 'At least two tickers are required for correlation' });
  }

  const minutesInt = parseInt(minutes, 10);
  if (isNaN(minutesInt)) {
    return res.status(400).json({ error: 'Invalid "minutes" parameter' });
  }

  try {
    const stockData = {};
    const prices = {};

    for (let ticker of tickerArray) {
      const response = await axios.get(`http://your-api-endpoint/${ticker}?minutes=${minutes}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      stockData[ticker] = response.data;

      prices[ticker] = stockData[ticker].map(data => data.price);
    }

    const correlationMatrix = calculateCorrelationMatrix(prices, tickerArray);

    res.json({
      correlationMatrix,
      stockData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stock data for correlation' });
  }
});

function calculateCorrelation(prices1, prices2) {
  const mean1 = prices1.reduce((a, b) => a + b, 0) / prices1.length;
  const mean2 = prices2.reduce((a, b) => a + b, 0) / prices2.length;

  const covariance = prices1.reduce((acc, price1, index) => acc + (price1 - mean1) * (prices2[index] - mean2), 0) / (prices1.length - 1);
  const stdDev1 = Math.sqrt(prices1.reduce((acc, price1) => acc + Math.pow(price1 - mean1, 2), 0) / (prices1.length - 1));
  const stdDev2 = Math.sqrt(prices2.reduce((acc, price2) => acc + Math.pow(price2 - mean2, 2), 0) / (prices2.length - 1));

  return covariance / (stdDev1 * stdDev2);
}

function calculateCorrelationMatrix(prices, tickers) {
  const matrix = {};
  
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i; j < tickers.length; j++) {
      const ticker1 = tickers[i];
      const ticker2 = tickers[j];
      const correlation = calculateCorrelation(prices[ticker1], prices[ticker2]);
      if (!matrix[ticker1]) {
        matrix[ticker1] = {};
      }
      matrix[ticker1][ticker2] = correlation;
      if (!matrix[ticker2]) {
        matrix[ticker2] = {};
      }
      matrix[ticker2][ticker1] = correlation;
    }
  }

  return matrix;
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
