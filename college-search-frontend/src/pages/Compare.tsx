import React, { useState, useEffect, useRef } from 'react';
import { ComparisonData } from '../types';
import { schoolsAPI } from '../services/api';
import { loadFromLocalStorage, formatCurrency, formatPercentage, formatNumber, getOwnershipLabel, getOwnershipColor } from '../utils/helpers';
import c3 from 'c3';

type ViewMode = 'cards' | 'table' | 'charts';
type ChartMetric = 'cost' | 'earnings' | 'completion' | 'size';

const Compare: React.FC = () => {
  const [compareList, setCompareList] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('cost');
  const [highlightedSchool, setHighlightedSchool] = useState<number | null>(null);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    const saved = loadFromLocalStorage<number[]>('compareList', []);
    setCompareList(saved);
    
    if (saved.length > 0) {
      loadComparisonData(saved);
    }
  }, []);

  // Chart effect
  useEffect(() => {
    if (viewMode === 'charts' && comparisonData.length > 0 && chartRef.current) {
      renderChart();
    }
    
    return () => {
      if (chartInstance.current) {
        try {
          chartInstance.current.destroy();
        } catch (e) {}
        chartInstance.current = null;
      }
    };
  }, [viewMode, chartMetric, comparisonData]);

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

  const formatWebsiteUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  // Helper to get nested latest values safely
  const getLatestValue = (data: ComparisonData, path: string) => {
    const parts = path.split('.');
    let value: any = data.basic_info?.latest;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  };

  const renderChart = () => {
    if (chartInstance.current) {
      try {
        chartInstance.current.destroy();
      } catch (e) {}
      chartInstance.current = null;
    }

    if (!chartRef.current) return;

    const names = comparisonData.map(d => 
      d.basic_info.school.name.length > 25 
        ? d.basic_info.school.name.substring(0, 22) + '...'
        : d.basic_info.school.name
    );

    let values: number[] = [];
    let label = '';
    let color = '#3b82f6';
    let formatter = (v: number) => v.toString();

    switch (chartMetric) {
      case 'cost':
        values = comparisonData.map(d => getLatestValue(d, 'cost.avg_net_price.overall') || 0);
        label = 'Average Net Price ($)';
        color = '#f59e0b';
        formatter = (v) => `$${(v / 1000).toFixed(0)}K`;
        break;
      case 'earnings':
        values = comparisonData.map(d => getLatestValue(d, 'earnings.10_yrs_after_entry.median') || 0);
        label = 'Median Earnings 10yr ($)';
        color = '#10b981';
        formatter = (v) => `$${(v / 1000).toFixed(0)}K`;
        break;
      case 'completion':
        values = comparisonData.map(d => (getLatestValue(d, 'completion.completion_rate_4yr_150nt') || 0) * 100);
        label = 'Graduation Rate (%)';
        color = '#8b5cf6';
        formatter = (v) => `${v.toFixed(0)}%`;
        break;
      case 'size':
        values = comparisonData.map(d => getLatestValue(d, 'student.size') || 0);
        label = 'Student Population';
        color = '#3b82f6';
        formatter = (v) => v.toLocaleString();
        break;
    }

    chartInstance.current = c3.generate({
      bindto: chartRef.current,
      data: {
        columns: [[label, ...values]],
        type: 'bar',
        colors: { [label]: color },
      },
      axis: {
        x: {
          type: 'category',
          categories: names,
          tick: { rotate: -30, multiline: false },
          height: 80,
        },
        y: {
          label: { text: label, position: 'outer-middle' },
          tick: { format: formatter },
        },
      },
      bar: { width: { ratio: 0.6 } },
      legend: { show: false },
      tooltip: {
        format: {
          value: (value: any) => formatter(value),
        },
      },
    });
  };

  const getWinner = (metric: string, higherIsBetter: boolean = true): number | null => {
    if (comparisonData.length < 2) return null;
    
    let bestValue = higherIsBetter ? -Infinity : Infinity;
    let winnerId = null;
    
    comparisonData.forEach(data => {
      const value = getLatestValue(data, metric);
      if (value !== null && value !== undefined) {
        if ((higherIsBetter && value > bestValue) || (!higherIsBetter && value < bestValue)) {
          bestValue = value;
          winnerId = data.school_id;
        }
      }
    });
    
    return winnerId;
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
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <h2 className="text-xl font-bold mb-4">No Schools Selected</h2>
          <p className="text-gray mb-4">
            You haven't selected any schools to compare yet.<br/>
            Browse schools and click "Add to Compare" to get started.
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-2xl font-bold mb-2">Compare Schools</h1>
          <p className="text-gray">
            Comparing {comparisonData.length} school{comparisonData.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', borderRadius: '0.5rem', padding: '0.25rem' }}>
          {(['cards', 'table', 'charts'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: viewMode === mode ? 'white' : 'transparent',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: viewMode === mode ? '600' : '400',
                boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'capitalize'
              }}
            >
              {mode === 'cards' ? '🃏 Cards' : mode === 'table' ? '📋 Table' : '📊 Charts'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(comparisonData.length, 3)}, 1fr)`, gap: '1.5rem' }}>
          {comparisonData.map((data) => {
            const ownershipColor = getOwnershipColor(data.basic_info.school.ownership);
            const isHighlighted = highlightedSchool === data.school_id;
            
            return (
              <div
                key={data.school_id}
                className="card"
                style={{
                  borderTop: `4px solid ${ownershipColor}`,
                  transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isHighlighted ? '0 8px 25px rgba(0,0,0,0.15)' : '',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={() => setHighlightedSchool(data.school_id)}
                onMouseLeave={() => setHighlightedSchool(null)}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontWeight: '600', fontSize: '1.1rem' }}>{data.basic_info.school.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {data.basic_info.school.city}, {data.basic_info.school.state}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(data.school_id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      padding: '0.25rem'
                    }}
                    title="Remove from comparison"
                  >
                    ×
                  </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <MetricRow
                    label="Net Price"
                    value={formatCurrency(getLatestValue(data, 'cost.avg_net_price.overall'))}
                    isWinner={getWinner('cost.avg_net_price.overall', false) === data.school_id}
                    color="#f59e0b"
                  />
                  <MetricRow
                    label="Earnings (10yr)"
                    value={formatCurrency(getLatestValue(data, 'earnings.10_yrs_after_entry.median'))}
                    isWinner={getWinner('earnings.10_yrs_after_entry.median', true) === data.school_id}
                    color="#10b981"
                  />
                  <MetricRow
                    label="Graduation Rate"
                    value={formatPercentage(getLatestValue(data, 'completion.completion_rate_4yr_150nt'))}
                    isWinner={getWinner('completion.completion_rate_4yr_150nt', true) === data.school_id}
                    color="#8b5cf6"
                  />
                  <MetricRow
                    label="Acceptance Rate"
                    value={formatPercentage(getLatestValue(data, 'admissions.admission_rate.overall'))}
                    isWinner={getWinner('admissions.admission_rate.overall', false) === data.school_id}
                    color="#3b82f6"
                  />
                  <MetricRow
                    label="Student Size"
                    value={formatNumber(getLatestValue(data, 'student.size'))}
                    color="#6b7280"
                  />
                  <MetricRow
                    label="SAT Average"
                    value={getLatestValue(data, 'admissions.sat_scores.average.overall')?.toString() || 'N/A'}
                    isWinner={getWinner('admissions.sat_scores.average.overall', true) === data.school_id}
                    color="#ec4899"
                  />
                </div>

                {/* Actions */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={`/school/${data.school_id}`}
                    className="btn btn-outline"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    View Details
                  </a>
                  {data.basic_info.school.school_url && (
                    <a
                      href={formatWebsiteUrl(data.basic_info.school.school_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                    >
                      Website →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Metric</th>
                {comparisonData.map((data) => (
                  <th key={data.school_id} style={{ padding: '1rem', textAlign: 'center', minWidth: '180px' }}>
                    <div style={{ fontWeight: '600' }}>{data.basic_info.school.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '400' }}>
                      {data.basic_info.school.city}, {data.basic_info.school.state}
                    </div>
                    <button
                      onClick={() => handleRemove(data.school_id)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.25rem' }}
                    >
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Type', path: null, getValue: (d: ComparisonData) => getOwnershipLabel(d.basic_info.school.ownership) },
                { label: 'Student Size', path: 'student.size', format: formatNumber },
                { label: 'Acceptance Rate', path: 'admissions.admission_rate.overall', format: formatPercentage, lowerBetter: true },
                { label: 'SAT Average', path: 'admissions.sat_scores.average.overall' },
                { label: 'ACT Midpoint', path: 'admissions.act_scores.midpoint.cumulative' },
                { label: 'Net Price', path: 'cost.avg_net_price.overall', format: formatCurrency, lowerBetter: true },
                { label: 'In-State Tuition', path: 'cost.tuition.in_state', format: formatCurrency },
                { label: 'Out-of-State Tuition', path: 'cost.tuition.out_of_state', format: formatCurrency },
                { label: 'Graduation Rate', path: 'completion.completion_rate_4yr_150nt', format: formatPercentage },
                { label: 'Earnings (6yr)', path: 'earnings.6_yrs_after_entry.median', format: formatCurrency },
                { label: 'Earnings (10yr)', path: 'earnings.10_yrs_after_entry.median', format: formatCurrency },
                { label: 'Median Debt', path: 'aid.median_debt.completers.overall', format: formatCurrency, lowerBetter: true },
                { label: 'Pell Grant Rate', path: 'aid.pell_grant_rate', format: formatPercentage },
                { label: 'Default Rate (3yr)', path: 'repayment.3_yr_default_rate', format: formatPercentage, lowerBetter: true },
              ].map((row) => {
                const winner = row.path ? getWinner(row.path, !row.lowerBetter) : null;
                return (
                  <tr key={row.label} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{row.label}</td>
                    {comparisonData.map((data) => {
                      const value = row.getValue 
                        ? row.getValue(data) 
                        : row.path 
                          ? getLatestValue(data, row.path) 
                          : null;
                      const formatted = row.format && value !== null && value !== undefined
                        ? row.format(value)
                        : value ?? 'N/A';
                      const isWinner = winner === data.school_id;
                      
                      return (
                        <td
                          key={data.school_id}
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: 'center',
                            background: isWinner ? '#dcfce7' : 'transparent',
                            fontWeight: isWinner ? '600' : '400',
                            color: isWinner ? '#166534' : 'inherit'
                          }}
                        >
                          {formatted}
                          {isWinner && ' 🏆'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts View */}
      {viewMode === 'charts' && (
        <div>
          {/* Metric Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {([
              { key: 'cost', label: '💰 Cost', color: '#f59e0b' },
              { key: 'earnings', label: '💵 Earnings', color: '#10b981' },
              { key: 'completion', label: '🎓 Graduation', color: '#8b5cf6' },
              { key: 'size', label: '👥 Size', color: '#3b82f6' },
            ] as const).map((metric) => (
              <button
                key={metric.key}
                onClick={() => setChartMetric(metric.key)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: chartMetric === metric.key ? `2px solid ${metric.color}` : '2px solid #e5e7eb',
                  background: chartMetric === metric.key ? `${metric.color}15` : 'white',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: chartMetric === metric.key ? '600' : '400',
                  color: chartMetric === metric.key ? metric.color : '#374151'
                }}
              >
                {metric.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="card">
            <div ref={chartRef} style={{ height: '400px' }}></div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            {comparisonData.map((data) => (
              <div
                key={data.school_id}
                className="card"
                style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{data.basic_info.school.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {data.basic_info.school.city}, {data.basic_info.school.state}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(data.school_id)}
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    color: '#dc2626',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <a href="/" className="btn btn-outline">
          ← Add More Schools
        </a>
        <button
          onClick={() => {
            localStorage.removeItem('compareList');
            setCompareList([]);
            setComparisonData([]);
          }}
          className="btn"
          style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

// Helper component for metric rows in card view
const MetricRow: React.FC<{
  label: string;
  value: string;
  isWinner?: boolean;
  color: string;
}> = ({ label, value, isWinner, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{label}</span>
    <span style={{ 
      fontWeight: '600',
      color: isWinner ? '#166534' : 'inherit',
      background: isWinner ? '#dcfce7' : 'transparent',
      padding: isWinner ? '0.125rem 0.5rem' : '0',
      borderRadius: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      {value}
      {isWinner && <span>🏆</span>}
    </span>
  </div>
);

export default Compare;