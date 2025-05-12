const express = require('express');
const axios = require('axios');
const moment = require('moment');
const app = express();
const PORT = process.env.PORT || 3000;

// generated token
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDU4NDM2LCJpYXQiOjE3NDcwNTgxMzYsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjUzMDJlNmU5LWUxYmMtNGM2Zi1iZmQzLWEzYzA1MDFkODhjOCIsInN1YiI6Im1hbm5venNyaWlzYWlAZ21haWwuY29tIn0sImVtYWlsIjoibWFubm96c3JpaXNhaUBnbWFpbC5jb20iLCJuYW1lIjoibWFub2ogc3JpIHNhaSBib2RhcHVkaSIsInJvbGxObyI6ImNoLmVuLnU0Y3NlMjIxMzEiLCJhY2Nlc3NDb2RlIjoiU3d1dUtFIiwiY2xpZW50SUQiOiI1MzAyZTZlOS1lMWJjLTRjNmYtYmZkMy1hM2MwNTAxZDg4YzgiLCJjbGllbnRTZWNyZXQiOiJoSmd4a2FDQVRjcUFFdVRIIn0.lnDJsHvQTEqE85LADOLwwCovSSY23Q5cNucYQ7HMqAM'
// start server
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});

// get average stock price in the last m minutes
app.get('/stocks/:ticker', async (req, res) => {
   const { ticker } = req.params;
   const { minutes, aggregation } = req.query;

   if (aggregation !== 'average') {
     return res.status(400).json({ error: 'invalid method' });
   }

   // ensure minutes is a valid number
   const minutesInt = parseInt(minutes, 10);
   if (isNaN(minutesInt)) {
     return res.status(400).json({ error: 'invalid "minutes"' });
   }

   try {
     // fetch stock prices with authorization
     const response = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${ticker}?minutes=${minutes}`, {
       headers: { 'Authorization': `Bearer ${API_KEY}` }
     });
     const priceHistory = response.data;

     // filter the prices from the last m minutes
     const currentTime = moment();
     const filteredPrices = priceHistory.filter(priceData => {
       const priceTime = moment(priceData.lastUpdatedAt);
       return currentTime.diff(priceTime, 'minutes') <= minutesInt;
     });

     if (filteredPrices.length === 0) {
       return res.status(404).json({ error: 'no stock price data available for the given time range' });
     }

     // calculate the average price
     const averagePrice = filteredPrices.reduce((sum, data) => sum + data.price, 0) / filteredPrices.length;

     res.json({
       averageStockPrice: averagePrice,
       priceHistory: filteredPrices
     });
   } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'failed to fetch stock prices' });
   }
});

// get the correlation of stock prices movement between two stocks
app.get('/stockcorrelation', async (req, res) => {
   const { minutes, ticker } = req.query;
   const tickers = ticker.split(',');

   if (tickers.length !== 2) {
     return res.status(400).json({ error: 'only two tickers supported' });
   }

   // ensure minutes is a valid number
   const minutesInt = parseInt(minutes, 10);
   if (isNaN(minutesInt)) {
     return res.status(400).json({ error: 'invalid "minutes"' });
   }

   try {
     const stockData = {};

     // fetch price history for both stocks with authorization
     for (let ticker of tickers) {
       const response = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${ticker}?minutes=${minutes}`, {
         headers: { 'Authorization': `Bearer ${API_KEY}` }
       });
       stockData[ticker] = response.data;
     }

     // extract prices and calculate correlation
     const prices1 = stockData[tickers[0]].map(data => data.price);
     const prices2 = stockData[tickers[1]].map(data => data.price);

     // callin correlation function
     const correlation = calculateCorrelation(prices1, prices2);

     res.json({
       correlation,
       stocks: stockData
     });
   } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'failed to fetch stock data' });
   }
});

// to calculate Correlation
function calculateCorrelation(prices1, prices2) {
   const mean1 = prices1.reduce((a, b) => a + b, 0) / prices1.length;
   const mean2 = prices2.reduce((a, b) => a + b, 0) / prices2.length;

   const covariance = prices1.reduce((acc, price1, index) => acc + (price1 - mean1) * (prices2[index] - mean2), 0) / (prices1.length - 1);
   const stdDev1 = Math.sqrt(prices1.reduce((acc, price1) => acc + Math.pow(price1 - mean1, 2), 0) / (prices1.length - 1));
   const stdDev2 = Math.sqrt(prices2.reduce((acc, price2) => acc + Math.pow(price2 - mean2, 2), 0) / (prices2.length - 1));

   return covariance / (stdDev1 * stdDev2);
}
