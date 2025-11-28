import React, { useState, useEffect } from 'react';
import { aggregationsAPI, programsAPI } from '../services/api';
import { ROIData, StateAggregation, ProgramTrend, CIPCode } from '../types';
import ROIChart from '../components/ROIChart';
import ProgramTrendsChart from '../components/ProgramTrendsChart';
import StateMapChart from '../components/StateMapChart';
import CostVsEarningsChart from '../components/CostVsEarningsChart';
import { US_STATES } from '../utils/helpers';

const Analytics: React.FC = () => {
  const [roiData, setRoiData] = useState<ROIData[]>([]);
  const [stateData, setStateData] = useState<StateAggregation[]>([]);
  const [programTrends, setProgramTrends] = useState<ProgramTrend[]>([]);
  const [costVsEarnings, setCostVsEarnings] = useState<any[]>([]);
  const [cipCodes, setCipCodes] = useState<CIPCode[]>([]);
  
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCIP, setSelectedCIP] = useState<string>('1102'); // Computer Science default
  const [selectedMetric, setSelectedMetric] = useState<'cost' | 'earnings' | 'completion'>('earnings');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllData();
    loadCIPCodes();
  }, []);

  const loadCIPCodes = async () => {
    try {
      const response = await programsAPI.getCIPCodes();
      setCipCodes(response.cip_codes);
    } catch (error) {
      console.error('Error loading CIP codes:', error);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [roiResp, stateResp, trendsResp, costEarnResp] = await Promise.all([
        aggregationsAPI.getROI({ major: 'computer', year: 2024 }),
        aggregationsAPI.getStateAggregations(),
        programsAPI.getTrends('1102', 2015, 2024),
        aggregationsAPI.getCostVsEarnings({ year: 2024, limit: 200 }),
      ]);

      setRoiData(roiResp.roi_data.slice(0, 15)); // Top 15
      setStateData(stateResp.aggregations);
      setProgramTrends(trendsResp.trends);
      setCostVsEarnings(costEarnResp.data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = async (state: string) => {
    setSelectedState(state);
    try {
      if (state) {
        const response = await aggregationsAPI.getROI({ state, year: 2024 });
        setRoiData(response.roi_data.slice(0, 15));
      } else {
        const response = await aggregationsAPI.getROI({ major: 'computer', year: 2024 });
        setRoiData(response.roi_data.slice(0, 15));
      }
    } catch (error) {
      console.error('Error filtering by state:', error);
    }
  };

  const handleCIPChange = async (cipCode: string) => {
    setSelectedCIP(cipCode);
    try {
      const response = await programsAPI.getTrends(cipCode, 2015, 2024);
      setProgramTrends(response.trends);
    } catch (error) {
      console.error('Error loading program trends:', error);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="loading">
          <div className="spinner"></div>
          <p className="mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Analytics & Insights</h1>
        <p className="text-gray">
          Explore trends, ROI comparisons, and state-level statistics
        </p>
      </div>

      {/* ROI Chart */}
      <div className="mb-4">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <span>Return on Investment (ROI)</span>
            <select
              className="form-select"
              style={{ width: '200px' }}
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
            >
              <option value="">All States</option>
              {US_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ROIChart 
          data={roiData} 
          title={`Top Schools by ROI${selectedState ? ` in ${selectedState}` : ''}`}
        />
      </div>

      {/* Program Trends */}
      <div className="mb-4">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <span>Program Earnings Trends</span>
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
        </div>
        <ProgramTrendsChart 
          data={programTrends} 
          cipCode={selectedCIP}
        />
      </div>

      {/* State Comparison */}
      <div className="mb-4">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <span>State-Level Comparison</span>
            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${selectedMetric === 'cost' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedMetric('cost')}
              >
                Cost
              </button>
              <button
                className={`btn btn-sm ${selectedMetric === 'earnings' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedMetric('earnings')}
              >
                Earnings
              </button>
              <button
                className={`btn btn-sm ${selectedMetric === 'completion' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedMetric('completion')}
              >
                Completion
              </button>
            </div>
          </div>
        </div>
        <StateMapChart 
          data={stateData} 
          metric={selectedMetric}
        />
      </div>

      {/* Cost vs Earnings Scatter */}
      <CostVsEarningsChart 
        data={costVsEarnings}
        title="Cost vs. Median Earnings (10 years)"
      />

      <div className="mt-4">
        <div className="card">
          <div className="card-header">About These Metrics</div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">ROI (Return on Investment)</h4>
                <p className="text-sm text-gray">
                  Calculated as: (10-year earnings × 10 - 4-year cost × 4) / (4-year cost × 4)
                  <br />
                  Shows the financial return relative to the cost of education.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Program Trends</h4>
                <p className="text-sm text-gray">
                  Tracks median earnings at 1, 3, and 5 years after graduation for specific programs.
                  Helps identify growing fields and career trajectories.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">State Comparisons</h4>
                <p className="text-sm text-gray">
                  Aggregates data across all schools in each state.
                  Useful for regional comparisons and understanding geographic trends.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cost vs. Earnings</h4>
                <p className="text-sm text-gray">
                  Scatter plot showing the relationship between average net price and median earnings.
                  Schools in the upper-left quadrant offer better value (lower cost, higher earnings).
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
