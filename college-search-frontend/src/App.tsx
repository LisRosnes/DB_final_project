import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Compare from './pages/Compare';
import Analytics from './pages/Analytics';
import About from './pages/About';
import SchoolDetails from './pages/SchoolDetails';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <Router basename={process.env.PUBLIC_URL || ''}>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/about" element={<About />} />
          <Route path="/school/:id" element={<SchoolDetails />} />
        </Routes>
        
        <footer style={{ 
          textAlign: 'center', 
          padding: '2rem 1rem', 
          marginTop: '4rem',
          borderTop: '1px solid var(--border-color)',
          color: 'var(--text-secondary)'
        }}>
          <p className="text-sm">
            © 2024 College Search Platform | Data from{' '}
            <a 
              href="https://collegescorecard.ed.gov/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'var(--primary-color)' }}
            >
              U.S. Department of Education
            </a>
          </p>
          <p className="text-sm mt-2">
            Built by Humphry Amoakone & Elisa Rosnes
          </p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
