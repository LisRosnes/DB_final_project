import React, { useState, useEffect } from 'react';
import { FilterParams, Major } from '../types';
import { programsAPI } from '../services/api';
import { US_STATES } from '../utils/helpers';

interface FilterPanelProps {
  onFilterChange: (filters: FilterParams) => void;
  initialFilters?: FilterParams;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState<FilterParams>(initialFilters);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);

  useEffect(() => {
    loadMajors();
  }, []);

  const loadMajors = async () => {
    try {
      setLoadingMajors(true);
      const response = await programsAPI.getMajors();
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

  return (
    <div className="card">
      <div className="card-header">Filter Schools</div>
      <div className="card-body">
        <div className="grid grid-cols-2 gap-4">
          {/* State */}
          <div className="form-group">
            <label className="form-label">State</label>
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

          {/* Ownership */}
          <div className="form-group">
            <label className="form-label">Type</label>
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

          {/* Cost Min */}
          <div className="form-group">
            <label className="form-label">Min Cost ($)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g., 10000"
              value={filters.cost_min || ''}
              onChange={(e) => handleInputChange('cost_min', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          {/* Cost Max */}
          <div className="form-group">
            <label className="form-label">Max Cost ($)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g., 50000"
              value={filters.cost_max || ''}
              onChange={(e) => handleInputChange('cost_max', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          {/* Min Earnings */}
          <div className="form-group">
            <label className="form-label">Min Earnings (10yr, $)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g., 50000"
              value={filters.earnings_min || ''}
              onChange={(e) => handleInputChange('earnings_min', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          {/* Max Admission Rate */}
          <div className="form-group">
            <label className="form-label">Max Admission Rate (%)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g., 20"
              min="0"
              max="100"
              value={filters.admission_rate_max ? filters.admission_rate_max * 100 : ''}
              onChange={(e) => 
                handleInputChange('admission_rate_max', e.target.value ? parseFloat(e.target.value) / 100 : undefined)
              }
            />
          </div>

          {/* Min Completion Rate */}
          <div className="form-group">
            <label className="form-label">Min Completion Rate (%)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g., 50"
              min="0"
              max="100"
              value={filters.completion_rate_min ? filters.completion_rate_min * 100 : ''}
              onChange={(e) => 
                handleInputChange('completion_rate_min', e.target.value ? parseFloat(e.target.value) / 100 : undefined)
              }
            />
          </div>

          {/* Degree Level */}
          <div className="form-group">
            <label className="form-label">Degree Level</label>
            <select
              className="form-select"
              value={filters.degree_level || ''}
              onChange={(e) => handleInputChange('degree_level', e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">All Levels</option>
              <option value="1">Certificate</option>
              <option value="2">Associate</option>
              <option value="3">Bachelor</option>
              <option value="4">Graduate</option>
            </select>
          </div>

          {/* Major */}
          <div className="form-group">
            <label className="form-label">Major</label>
            <select
              className="form-select"
              value={filters.major || ''}
              onChange={(e) => handleInputChange('major', e.target.value)}
              disabled={loadingMajors}
            >
              <option value="">All Majors</option>
              {majors.map((major) => (
                <option key={major.field_code} value={major.field_code}>
                  {major.field_name}
                </option>
              ))}
            </select>
          </div>

          {/* Size Min */}
          <div className="form-group">
            <label className="form-label">Min Size (students)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g., 1000"
              value={filters.size_min || ''}
              onChange={(e) => handleInputChange('size_min', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          {/* Size Max */}
          <div className="form-group">
            <label className="form-label">Max Size (students)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g., 10000"
              value={filters.size_max || ''}
              onChange={(e) => handleInputChange('size_max', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

          {/* Sort By */}
          <div className="form-group">
            <label className="form-label">Sort By</label>
            <select
              className="form-select"
              value={filters.sort_by || 'school.name'}
              onChange={(e) => handleInputChange('sort_by', e.target.value)}
            >
              <option value="school.name">Name</option>
              <option value="latest.avg_net_price">Cost</option>
              <option value="latest.median_earnings_10yr">Earnings</option>
              <option value="latest.admission_rate">Admission Rate</option>
              <option value="latest.completion_rate_overall">Completion Rate</option>
              <option value="latest.size">Size</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button className="btn btn-primary" onClick={handleApplyFilters}>
            Apply Filters
          </button>
          <button className="btn btn-outline" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
