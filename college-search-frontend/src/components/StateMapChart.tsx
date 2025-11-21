import React, { useEffect, useRef } from 'react';
import c3 from 'c3';
import { StateAggregation } from '../types';

interface StateMapChartProps {
  data: StateAggregation[];
  metric: 'cost' | 'earnings' | 'completion';
  title?: string;
}

const StateMapChart: React.FC<StateMapChartProps> = ({ 
  data, 
  metric,
  title 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Sort data by metric value
    const sortedData = [...data].sort((a, b) => {
      const getValue = (item: StateAggregation) => {
        switch (metric) {
          case 'cost':
            return item.avg_cost;
          case 'earnings':
            return item.avg_earnings_10yr;
          case 'completion':
            return item.avg_completion_rate;
          default:
            return 0;
        }
      };
      return getValue(b) - getValue(a);
    }).slice(0, 20); // Top 20 states

    // Prepare data for C3.js
    const states = sortedData.map(d => d._id);
    const values = sortedData.map(d => {
      switch (metric) {
        case 'cost':
          return d.avg_cost;
        case 'earnings':
          return d.avg_earnings_10yr;
        case 'completion':
          return d.avg_completion_rate * 100; // Convert to percentage
        default:
          return 0;
      }
    });

    const columnName = 
      metric === 'cost' ? 'Avg. Cost' :
      metric === 'earnings' ? 'Avg. Earnings (10yr)' :
      'Avg. Completion Rate';

    const color = 
      metric === 'cost' ? '#ef4444' :
      metric === 'earnings' ? '#10b981' :
      '#3b82f6';

    // Destroy previous chart if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = c3.generate({
      bindto: chartRef.current,
      data: {
        columns: [
          [columnName, ...values] as any,
        ],
        type: 'bar',
        colors: {
          [columnName]: color,
        },
      },
      axis: {
        x: {
          type: 'category',
          categories: states,
          tick: {
            rotate: -45,
            multiline: false,
          },
          height: 80,
        },
        y: {
          label: {
            text: metric === 'cost' ? 'Cost ($)' : 
                  metric === 'earnings' ? 'Earnings ($)' : 
                  'Completion Rate (%)',
            position: 'outer-middle',
          },
          tick: {
            format: (d: number) => {
              if (metric === 'completion') {
                return `${d.toFixed(0)}%`;
              }
              return `$${(d / 1000).toFixed(0)}K`;
            },
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
          value: (value: number, ratio: number, id: string, index: number) => {
            const state = sortedData[index];
            if (metric === 'completion') {
              return `${value.toFixed(1)}%`;
            }
            return `$${value.toLocaleString()}`;
          },
        },
      },
      legend: {
        show: false,
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, metric]);

  const getTitle = () => {
    if (title) return title;
    switch (metric) {
      case 'cost':
        return 'Average Cost by State';
      case 'earnings':
        return 'Average Earnings by State';
      case 'completion':
        return 'Average Completion Rate by State';
      default:
        return 'State Comparison';
    }
  };

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">{getTitle()}</div>
        <div className="card-body text-center text-gray">
          No state data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">{getTitle()}</div>
      <div className="card-body">
        <div ref={chartRef} className="chart-container"></div>
        <div className="text-sm text-gray mt-2">
          Showing top 20 states by {metric === 'cost' ? 'cost' : metric === 'earnings' ? 'earnings' : 'completion rate'}
        </div>
      </div>
    </div>
  );
};

export default StateMapChart;