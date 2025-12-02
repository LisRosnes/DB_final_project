import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { schoolsAPI } from '../services/api';
import { School } from '../types';
import { debounce } from '../utils/helpers';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const navItems = [
    { path: '/', label: 'Explore', icon: '' },
    { path: '/compare', label: 'Compare', icon: '' },
    { path: '/analytics', label: 'Analytics', icon: '' },
    { path: '/about', label: 'About', icon: '' },
  ];

  // Debounced search function
  const performSearch = debounce(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await schoolsAPI.search(query, 8);
      setSearchResults(response.results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowResults(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Brand */}
          <Link to="/" className="navbar-brand">
            <span className="navbar-brand-icon">🎓</span>
            <span>CollegeInsight</span>
          </Link>

          {/* Search Bar */}
          <div 
            className="search-input-wrapper" 
            style={{ width: '400px', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg 
              className="search-icon" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            {isSearching && (
              <div style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)' 
              }}>
                <div className="spinner" style={{ width: '20px', height: '20px' }} />
              </div>
            )}

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: 'var(--color-white)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-gray-200)',
                boxShadow: 'var(--shadow-xl)',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 'var(--z-dropdown)',
              }}>
                {searchResults.map((school) => (
                  <Link
                    key={school.school_id}
                    to={`/school/${school.school_id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '1px solid var(--color-gray-100)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background var(--transition-fast)',
                    }}
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--color-gray-50)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                        {school.school?.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
                        {school.school?.city}, {school.school?.state}
                      </div>
                    </div>
                    <span 
                      className={`badge badge-${school.school?.ownership === 1 ? 'public' : school.school?.ownership === 2 ? 'private' : 'forprofit'}`}
                    >
                      {school.school?.ownership === 1 ? 'Public' : school.school?.ownership === 2 ? 'Private' : 'For-Profit'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="navbar-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span style={{ marginRight: '6px' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;