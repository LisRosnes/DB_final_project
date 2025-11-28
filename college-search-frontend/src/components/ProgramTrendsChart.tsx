import React, { useEffect, useRef } from 'react';
import c3 from 'c3';
import { ProgramTrend } from '../types';

interface ProgramTrendsChartProps {
  data: ProgramTrend[];
  title?: string;
  cipCode?: string;
}

const ProgramTrendsChart: React.FC<ProgramTrendsChartProps> = ({ 
  data, 
  title = 'Program Earnings Trends',
  cipCode 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Prepare data for C3.js
    const years = data.map(d => d._id.toString());
    const earnings1yr: any = ['1 Year After', ...data.map(d => d.avg_1yr_earnings || 0)];
    const earnings3yr: any = ['3 Years After', ...data.map(d => d.avg_3yr_earnings || 0)];
    const earnings5yr: any = ['5 Years After', ...data.map(d => d.avg_5yr_earnings || 0)];

    // Destroy previous chart if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = c3.generate({
      bindto: chartRef.current,
      data: {
        columns: [earnings1yr, earnings3yr, earnings5yr] as any,
        type: 'line',
        colors: {
          '1 Year After': '#3b82f6',
          '3 Years After': '#10b981',
          '5 Years After': '#f59e0b',
        },
      },
      axis: {
        x: {
          type: 'category',
          categories: years,
          label: {
            text: 'Year',
            position: 'outer-center',
          },
        },
        y: {
          label: {
            text: 'Median Earnings ($)',
            position: 'outer-middle',
          },
          tick: {
            format: (d: number) => `$${(d / 1000).toFixed(0)}K`,
          },
        },
      },
      grid: {
        y: {
          show: true,
        },
      },
      point: {
        r: 4,
      },
      tooltip: {
        format: {
          value: (value: number) => `$${value.toLocaleString()}`,
        },
      },
      legend: {
        show: true,
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">{title}</div>
        <div className="card-body text-center text-gray">
          No trend data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        {title}
        {cipCode && <span className="text-sm text-gray ml-2">(CIP: {cipCode})</span>}
      </div>
      <div className="card-body">
        <div ref={chartRef} className="chart-container"></div>
        <div className="text-sm text-gray mt-2">
          Showing average earnings at 1, 3, and 5 years after graduation
        </div>
      </div>
    </div>
  );
};

export default ProgramTrendsChart;