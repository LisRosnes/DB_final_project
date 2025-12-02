import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { aggregationsAPI, programsAPI } from '../services/api';
import { ROIData, StateAggregation, ProgramTrend, CIPCode, CostVsEarningsData } from '../types';
import { US_STATES, formatCurrency, formatCurrencyCompact, formatPercentage, getOwnershipColor } from '../utils/helpers';

const Analytics: React.FC = () => {
  const [roiData, setRoiData] = useState<ROIData[]>([]);
  const [stateData, setStateData] = useState<StateAggregation[]>([]);
  const [programTrends, setProgramTrends] = useState<ProgramTrend[]>([]);
  const [costVsEarnings, setCostVsEarnings] = useState<CostVsEarningsData[]>([]);
  const [cipCodes, setCipCodes] = useState<CIPCode[]>([]);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCIP, setSelectedCIP] = useState<string>('1102');
  const [selectedMetric, setSelectedMetric] = useState<'cost' | 'earnings' | 'completion'>('earnings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [roiResp, stateResp, trendsResp, costEarnResp, cipResp] = await Promise.all([
        aggregationsAPI.getROI({ major: 'computer', year: 2023 }),
        aggregationsAPI.getStateAggregations(),
        programsAPI.getTrends('1102', 2015, 2023),
        aggregationsAPI.getCostVsEarnings({ year: 2023, limit: 200 }),
        programsAPI.getCIPCodes(),
      ]);

      setRoiData(roiResp.roi_data.slice(0, 15));
      setStateData(stateResp.aggregations);
      setProgramTrends(trendsResp.trends);
      setCostVsEarnings(costEarnResp.data);
      setCipCodes(cipResp.cip_codes);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStateFilter = useCallback(async (state: string) => {
    setSelectedState(state);
    try {
      const response = await aggregationsAPI.getROI(state ? { state, year: 2023 } : { major: 'computer', year: 2023 });
      setRoiData(response.roi_data.slice(0, 15));
    } catch (error) {
      console.error('Error filtering by state:', error);
    }
  }, []);

  const handleCIPChange = useCallback(async (cipCode: string) => {
    setSelectedCIP(cipCode);
    try {
      const response = await programsAPI.getTrends(cipCode, 2015, 2023);
      setProgramTrends(response.trends);
    } catch (error) {
      console.error('Error loading program trends:', error);
    }
  }, []);

  // Prepare state data for bar chart
  const stateChartData = [...stateData]
    .filter((s) => s._id && s[`avg_${selectedMetric === 'completion' ? 'completion_rate' : selectedMetric === 'cost' ? 'cost' : 'earnings_10yr'}`])
    .sort((a, b) => {
      const key = selectedMetric === 'completion' ? 'avg_completion_rate' : selectedMetric === 'cost' ? 'avg_cost' : 'avg_earnings_10yr';
      return (b[key] || 0) - (a[key] || 0);
    })
    .slice(0, 20)
    .map((s) => ({
      state: s._id,
      value:
        selectedMetric === 'completion'
          ? (s.avg_completion_rate || 0) * 100
          : selectedMetric === 'cost'
          ? s.avg_cost
          : s.avg_earnings_10yr,
      schools: s.school_count,
    }));

  // ROI chart data
  const roiChartData = roiData.map((d) => ({
    name: d.school_name.length > 20 ? d.school_name.substring(0, 20) + '...' : d.school_name,
    fullName: d.school_name,
    roi: d.roi_10yr * 100,
    cost: d.cost,
    earnings: d.earnings_10yr,
    state: d.state,
  }));

  // Program trends data
  const trendsChartData = programTrends.map((t) => ({
    year: t._id,
    '1 Year': t.avg_1yr_earnings || 0,
    '3 Years': t.avg_3yr_earnings || 0,
    '5 Years': t.avg_5yr_earnings || 0,
  }));

  // Custom tooltip for scatter plot
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: 'var(--color-white)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-gray-200)',
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{data.school_name}</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
            Cost: {formatCurrency(data.cost)}
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
            Earnings: {formatCurrency(data.earnings)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container">
          <div className="loading-wrapper">
            <div className="spinner" />
            <p className="text-gray">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Analytics & Insights</h1>
          <p className="text-gray text-lg">
            Explore trends, ROI comparisons, and state-level statistics
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="stat-card-label">📊 Schools Analyzed</div>
            <div className="stat-card-value">{stateData.reduce((sum, s) => sum + s.school_count, 0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">🗺️ States Covered</div>
            <div className="stat-card-value">{stateData.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">💰 Avg Cost</div>
            <div className="stat-card-value">
              {formatCurrencyCompact(
                stateData.reduce((sum, s) => sum + (s.avg_cost || 0), 0) / stateData.length
              )}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">📈 Avg Earnings</div>
            <div className="stat-card-value">
              {formatCurrencyCompact(
                stateData.reduce((sum, s) => sum + (s.avg_earnings_10yr || 0), 0) / stateData.length
              )}
            </div>
          </div>
        </div>

        {/* ROI Chart */}
        <div className="card mb-6">
          <div className="card-header flex justify-between items-center">
            <span>📈 Top Schools by ROI (Return on Investment)</span>
            <select
              className="form-select"
              style={{ width: '200px' }}
              value={selectedState}
              onChange={(e) => handleStateFilter(e.target.value)}
            >
              <option value="">All States</option>
              {US_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={roiChartData} layout="vertical" margin={{ left: 150, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  stroke="var(--color-gray-400)"
                />
                <YAxis type="category" dataKey="name" stroke="var(--color-gray-400)" width={140} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROI']}
                  labelFormatter={(label) => roiChartData.find((d) => d.name === label)?.fullName || label}
                  contentStyle={{
                    background: 'var(--color-white)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--color-gray-200)',
                  }}
                />
                <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                  {roiChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.roi >= 100 ? 'var(--color-success)' : entry.roi >= 50 ? 'var(--color-info)' : 'var(--color-warning)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray mt-4">
              ROI = (10-year earnings × 10 - Cost × 4) / (Cost × 4). Higher is better.
            </p>
          </div>
        </div>

        {/* Program Trends */}
        <div className="card mb-6">
          <div className="card-header flex justify-between items-center">
            <span>📚 Program Earnings Trends by Years After Graduation</span>
            <select
              className="form-select"
              style={{ width: '300px' }}
              value={selectedCIP}
              onChange={(e) => handleCIPChange(e.target.value)}
            >
              {cipCodes.map((cip) => (
                <option key={cip.code} value={cip.code}>
                  {cip.title}
                </option>
              ))}
            </select>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendsChartData} margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                <XAxis dataKey="year" stroke="var(--color-gray-400)" />
                <YAxis
                  tickFormatter={(v) => formatCurrencyCompact(v)}
                  stroke="var(--color-gray-400)"
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    background: 'var(--color-white)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--color-gray-200)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="1 Year"
                  stroke="var(--color-info)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-info)' }}
                />
                <Line
                  type="monotone"
                  dataKey="3 Years"
                  stroke="var(--color-success)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-success)' }}
                />
                <Line
                  type="monotone"
                  dataKey="5 Years"
                  stroke="var(--color-warning)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-warning)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Comparison */}
        <div className="card mb-6">
          <div className="card-header flex justify-between items-center">
            <span>🗺️ State-Level Comparison</span>
            <div className="flex gap-2">
              {(['cost', 'earnings', 'completion'] as const).map((metric) => (
                <button
                  key={metric}
                  className={`btn btn-sm ${selectedMetric === metric ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedMetric(metric)}
                >
                  {metric === 'cost' ? '💰 Cost' : metric === 'earnings' ? '💵 Earnings' : '🎓 Completion'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stateChartData} margin={{ left: 20, right: 30, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                <XAxis
                  dataKey="state"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  stroke="var(--color-gray-400)"
                />
                <YAxis
                  tickFormatter={(v) =>
                    selectedMetric === 'completion' ? `${v.toFixed(0)}%` : formatCurrencyCompact(v)
                  }
                  stroke="var(--color-gray-400)"
                />
                <Tooltip
                  formatter={(value: number) =>
                    selectedMetric === 'completion' ? `${value.toFixed(1)}%` : formatCurrency(value)
                  }
                  contentStyle={{
                    background: 'var(--color-white)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--color-gray-200)',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stateChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        selectedMetric === 'cost'
                          ? 'var(--color-warning)'
                          : selectedMetric === 'earnings'
                          ? 'var(--color-success)'
                          : 'var(--color-info)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray mt-2">
              Showing top 20 states by{' '}
              {selectedMetric === 'cost' ? 'average cost' : selectedMetric === 'earnings' ? 'average earnings' : 'completion rate'}
            </p>
          </div>
        </div>

        {/* Cost vs Earnings Scatter */}
        <div className="card mb-6">
          <div className="card-header">💰 Cost vs. Earnings (10-Year Median)</div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ left: 20, right: 30, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                <XAxis
                  type="number"
                  dataKey="cost"
                  name="Cost"
                  tickFormatter={(v) => formatCurrencyCompact(v)}
                  stroke="var(--color-gray-400)"
                  label={{ value: 'Average Net Price', position: 'bottom', fill: 'var(--color-gray-500)' }}
                />
                <YAxis
                  type="number"
                  dataKey="earnings"
                  name="Earnings"
                  tickFormatter={(v) => formatCurrencyCompact(v)}
                  stroke="var(--color-gray-400)"
                  label={{ value: 'Median Earnings (10yr)', angle: -90, position: 'insideLeft', fill: 'var(--color-gray-500)' }}
                />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter data={costVsEarnings} fill="var(--color-primary)">
                  {costVsEarnings.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getOwnershipColor(entry.ownership)}
                      opacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="chart-legend mt-4">
              <div className="chart-legend-item">
                <div className="chart-legend-color" style={{ background: getOwnershipColor(1) }} />
                <span>Public</span>
              </div>
              <div className="chart-legend-item">
                <div className="chart-legend-color" style={{ background: getOwnershipColor(2) }} />
                <span>Private Nonprofit</span>
              </div>
              <div className="chart-legend-item">
                <div className="chart-legend-color" style={{ background: getOwnershipColor(3) }} />
                <span>Private For-Profit</span>
              </div>
            </div>
            <p className="text-sm text-gray mt-2">
              Schools in the upper-left offer better value (lower cost, higher earnings).
            </p>
          </div>
        </div>

        {/* Methodology Card */}
        <div className="card">
          <div className="card-header">📖 About These Metrics</div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">ROI (Return on Investment)</h4>
                <p className="text-sm text-gray">
                  Calculated as: (10-year earnings × 10 - 4-year cost × 4) / (4-year cost × 4). This shows the
                  financial return relative to the cost of education over a 10-year period after graduation.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Program Trends</h4>
                <p className="text-sm text-gray">
                  Tracks median earnings at 1, 3, and 5 years after graduation for specific programs. Useful for
                  identifying growing fields and career trajectories.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">State Comparisons</h4>
                <p className="text-sm text-gray">
                  Aggregates data across all schools in each state. Helpful for understanding regional trends and
                  comparing educational outcomes geographically.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cost vs. Earnings</h4>
                <p className="text-sm text-gray">
                  Scatter plot showing the relationship between average net price and median earnings 10 years
                  after graduation. Each point represents one school.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;