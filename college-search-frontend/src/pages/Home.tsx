import React, { useState, useEffect } from 'react';
import { School, FilterParams } from '../types';
import { schoolsAPI } from '../services/api';
import FilterPanel from '../components/FilterPanel';
import SchoolCard from '../components/SchoolCard';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/helpers';

const Home: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [compareList, setCompareList] = useState<number[]>([]);
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

  const handleFilterChange = (newFilters: FilterParams) => {
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

      <FilterPanel onFilterChange={handleFilterChange} initialFilters={filters} />

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
