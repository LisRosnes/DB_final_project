import React, { useState, useEffect } from 'react';
import { FilterParams, Major } from '../types';
import { programsAPI } from '../services/api';
import { US_STATES, getMajorName } from '../utils/helpers';

interface FilterPanelProps {
  onFilterChange: (filters: FilterParams) => void;
  initialFilters?: FilterParams;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState<FilterParams>(initialFilters);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    loadMajors();
  }, []);

  const loadMajors = async () => {
    try {
      setLoadingMajors(true);
      const response = await programsAPI.getMajors(2023);
      setMajors(response.majors);
    } catch (error) {
      console.error('Error loading majors:', error);
    } finally {
      setLoadingMajors(false);
    }
  };

  const handleInputChange = (field: keyof FilterParams, value: any) => {
    const newFilters = { ...filters, [field]: value === '' ? undefined : value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;

  return (
    <div className="filter-panel">
      <div 
        className="filter-panel-header" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="filter-panel-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
          </svg>
          <span>Filter Schools</span>
          {activeFiltersCount > 0 && (
            <span 
              className="badge badge-primary" 
              style={{ marginLeft: '8px' }}
            >
              {activeFiltersCount} active
            </span>
          )}
        </div>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-fast)',
          }}
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>

      {isExpanded && (
        <div className="filter-panel-body">
          <div className="filter-grid">
            {/* State Filter */}
            <div className="form-group">
              <label className="form-label">
                 State
              </label>
              <select
                className="form-select"
                value={filters.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
              >
                <option value="">All States</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ownership Filter */}
            <div className="form-group">
              <label className="form-label">
                 Institution Type
              </label>
              <select
                className="form-select"
                value={filters.ownership || ''}
                onChange={(e) => handleInputChange('ownership', e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">All Types</option>
                <option value="1">Public</option>
                <option value="2">Private Nonprofit</option>
                <option value="3">Private For-Profit</option>
              </select>
            </div>

            {/* Major Filter */}
            <div className="form-group">
              <label className="form-label">
                 Major / Program
              </label>
              <select
                className="form-select"
                value={filters.major || ''}
                onChange={(e) => handleInputChange('major', e.target.value)}
                disabled={loadingMajors}
              >
                <option value="">All Majors</option>
                {majors.map((major) => (
                  <option key={major.field_code} value={major.field_code}>
                    {getMajorName(major.field_code)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="form-group">
              <label className="form-label">
                 Sort By
              </label>
              <select
                className="form-select"
                value={filters.sort_by || 'size'}
                onChange={(e) => handleInputChange('sort_by', e.target.value)}
              >
                <option value="size">Enrollment (Size)</option>
                <option value="name">Name (A-Z)</option>
                <option value="cost">Cost (Low to High)</option>
                <option value="admission_rate">Admission Rate</option>
                <option value="completion_rate">Completion Rate</option>
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label" style={{ marginBottom: 'var(--space-3)' }}>
               Quick Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Public Universities', filter: { ownership: 1 } },
                { label: 'Private Colleges', filter: { ownership: 2 } },
                { label: 'California', filter: { state: 'CA' } },
                { label: 'New York', filter: { state: 'NY' } },
                { label: 'Texas', filter: { state: 'TX' } },
                { label: 'Computer Science', filter: { major: 'computer' } },
                { label: 'Business', filter: { major: 'business_marketing' } },
                { label: 'Engineering', filter: { major: 'engineering' } },
              ].map((quickFilter, idx) => (
                <button
                  key={idx}
                  className="btn btn-sm btn-ghost"
                  style={{
                    border: '1px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-full)',
                  }}
                  onClick={() => {
                    const newFilters = { ...filters, ...quickFilter.filter };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                >
                  {quickFilter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="filter-actions">
            <button className="btn btn-primary" onClick={handleApplyFilters}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Apply Filters
            </button>
            <button className="btn btn-outline" onClick={handleResetFilters}>
              Reset All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;