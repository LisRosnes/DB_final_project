import React, { useState, useEffect } from 'react';
import { ComparisonData } from '../types';
import { schoolsAPI } from '../services/api';
import { loadFromLocalStorage, formatCurrency, formatPercentage, formatNumber, getOwnershipLabel } from '../utils/helpers';

const Compare: React.FC = () => {
  const [compareList, setCompareList] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadFromLocalStorage<number[]>('compareList', []);
    setCompareList(saved);
    
    if (saved.length > 0) {
      loadComparisonData(saved);
    }
  }, []);

  const loadComparisonData = async (schoolIds: number[]) => {
    try {
      setLoading(true);
      setError(null);
      const response = await schoolsAPI.compare(schoolIds);
      setComparisonData(response.schools);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load comparison data');
      console.error('Error loading comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (schoolId: number) => {
    const newList = compareList.filter(id => id !== schoolId);
    setCompareList(newList);
    localStorage.setItem('compareList', JSON.stringify(newList));
    
    if (newList.length > 0) {
      loadComparisonData(newList);
    } else {
      setComparisonData([]);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="loading">
          <div className="spinner"></div>
          <p className="mt-4">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (compareList.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card text-center">
          <h2 className="text-xl font-bold mb-4">No Schools Selected</h2>
          <p className="text-gray mb-4">
            You haven't selected any schools to compare yet.
          </p>
          <a href="/" className="btn btn-primary">
            Browse Schools
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
        <a href="/" className="btn btn-primary mt-4">
          Back to Search
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Compare Schools</h1>
        <p className="text-gray">
          Side-by-side comparison of {comparisonData.length} school{comparisonData.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ minWidth: '200px' }}>Metric</th>
              {comparisonData.map((data) => (
                <th key={data.school_id} style={{ minWidth: '200px' }}>
                  <div>
                    {data.basic_info.school.name}
                    <button
                      onClick={() => handleRemove(data.school_id)}
                      className="btn btn-sm"
                      style={{ 
                        marginLeft: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger-color)',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-sm font-normal text-gray">
                    {data.basic_info.school.city}, {data.basic_info.school.state}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Type */}
            <tr>
              <td><strong>Type</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {getOwnershipLabel(data.basic_info.school.ownership)}
                </td>
              ))}
            </tr>

            {/* Size */}
            <tr>
              <td><strong>Size</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatNumber(data.basic_info.latest.size)} students
                </td>
              ))}
            </tr>

            {/* Admission Rate */}
            <tr>
              <td><strong>Admission Rate</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatPercentage(data.basic_info.latest.admission_rate)}
                </td>
              ))}
            </tr>

            {/* SAT Average */}
            <tr>
              <td><strong>SAT Average</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {data.basic_info.latest.sat_avg || 'N/A'}
                </td>
              ))}
            </tr>

            {/* ACT Average */}
            <tr>
              <td><strong>ACT Average</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {data.basic_info.latest.act_avg || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Average Net Price */}
            <tr>
              <td><strong>Average Net Price</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatCurrency(data.basic_info.latest.avg_net_price)}
                </td>
              ))}
            </tr>

            {/* In-State Tuition */}
            <tr>
              <td><strong>In-State Tuition</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatCurrency(data.basic_info.latest.tuition_in_state)}
                </td>
              ))}
            </tr>

            {/* Out-of-State Tuition */}
            <tr>
              <td><strong>Out-of-State Tuition</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatCurrency(data.basic_info.latest.tuition_out_of_state)}
                </td>
              ))}
            </tr>

            {/* Completion Rate */}
            <tr>
              <td><strong>Completion Rate (4yr)</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatPercentage(data.basic_info.latest.completion_rate_4yr)}
                </td>
              ))}
            </tr>

            {/* Overall Completion Rate */}
            <tr>
              <td><strong>Overall Completion Rate</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatPercentage(data.basic_info.latest.completion_rate_overall)}
                </td>
              ))}
            </tr>

            {/* Median Earnings 6yr */}
            <tr>
              <td><strong>Median Earnings (6yr)</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatCurrency(data.basic_info.latest.median_earnings_6yr)}
                </td>
              ))}
            </tr>

            {/* Median Earnings 10yr */}
            <tr>
              <td><strong>Median Earnings (10yr)</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatCurrency(data.basic_info.latest.median_earnings_10yr)}
                </td>
              ))}
            </tr>

            {/* Median Debt */}
            <tr>
              <td><strong>Median Debt</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatCurrency(data.basic_info.latest.median_debt)}
                </td>
              ))}
            </tr>

            {/* Pell Grant Rate */}
            <tr>
              <td><strong>Pell Grant Rate</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatPercentage(data.basic_info.latest.pell_grant_rate)}
                </td>
              ))}
            </tr>

            {/* Default Rate */}
            <tr>
              <td><strong>Default Rate (3yr)</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {formatPercentage(data.basic_info.latest.default_rate_3yr)}
                </td>
              ))}
            </tr>

            {/* Website */}
            <tr>
              <td><strong>Website</strong></td>
              {comparisonData.map((data) => (
                <td key={data.school_id}>
                  {data.basic_info.school.school_url ? (
                    <a
                      href={data.basic_info.school.school_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary-color)' }}
                    >
                      Visit →
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-2">
        <a href="/" className="btn btn-outline">
          ← Back to Search
        </a>
        <button
          onClick={() => {
            localStorage.removeItem('compareList');
            setCompareList([]);
            setComparisonData([]);
          }}
          className="btn btn-outline"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default Compare;
