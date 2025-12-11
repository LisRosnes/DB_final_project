import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
  PieChart,
  Pie,
  Area,
  ComposedChart,
} from 'recharts';
import { schoolsAPI } from '../services/api';
import { US_STATES, formatCurrency, formatCurrencyCompact, formatPercentage, getOwnershipColor, getOwnershipLabel } from '../utils/helpers';

interface StateAnalytics {
  state: string;
  year: number;
  summary: {
    total_schools: number;
    avg_cost: number;
    median_cost: number;
    min_cost: number;
    max_cost: number;
    avg_earnings_6yr: number;
    avg_earnings_10yr: number;
    median_earnings_10yr: number;
    avg_completion_rate: number;
    avg_pell_grant_rate: number;
    avg_federal_loan_rate: number;
    avg_default_rate: number;
  };
  by_ownership: Array<{
    _id: number;
    count: number;
    avg_cost: number;
    avg_earnings_10yr: number;
    avg_completion_rate: number;
  }>;
  top_schools_by_earnings: SchoolMetric[];
  top_schools_by_value: SchoolMetric[];
  most_affordable: SchoolMetric[];
  highest_completion: SchoolMetric[];
  cost_distribution: Array<{ _id: number | string; count: number; avg_earnings: number }>;
  earnings_distribution: Array<{ _id: number | string; count: number }>;
  all_schools: SchoolMetric[];
}

interface SchoolMetric {
  school_id: number;
  school_name: string;
  city: string;
  ownership: number;
  cost: number;
  earnings_6yr?: number;
  earnings_10yr: number;
  completion_rate: number;
  roi?: number;
}

interface SchoolAnalytics {
  school_id: number;
  year: number;
  metrics: {
    school_id: number;
    school_name: string;
    city: string;
    state: string;
    ownership: number;
    cost: number;
    earnings_6yr: number;
    earnings_10yr: number;
    completion_rate: number;
    completion_rate_100: number;
    completion_rate_200: number;
    pell_grant_rate: number;
    federal_loan_rate: number;
    default_rate: number;
    roi: number;
    payback_years: number;
    completion_by_race: {
      white: number;
      black: number;
      hispanic: number;
      asian: number;
    };
  };
  state_comparison: {
    state_avg_cost: number;
    state_avg_earnings_10yr: number;
    state_avg_completion_rate: number;
    state_avg_pell_rate: number;
    state_avg_default_rate: number;
    total_schools: number;
  } | null;
  national_comparison: {
    national_avg_cost: number;
    national_avg_earnings_10yr: number;
    national_avg_completion_rate: number;
    national_avg_pell_rate: number;
    national_avg_default_rate: number;
    total_schools: number;
  };
  historical_trends: Array<{
    year: number;
    cost: number;
    earnings_6yr: number;
    earnings_10yr: number;
    completion_rate: number;
  }>;
}

interface StateComparison {
  _id: string;
  total_schools: number;
  avg_cost: number;
  avg_earnings_10yr: number;
  avg_completion_rate: number;
}

interface TrendData {
  year: number;
  avg_cost: number;
  avg_earnings_10yr: number;
  avg_completion_rate: number;
  total_schools: number;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'state' | 'school' | 'trends'>('state');
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [availableYears, setAvailableYears] = useState<number[]>([2023, 2022, 2021, 2020, 2019, 2018,2017,2016,2015,2014,2013,2012]);

  const [selectedState, setSelectedState] = useState<string>('');
  const [stateAnalytics, setStateAnalytics] = useState<StateAnalytics | null>(null);
  const [stateComparisons, setStateComparisons] = useState<StateComparison[]>([]);
  const [stateMetric, setStateMetric] = useState<'cost' | 'earnings' | 'completion'>('earnings');

