import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import BoardList from './components/BoardList';
import BoardView from './components/BoardView';
import FunnelLibrary from './components/FunnelLibrary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/boards" element={<BoardList />} />
        <Route path="/board/:boardId" element={<BoardView />} />
        <Route path="/funnels" element={<FunnelLibrary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
