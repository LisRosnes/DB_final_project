import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          🎓 College Search
        </Link>
        <ul className="navbar-nav">
          <li>
            <Link to="/" className={`navbar-link ${isActive('/')}`}>
              Search
            </Link>
          </li>
          <li>
            <Link to="/compare" className={`navbar-link ${isActive('/compare')}`}>
              Compare
            </Link>
          </li>
          <li>
            <Link to="/analytics" className={`navbar-link ${isActive('/analytics')}`}>
              Analytics
            </Link>
          </li>
          <li>
            <Link to="/about" className={`navbar-link ${isActive('/about')}`}>
              About
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
