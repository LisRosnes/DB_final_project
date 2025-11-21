import React, { useEffect, useRef } from 'react';
import c3 from 'c3';
import { ROIData } from '../types';

interface ROIChartProps {
  data: ROIData[];
  title?: string;
}

const ROIChart: React.FC<ROIChartProps> = ({ data, title = 'ROI Comparison' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Prepare data for C3.js
    const schoolNames = data.map(d => d.school_name.length > 30 
      ? d.school_name.substring(0, 27) + '...' 
      : d.school_name
    );
    const roiValues = data.map(d => d.roi_10yr);
    const costValues = data.map(d => d.cost);
    const earningsValues = data.map(d => d.earnings_10yr);

    // Destroy previous chart if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = c3.generate({
      bindto: chartRef.current,
      data: {
        columns: [
          ['ROI (10 yr)', ...roiValues] as any,
        ],
        type: 'bar',
        colors: {
          'ROI (10 yr)': '#3b82f6',
        },
      },
      axis: {
        x: {
          type: 'category',
          categories: schoolNames,
          tick: {
            rotate: -45,
            multiline: false,
          },
          height: 100,
        },
        y: {
          label: {
            text: 'ROI (%)',
            position: 'outer-middle',
          },
          tick: {
            format: (d: number) => `${d.toFixed(0)}%`,
          },
        },
      },
      grid: {
        y: {
          show: true,
        },
      },
      tooltip: {
        format: {
          title: (index: number) => data[index].school_name,
          value: (value: number, ratio: number, id: string, index: number) => {
            const school = data[index];
            return `ROI: ${value.toFixed(1)}%\nCost: $${school.cost.toLocaleString()}\nEarnings: $${school.earnings_10yr.toLocaleString()}`;
          },
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
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-body">
        <div ref={chartRef} className="chart-container"></div>
      </div>
    </div>
  );
};

export default ROIChart;