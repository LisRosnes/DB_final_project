import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, FilterParams } from '../types';
import { schoolsAPI } from '../services/api';
import FilterPanel from '../components/FilterPanel';
import SchoolCard from '../components/SchoolCard';
import MapVisualization from '../components/MapVisualization';
import { loadFromLocalStorage, saveToLocalStorage, debounce, getMajorName } from '../utils/helpers';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [compareList, setCompareList] = useState<number[]>([]);
  
  // Search bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const limit = 20;

  useEffect(() => {
    // Load compare list from localStorage
    const saved = loadFromLocalStorage<number[]>('compareList', []);
    setCompareList(saved);
  }, []);

  useEffect(() => {
    loadSchools();
  }, [currentPage]);

  const loadSchools = async (newFilters?: FilterParams) => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = newFilters !== undefined ? newFilters : filters;
      const response = await schoolsAPI.filter({
        ...filterParams,
        page: currentPage,
        limit,
      });

      setSchools(response.results);
      setTotalResults(response.total);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load schools');
      console.error('Error loading schools:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        setSearchLoading(true);
        const response = await schoolsAPI.search(query, 10);
        setSearchResults(response.results);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSearchSelect = (school: School) => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
    // Navigate to school details
    navigate(`/school/${school.school_id}`);
  };

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1);
    loadSchools(newFilters);
  };

  const handleStateClick = (stateCode: string) => {
    const newFilters = { ...filters, state: stateCode };
    setFilters(newFilters);
    setCurrentPage(1);
    loadSchools(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const handleCompare = (schoolId: number) => {
    const newList = compareList.includes(schoolId)
      ? compareList.filter(id => id !== schoolId)
      : [...compareList, schoolId].slice(0, 10); // Max 10 schools

    setCompareList(newList);
    saveToLocalStorage('compareList', newList);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Find Your Perfect College</h1>
        <p className="text-gray">
          Search and filter through thousands of U.S. colleges based on cost, outcomes, location, and programs.
        </p>
      </div>

      {/* Search Bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <svg
                style={{ width: '20px', height: '20px', color: '#6b7280' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                className="form-input"
                placeholder="Search schools by name (e.g., Harvard, MIT, Stanford...)"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                style={{ flex: 1, fontSize: '1rem', padding: '0.75rem 1rem' }}
              />
              {searchLoading && (
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  maxHeight: '400px',
                  overflowY: 'auto',
                  marginTop: '0.25rem'
                }}
              >
                {searchResults.map((school) => (
                  <div
                    key={school.school_id}
                    onClick={() => handleSearchSelect(school)}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                  >
                    <div style={{ fontWeight: '500' }}>{school.school?.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {school.school?.city}, {school.school?.state} • {
                        school.school?.ownership === 1 ? 'Public' :
                        school.school?.ownership === 2 ? 'Private Nonprofit' :
                        'Private For-Profit'
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map and Filters Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="mb-4">
        {/* Interactive Map */}
        <div className="card">
          <div className="card-header">
            <span>Select a State</span>
            {filters.state && (
              <button
                className="btn btn-sm btn-outline"
                style={{ marginLeft: '1rem' }}
                onClick={() => handleStateClick('')}
              >
                Clear State Filter
              </button>
            )}
          </div>
          <div className="card-body">
            <MapVisualization
              selectedState={filters.state}
              onStateClick={handleStateClick}
            />
          </div>
        </div>
        
        {/* Filter Panel */}
        <FilterPanel onFilterChange={handleFilterChange} initialFilters={filters} />
      </div>

      {compareList.length > 0 && (
        <div className="card" style={{ backgroundColor: '#dbeafe' }}>
          <div className="flex justify-between items-center">
            <div>
              <strong>{compareList.length}</strong> school{compareList.length !== 1 ? 's' : ''} selected for comparison
            </div>
            <a href="/compare" className="btn btn-primary btn-sm">
              Compare Schools →
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p className="mt-4">Loading schools...</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-gray">
              Showing <strong>{schools.length}</strong> of <strong>{totalResults}</strong> results
              {filters.state && <span> in <strong>{filters.state}</strong></span>}
              {filters.major && <span> offering <strong>{getMajorName(filters.major)}</strong></span>}
            </p>
          </div>

          {schools.length === 0 ? (
            <div className="card text-center">
              <p className="text-gray">No schools found matching your filters. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {schools.map((school) => (
                  <SchoolCard
                    key={school.school_id}
                    school={school}
                    onCompare={handleCompare}
                    isSelected={compareList.includes(school.school_id)}
                    showCompareButton={true}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>

                  <span className="text-gray">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Home;