// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TryDemo from './pages/TryDemo';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/try-demo" element={<TryDemo />} />
            </Routes>
        </Router>
    );
}

export default App;