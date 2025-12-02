import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ComparisonData } from '../types';
import { schoolsAPI } from '../services/api';
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  formatCurrency,
  formatPercentage,
  formatNumber,
  getOwnershipLabel,
  getOwnershipColor,
  calculateROI,
  getROIColor,
} from '../utils/helpers';

const Compare: React.FC = () => {
  const [compareList, setCompareList] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'table' | 'charts'>('table');

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
      const response = await schoolsAPI.compare(schoolIds, 2023);
      setComparisonData(response.schools);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load comparison data');
      console.error('Error loading comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (schoolId: number) => {
    const newList = compareList.filter((id) => id !== schoolId);
    setCompareList(newList);
    saveToLocalStorage('compareList', newList);

    if (newList.length > 0) {
      setComparisonData(comparisonData.filter((d) => d.school_id !== schoolId));
    } else {
      setComparisonData([]);
    }
  };

  const handleClearAll = () => {
    setCompareList([]);
    setComparisonData([]);
    saveToLocalStorage('compareList', []);
  };

  // Get the best value for highlighting
  const getBestValue = (
    getData: (d: ComparisonData) => number | undefined,
    lowerIsBetter = false
  ): number | undefined => {
    const values = comparisonData.map((d) => getData(d)).filter((v) => v !== undefined) as number[];
    if (values.length === 0) return undefined;
    return lowerIsBetter ? Math.min(...values) : Math.max(...values);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container">
          <div className="loading-wrapper">
            <div className="spinner" />
            <p className="text-gray">Loading comparison data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (compareList.length === 0) {
    return (
      <div className="main-content">
        <div className="container">
          <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
            <div className="empty-state-icon">⚖️</div>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>No Schools Selected</h2>
            <p className="text-gray mb-6">
              You haven't selected any schools to compare yet. Browse schools and click "Add to Compare" to get started.
            </p>
            <Link to="/" className="btn btn-primary">
              Browse Schools
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="container">
          <div className="alert alert-danger mb-6">{error}</div>
          <Link to="/" className="btn btn-primary">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  // Metrics for comparison
  const metrics: Array<{
    label: string;
    icon: string;
    getValue: (d: ComparisonData) => number | string | undefined;
    format: (v: any) => string;
    lowerIsBetter?: boolean;
    highlight?: boolean;
  }> = [
    {
      label: 'Average Net Price',
      icon: '',
      getValue: (d) => d.basic_info.latest.avg_net_price || d.basic_info.latest.tuition_in_state,
      format: formatCurrency,
      lowerIsBetter: true,
      highlight: true,
    },
    {
      label: 'In-State Tuition',
      icon: '',
      getValue: (d) => d.basic_info.latest.tuition_in_state,
      format: formatCurrency,
      lowerIsBetter: true,
    },
    {
      label: 'Out-of-State Tuition',
      icon: '',
      getValue: (d) => d.basic_info.latest.tuition_out_of_state,
      format: formatCurrency,
      lowerIsBetter: true,
    },
    {
      label: 'Admission Rate',
      icon: '',
      getValue: (d) => d.basic_info.latest.admission_rate,
      format: formatPercentage,
    },
    {
      label: 'Completion Rate',
      icon: '',
      getValue: (d) => d.basic_info.latest.completion_rate_overall || d.basic_info.latest.completion_rate_4yr,
      format: formatPercentage,
      highlight: true,
    },
    {
      label: 'Median Earnings (10yr)',
      icon: '',
      getValue: (d) => d.basic_info.latest.median_earnings_10yr,
      format: formatCurrency,
      highlight: true,
    },
    {
      label: 'SAT Average',
      icon: '',
      getValue: (d) => d.basic_info.latest.sat_avg,
      format: (v) => v?.toString() || 'N/A',
    },
    {
      label: 'Student Size',
      icon: '',
      getValue: (d) => d.basic_info.latest.size,
      format: formatNumber,
    },
    {
      label: 'Pell Grant Rate',
      icon: '',
      getValue: (d) => d.basic_info.latest.pell_grant_rate,
      format: formatPercentage,
    },
    {
      label: 'Median Debt',
      icon: '',
      getValue: (d) => d.basic_info.latest.median_debt,
      format: formatCurrency,
      lowerIsBetter: true,
    },
    {
      label: 'Default Rate',
      icon: '',
      getValue: (d) => d.basic_info.latest.default_rate_3yr,
      format: formatPercentage,
      lowerIsBetter: true,
    },
  ];

  // Calculate ROI for each school
  const roiData = comparisonData.map((d) => {
    const cost = d.basic_info.latest.avg_net_price || d.basic_info.latest.tuition_in_state || 0;
    const earnings = d.basic_info.latest.median_earnings_10yr || 0;
    return {
      schoolId: d.school_id,
      name: d.basic_info.school.name,
      roi: calculateROI(earnings, cost),
    };
  });

  const maxROI = Math.max(...roiData.map((d) => d.roi));

  return (
    <div className="main-content">
      <div className="container">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ marginBottom: 'var(--space-2)' }}>Compare Schools</h1>
            <p className="text-gray">
              Side-by-side comparison of {comparisonData.length} school{comparisonData.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-1" style={{ background: 'var(--color-gray-100)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
              <button
                className={`btn btn-sm ${activeView === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveView('table')}
              >
                 Table
              </button>
              <button
                className={`btn btn-sm ${activeView === 'charts' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveView('charts')}
              >
                 Charts
              </button>
            </div>
            <button className="btn btn-outline" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        </div>

        {activeView === 'table' ? (
          /* Table View */
          <div className="table-wrapper" style={{ marginBottom: 'var(--space-6)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px', position: 'sticky', left: 0, background: 'var(--color-gray-50)', zIndex: 1 }}>
                    Metric
                  </th>
                  {comparisonData.map((data) => (
                    <th key={data.school_id} style={{ minWidth: '200px' }}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-gray-900)' }}>
                            {data.basic_info.school.name}
                          </div>
                          <div className="text-sm text-gray font-normal">
                            {data.basic_info.school.city}, {data.basic_info.school.state}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(data.school_id)}
                          className="btn btn-icon btn-ghost"
                          style={{ color: 'var(--color-danger)' }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Type Row */}
                <tr>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--color-white)', fontWeight: 600 }}>
                     Type
                  </td>
                  {comparisonData.map((data) => (
                    <td key={data.school_id}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: `${getOwnershipColor(data.basic_info.school.ownership)}15`,
                          color: getOwnershipColor(data.basic_info.school.ownership),
                        }}
                      >
                        {getOwnershipLabel(data.basic_info.school.ownership)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* ROI Row */}
                <tr style={{ background: 'var(--color-gray-50)' }}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--color-gray-50)', fontWeight: 600 }}>
                     10-Year ROI
                  </td>
                  {roiData.map((data) => (
                    <td key={data.schoolId}>
                      <span
                        style={{
                          fontSize: 'var(--text-xl)',
                          fontWeight: 700,
                          color: getROIColor(data.roi),
                        }}
                      >
                        {data.roi > 0 ? '+' : ''}{data.roi.toFixed(0)}%
                      </span>
                      {data.roi === maxROI && (
                        <span className="badge badge-success ml-2">Best</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Metric Rows */}
                {metrics.map((metric, idx) => {
                  const best = getBestValue(
                    (d) => {
                      const v = metric.getValue(d);
                      return typeof v === 'number' ? v : undefined;
                    },
                    metric.lowerIsBetter
                  );

                  return (
                    <tr key={idx}>
                      <td style={{ position: 'sticky', left: 0, background: 'var(--color-white)', fontWeight: 600 }}>
                        {metric.icon} {metric.label}
                      </td>
                      {comparisonData.map((data) => {
                        const value = metric.getValue(data);
                        const numValue = typeof value === 'number' ? value : undefined;
                        const isBest = numValue !== undefined && numValue === best;

                        return (
                          <td key={data.school_id}>
                            <span
                              style={{
                                fontWeight: isBest ? 700 : 400,
                                color: isBest && metric.highlight ? 'var(--color-success)' : undefined,
                              }}
                            >
                              {value !== undefined ? metric.format(value) : 'N/A'}
                            </span>
                            {isBest && metric.highlight && (
                              <span className="badge badge-success ml-2">Best</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Website Row */}
                <tr>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--color-white)', fontWeight: 600 }}>
                    Website
                  </td>
                  {comparisonData.map((data) => (
                    <td key={data.school_id}>
                      {data.basic_info.school.school_url ? (
                        <a
                          href={`https://${data.basic_info.school.school_url.replace(/^https?:\/\//, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline"
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
        ) : (
          /* Charts View */
          <div className="grid grid-cols-2 gap-6">
            {/* ROI Comparison */}
            <div className="card">
              <div className="card-header">Return on Investment (10-Year)</div>
              <div className="card-body">
                {roiData.map((data) => (
                  <div key={data.schoolId} style={{ marginBottom: 'var(--space-4)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                        {data.name.length > 25 ? data.name.substring(0, 25) + '...' : data.name}
                      </span>
                      <span style={{ fontWeight: 700, color: getROIColor(data.roi) }}>
                        {data.roi > 0 ? '+' : ''}{data.roi.toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: '12px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min((data.roi / (maxROI > 0 ? maxROI : 100)) * 100, 100)}%`,
                          background: getROIColor(data.roi),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Comparison */}
            <div className="card">
              <div className="card-header">💰 Average Net Price</div>
              <div className="card-body">
                {comparisonData.map((data) => {
                  const cost = data.basic_info.latest.avg_net_price || data.basic_info.latest.tuition_in_state || 0;
                  const maxCost = Math.max(
                    ...comparisonData.map((d) => d.basic_info.latest.avg_net_price || d.basic_info.latest.tuition_in_state || 0)
                  );
                  return (
                    <div key={data.school_id} style={{ marginBottom: 'var(--space-4)' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                          {data.basic_info.school.name.length > 25
                            ? data.basic_info.school.name.substring(0, 25) + '...'
                            : data.basic_info.school.name}
                        </span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(cost)}</span>
                      </div>
                      <div className="progress-bar" style={{ height: '12px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${(cost / maxCost) * 100}%`,
                            background: 'var(--color-warning)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completion Rate Comparison */}
            <div className="card">
              <div className="card-header">🎓 Completion Rate</div>
              <div className="card-body">
                {comparisonData.map((data) => {
                  const rate = data.basic_info.latest.completion_rate_overall || data.basic_info.latest.completion_rate_4yr || 0;
                  return (
                    <div key={data.school_id} style={{ marginBottom: 'var(--space-4)' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                          {data.basic_info.school.name.length > 25
                            ? data.basic_info.school.name.substring(0, 25) + '...'
                            : data.basic_info.school.name}
                        </span>
                        <span style={{ fontWeight: 700 }}>{formatPercentage(rate)}</span>
                      </div>
                      <div className="progress-bar" style={{ height: '12px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${rate * 100}%`,
                            background: 'var(--color-success)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Earnings Comparison */}
            <div className="card">
              <div className="card-header">💵 Median Earnings (10 Years)</div>
              <div className="card-body">
                {comparisonData.map((data) => {
                  const earnings = data.basic_info.latest.median_earnings_10yr || 0;
                  const maxEarnings = Math.max(
                    ...comparisonData.map((d) => d.basic_info.latest.median_earnings_10yr || 0)
                  );
                  return (
                    <div key={data.school_id} style={{ marginBottom: 'var(--space-4)' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                          {data.basic_info.school.name.length > 25
                            ? data.basic_info.school.name.substring(0, 25) + '...'
                            : data.basic_info.school.name}
                        </span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(earnings)}</span>
                      </div>
                      <div className="progress-bar" style={{ height: '12px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${maxEarnings > 0 ? (earnings / maxEarnings) * 100 : 0}%`,
                            background: 'var(--color-info)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Link to="/" className="btn btn-outline">
            ← Add More Schools
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Compare;