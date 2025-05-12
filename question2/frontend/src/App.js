import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import StockPage from './stockPage';
import CorrelationHeatmap from './correlationHeatmap';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StockPage />} />
        <Route path="/correlation" element={<CorrelationHeatmap />} />
      </Routes>
    </Router>
  );
};

export default App;