  const [schoolSearchQuery, setSchoolSearchQuery] = useState<string>('');
  const [schoolSearchResults, setSchoolSearchResults] = useState<any[]>([]);
  const [schoolAnalytics, setSchoolAnalytics] = useState<SchoolAnalytics | null>(null);

  const [trendsData, setTrendsData] = useState<TrendData[]>([]);
  const [trendsState, setTrendsState] = useState<string>('');
  const [trendsStartYear, setTrendsStartYear] = useState<number>(2019);
  const [trendsEndYear, setTrendsEndYear] = useState<number>(2023);
  const [trendsLoading, setTrendsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableYears();
    loadStateComparisons();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadStateComparisons();
    }
  }, [selectedYear]);

  const loadAvailableYears = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics/available-years`);
      if (response.ok) {
        const data = await response.json();
        if (data.years && data.years.length > 0) {
          setAvailableYears(data.years);
        }
      }
    } catch (err) {
      console.error('Error loading available years:', err);
    }
  };

  const loadStateComparisons = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics/state-comparison?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setStateComparisons(data.states || []);
      }
    } catch (err) {
      console.error('Error loading state comparisons:', err);
    }
  };

  const loadStateAnalytics = async (stateCode: string) => {
    if (!stateCode) {
      setStateAnalytics(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/analytics/state/${stateCode}?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setStateAnalytics(data);
      } else {
        setError('Failed to load state analytics');
      }
    } catch (err) {
      setError('Error loading state analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
    loadStateAnalytics(stateCode);
  };

  const searchSchools = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSchoolSearchResults([]);
      return;
    }
    try {
      const response = await schoolsAPI.search(query, 10);
      setSchoolSearchResults(response.results || []);
    } catch (err) {
      console.error('Error searching schools:', err);
    }
  }, []);

  const loadSchoolAnalytics = async (schoolId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/analytics/school/${schoolId}?year=${selectedYear}&include_history=true`);
      if (response.ok) {
        const data = await response.json();
        setSchoolAnalytics(data);
        setSchoolSearchResults([]);
        setSchoolSearchQuery('');
      } else {
        setError('Failed to load school analytics');
      }
    } catch (err) {
      setError('Error loading school analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendsData = async () => {
    setTrendsLoading(true);
    try {
      const promises = [];
      for (let year = trendsStartYear; year <= trendsEndYear; year++) {
        const url = trendsState
          ? `${API_BASE}/analytics/state/${trendsState}?year=${year}`
          : `${API_BASE}/analytics/state-comparison?year=${year}`;
        promises.push(fetch(url).then(r => r.json()));
      }
      const results = await Promise.all(promises);
      const trendData: TrendData[] = results.map((data, idx) => {
        const year = trendsStartYear + idx;
        if (trendsState) {
          return {
            year,
            avg_cost: data.summary?.avg_cost || 0,
            avg_earnings_10yr: data.summary?.avg_earnings_10yr || 0,
            avg_completion_rate: data.summary?.avg_completion_rate || 0,
            total_schools: data.summary?.total_schools || 0,
          };
        } else {
          const states = data.states || [];
          const totalSchools = states.reduce((sum: number, s: any) => sum + (s.total_schools || 0), 0);
          const avgCost = states.reduce((sum: number, s: any) => sum + (s.avg_cost || 0), 0) / (states.length || 1);
          const avgEarnings = states.reduce((sum: number, s: any) => sum + (s.avg_earnings_10yr || 0), 0) / (states.length || 1);
          const avgCompletion = states.reduce((sum: number, s: any) => sum + (s.avg_completion_rate || 0), 0) / (states.length || 1);
          return { year, avg_cost: avgCost, avg_earnings_10yr: avgEarnings, avg_completion_rate: avgCompletion, total_schools: totalSchools };
        }
      });
      setTrendsData(trendData);
    } catch (err) {
      console.error('Error loading trends:', err);
    } finally {
      setTrendsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trends') {
      loadTrendsData();
    }
  }, [activeTab, trendsState, trendsStartYear, trendsEndYear]);

  const stateChartData = stateComparisons
    .filter(s => s._id && s[`avg_${stateMetric === 'completion' ? 'completion_rate' : stateMetric === 'cost' ? 'cost' : 'earnings_10yr'}`])
    .sort((a, b) => {
      const key = stateMetric === 'completion' ? 'avg_completion_rate' : stateMetric === 'cost' ? 'avg_cost' : 'avg_earnings_10yr';
      return ((b as any)[key] || 0) - ((a as any)[key] || 0);
    })
    .slice(0, 15)
    .map(s => ({
      state: s._id,
      value: stateMetric === 'completion' ? ((s as any).avg_completion_rate || 0) * 100 : stateMetric === 'cost' ? s.avg_cost : s.avg_earnings_10yr,
      schools: s.total_schools,
    }));

  const tabs = [
    { id: 'state' as const, label: 'By State', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> },
    { id: 'school' as const, label: 'By School', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> },
    { id: 'trends' as const, label: 'Trends', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> },
  ];

  const renderStateTab = () => (
    <div>
      <div className="card mb-6">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>State Analytics</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select className="form-select" style={{ width: '200px' }} value={selectedState} onChange={(e) => handleStateChange(e.target.value)}>
              <option value="">Select a State</option>
              {US_STATES.map((state) => (<option key={state.code} value={state.code}>{state.name}</option>))}
            </select>
            <select className="form-select" style={{ width: '120px' }} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {availableYears.map((year) => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
        </div>
      </div>
      {!selectedState && (
        <div>
          <div className="card mb-6">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>State Comparison - Top 15 States</span>
              <div className="metric-toggle">
                {(['cost', 'earnings', 'completion'] as const).map((metric) => (
                  <button key={metric} className={`metric-toggle-btn ${stateMetric === metric ? 'active' : ''}`} onClick={() => setStateMetric(metric)}>
                    {metric === 'cost' ? 'Cost' : metric === 'earnings' ? 'Earnings' : 'Completion'}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stateChartData} margin={{ left: 20, right: 30, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                  <XAxis dataKey="state" angle={-45} textAnchor="end" height={60} stroke="var(--color-gray-400)" />
                  <YAxis tickFormatter={(v) => stateMetric === 'completion' ? `${v.toFixed(0)}%` : formatCurrencyCompact(v)} stroke="var(--color-gray-400)" />
                  <Tooltip formatter={(value: number) => stateMetric === 'completion' ? `${value.toFixed(1)}%` : formatCurrency(value)} contentStyle={{ background: 'var(--color-white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-gray-200)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stateChartData.map((_, index) => (<Cell key={`cell-${index}`} fill={stateMetric === 'cost' ? 'var(--color-warning)' : stateMetric === 'earnings' ? 'var(--color-success)' : 'var(--color-info)'} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header">All States Overview</div>
            <div className="card-body">
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="table">
                  <thead><tr><th>State</th><th>Schools</th><th>Avg Cost</th><th>Avg Earnings (10yr)</th><th>Avg Completion</th><th>Actions</th></tr></thead>
                  <tbody>
                    {stateComparisons.map((state) => (
                      <tr key={state._id}>
                        <td>{state._id}</td>
                        <td>{state.total_schools}</td>
                        <td>{state.avg_cost ? formatCurrency(state.avg_cost) : 'N/A'}</td>
                        <td>{state.avg_earnings_10yr ? formatCurrency(state.avg_earnings_10yr) : 'N/A'}</td>
                        <td>{state.avg_completion_rate ? formatPercentage(state.avg_completion_rate) : 'N/A'}</td>
                        <td><button className="btn btn-sm btn-outline" onClick={() => handleStateChange(state._id)}>View Details</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedState && stateAnalytics && (
        <div>
          <div className="mb-4">
            <button className="btn btn-outline" onClick={() => setSelectedState('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><polyline points="15 18 9 12 15 6"></polyline></svg>
              Back to All States
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="stat-card"><div className="stat-card-label">Total Schools</div><div className="stat-card-value">{stateAnalytics.summary?.total_schools || 0}</div></div>
            <div className="stat-card"><div className="stat-card-label">Avg Cost</div><div className="stat-card-value">{stateAnalytics.summary?.avg_cost ? formatCurrencyCompact(stateAnalytics.summary.avg_cost) : 'N/A'}</div></div>
            <div className="stat-card"><div className="stat-card-label">Avg Earnings (10yr)</div><div className="stat-card-value">{stateAnalytics.summary?.avg_earnings_10yr ? formatCurrencyCompact(stateAnalytics.summary.avg_earnings_10yr) : 'N/A'}</div></div>
            <div className="stat-card"><div className="stat-card-label">Avg Completion</div><div className="stat-card-value">{stateAnalytics.summary?.avg_completion_rate ? formatPercentage(stateAnalytics.summary.avg_completion_rate) : 'N/A'}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="card">
              <div className="card-header">By Institution Type</div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stateAnalytics.by_ownership.map(o => ({
                        name: getOwnershipLabel(o._id),
                        value: o.count,
                        ownership: o._id,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {stateAnalytics.by_ownership.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getOwnershipColor(entry._id)} />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header">Top Schools by Earnings</div>
              <div className="card-body">
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="table table-sm">
                    <thead><tr><th>School</th><th>Earnings</th></tr></thead>
                    <tbody>
                      {stateAnalytics.top_schools_by_earnings.slice(0, 5).map((school, idx) => (
                        <tr key={school.school_id}>
                          <td><button className="btn-link" onClick={() => { setActiveTab('school'); loadSchoolAnalytics(school.school_id); }}>{idx + 1}. {school.school_name}</button></td>
                          <td className="font-semibold text-success">{formatCurrency(school.earnings_10yr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">All Schools in {selectedState}</div>
            <div className="card-body">
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="table">
                  <thead><tr><th>School</th><th>Type</th><th>Cost</th><th>Earnings</th><th>Completion</th><th>Actions</th></tr></thead>
                  <tbody>
                    {stateAnalytics.all_schools.map((school) => (
                      <tr key={school.school_id}>
                        <td>{school.school_name}</td>
                        <td><span className="badge" style={{ backgroundColor: getOwnershipColor(school.ownership), color: 'white' }}>{getOwnershipLabel(school.ownership)}</span></td>
                        <td>{school.cost ? formatCurrency(school.cost) : 'N/A'}</td>
                        <td>{school.earnings_10yr ? formatCurrency(school.earnings_10yr) : 'N/A'}</td>
                        <td>{school.completion_rate ? formatPercentage(school.completion_rate) : 'N/A'}</td>
                        <td><button className="btn btn-sm btn-outline" onClick={() => { setActiveTab('school'); loadSchoolAnalytics(school.school_id); }}>Analyze</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSchoolTab = () => (
    <div>
      <div className="card mb-6">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>School Analytics</span>
          <select className="form-select" style={{ width: '120px' }} value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {availableYears.map((year) => (<option key={year} value={year}>{year}</option>))}
          </select>
        </div>
        <div className="card-body">
          <div style={{ position: 'relative' }}>
            <input type="text" className="form-input" placeholder="Search for a school..." value={schoolSearchQuery} onChange={(e) => { setSchoolSearchQuery(e.target.value); searchSchools(e.target.value); }} style={{ width: '100%' }} />
            {schoolSearchResults.length > 0 && (
              <div className="search-dropdown">
                {schoolSearchResults.map((school) => (
                  <div key={school.school_id} className="search-dropdown-item" onClick={() => loadSchoolAnalytics(school.school_id)}>
                    <div className="search-dropdown-name">{school.school?.name || school.school_name}</div>
                    <div className="search-dropdown-meta">{school.school?.city}, {school.school?.state}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {!schoolAnalytics && !loading && (
        <div className="card"><div className="card-body text-center py-12"><h3 className="text-lg font-semibold mb-2">Search for a School</h3><p className="text-gray">Enter a school name above to view detailed analytics.</p></div></div>
      )}
      {schoolAnalytics && (
        <div>
          <div className="mb-4"><button className="btn btn-outline" onClick={() => setSchoolAnalytics(null)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><polyline points="15 18 9 12 15 6"></polyline></svg>Search Another School</button></div>
          <div className="card mb-6"><div className="card-header"><h2 className="text-xl font-semibold">{schoolAnalytics.metrics.school_name}</h2><p className="text-gray">{schoolAnalytics.metrics.city}, {schoolAnalytics.metrics.state} - {getOwnershipLabel(schoolAnalytics.metrics.ownership)}</p></div></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="stat-card"><div className="stat-card-label">Net Cost</div><div className="stat-card-value">{schoolAnalytics.metrics.cost ? formatCurrencyCompact(schoolAnalytics.metrics.cost) : 'N/A'}</div></div>
            <div className="stat-card"><div className="stat-card-label">Earnings (10yr)</div><div className="stat-card-value">{schoolAnalytics.metrics.earnings_10yr ? formatCurrencyCompact(schoolAnalytics.metrics.earnings_10yr) : 'N/A'}</div></div>
            <div className="stat-card"><div className="stat-card-label">Completion Rate</div><div className="stat-card-value">{schoolAnalytics.metrics.completion_rate ? formatPercentage(schoolAnalytics.metrics.completion_rate) : 'N/A'}</div></div>
            <div className="stat-card"><div className="stat-card-label">ROI (10yr)</div><div className="stat-card-value">{schoolAnalytics.metrics.roi ? `${(schoolAnalytics.metrics.roi * 100).toFixed(0)}%` : 'N/A'}</div></div>
          </div>
          <div className="card mb-6">
            <div className="card-header">Comparison: School vs State vs National</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={[{ metric: 'Cost', School: schoolAnalytics.metrics.cost, State: schoolAnalytics.state_comparison?.state_avg_cost, National: schoolAnalytics.national_comparison?.national_avg_cost }, { metric: 'Earnings (10yr)', School: schoolAnalytics.metrics.earnings_10yr, State: schoolAnalytics.state_comparison?.state_avg_earnings_10yr, National: schoolAnalytics.national_comparison?.national_avg_earnings_10yr }]} margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                  <XAxis dataKey="metric" stroke="var(--color-gray-400)" />
                  <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} stroke="var(--color-gray-400)" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: 'var(--color-white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-gray-200)' }} />
                  <Legend />
                  <Bar dataKey="School" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="State" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="National" fill="var(--color-gray-400)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {schoolAnalytics.historical_trends && schoolAnalytics.historical_trends.length > 1 && (
            <div className="card">
              <div className="card-header">Historical Trends</div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={schoolAnalytics.historical_trends} margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                    <XAxis dataKey="year" stroke="var(--color-gray-400)" />
                    <YAxis yAxisId="left" tickFormatter={(v) => formatCurrencyCompact(v)} stroke="var(--color-gray-400)" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} stroke="var(--color-gray-400)" />
                    <Tooltip contentStyle={{ background: 'var(--color-white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-gray-200)' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="cost" stroke="var(--color-warning)" strokeWidth={2} name="Cost" />
                    <Line yAxisId="left" type="monotone" dataKey="earnings_10yr" stroke="var(--color-success)" strokeWidth={2} name="Earnings" />
                    <Line yAxisId="right" type="monotone" dataKey="completion_rate" stroke="var(--color-info)" strokeWidth={2} name="Completion" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTrendsTab = () => (
    <div>
      <div className="card mb-6">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Multi-Year Trends Analysis</span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select className="form-select" style={{ width: '180px' }} value={trendsState} onChange={(e) => setTrendsState(e.target.value)}>
              <option value="">National Average</option>
              {US_STATES.map((state) => (<option key={state.code} value={state.code}>{state.name}</option>))}
            </select>
            <span className="text-gray">from</span>
            <select className="form-select" style={{ width: '100px' }} value={trendsStartYear} onChange={(e) => setTrendsStartYear(parseInt(e.target.value))}>
              {availableYears.map((year) => (<option key={year} value={year}>{year}</option>))}
            </select>
            <span className="text-gray">to</span>
            <select className="form-select" style={{ width: '100px' }} value={trendsEndYear} onChange={(e) => setTrendsEndYear(parseInt(e.target.value))}>
              {availableYears.map((year) => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
        </div>
      </div>
      {trendsLoading ? (
        <div className="card"><div className="card-body text-center py-12"><div className="spinner"></div><p className="mt-4 text-gray">Loading trends data...</p></div></div>
      ) : trendsData.length > 0 ? (
        <>
          <div className="card mb-6">
            <div className="card-header">Cost Trends Over Time</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={trendsData} margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                  <XAxis dataKey="year" stroke="var(--color-gray-400)" />
                  <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} stroke="var(--color-gray-400)" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: 'var(--color-white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-gray-200)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="avg_cost" fill="var(--color-warning)" fillOpacity={0.2} stroke="var(--color-warning)" strokeWidth={2} name="Average Cost" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card mb-6">
            <div className="card-header">Earnings Trends Over Time</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={trendsData} margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                  <XAxis dataKey="year" stroke="var(--color-gray-400)" />
                  <YAxis tickFormatter={(v) => formatCurrencyCompact(v)} stroke="var(--color-gray-400)" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: 'var(--color-white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-gray-200)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="avg_earnings_10yr" fill="var(--color-success)" fillOpacity={0.2} stroke="var(--color-success)" strokeWidth={2} name="Average Earnings (10yr)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header">Year-over-Year Data</div>
            <div className="card-body">
              <table className="table">
                <thead><tr><th>Year</th><th>Avg Cost</th><th>Avg Earnings (10yr)</th><th>Avg Completion</th><th>Schools</th></tr></thead>
                <tbody>
                  {trendsData.map((data) => (
                    <tr key={data.year}>
                      <td className="font-semibold">{data.year}</td>
                      <td>{data.avg_cost ? formatCurrency(data.avg_cost) : 'N/A'}</td>
                      <td>{data.avg_earnings_10yr ? formatCurrency(data.avg_earnings_10yr) : 'N/A'}</td>
                      <td>{data.avg_completion_rate ? formatPercentage(data.avg_completion_rate) : 'N/A'}</td>
                      <td>{data.total_schools?.toLocaleString() || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card"><div className="card-body text-center py-12"><p className="text-gray">No trends data available.</p></div></div>
      )}
    </div>
  );

  if (loading) {
    return (<div className="main-content"><div className="container"><div className="loading-wrapper"><div className="spinner" /><p className="text-gray">Loading analytics...</p></div></div></div>);
  }

  return (
    <div className="main-content">
      <div className="container">
        <div className="mb-8">
          <h1 style={{ marginBottom: 'var(--space-2)' }}>Analytics Dashboard</h1>
          <p className="text-gray text-lg">Comprehensive analytics by state, individual schools, and historical trends</p>
        </div>
        {error && <div className="alert alert-error mb-4">{error}</div>}
        <div className="custom-tabs mb-6">
          {tabs.map((tab) => (
            <button key={tab.id} className={`custom-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        {activeTab === 'state' && renderStateTab()}
        {activeTab === 'school' && renderSchoolTab()}
        {activeTab === 'trends' && renderTrendsTab()}
      </div>
    </div>
  );
};

export default Analytics;