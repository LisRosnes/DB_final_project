import React, { useEffect, useRef } from 'react';
import c3 from 'c3';

interface CostVsEarningsData {
  school_id: number;
  school_name: string;
  cost: number;
  earnings: number;
  completion_rate?: number;
  size?: number;
}

interface CostVsEarningsChartProps {
  data: CostVsEarningsData[];
  title?: string;
}

const CostVsEarningsChart: React.FC<CostVsEarningsChartProps> = ({ 
  data, 
  title = 'Cost vs. Earnings' 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    // Clean up previous chart instance first
    if (chartInstance.current) {
      try {
        chartInstance.current.destroy();
      } catch (e) {
        // Ignore destroy errors - element may already be removed
      }
      chartInstance.current = null;
    }

    if (!chartRef.current || data.length === 0) return;

    // Prepare data for C3.js scatter plot
    const costData: any = ['Cost', ...data.map(d => d.cost)];
    const earningsData: any = ['Earnings', ...data.map(d => d.earnings)];

    // Destroy previous chart if exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = c3.generate({
      bindto: chartRef.current,
      data: {
        xs: {
          'Earnings': 'Cost',
        },
        columns: [costData, earningsData],
        type: 'scatter',
        colors: {
          'Earnings': '#3b82f6',
        },
      },
      axis: {
        x: {
          label: {
            text: 'Average Net Price ($)',
            position: 'outer-center',
          },
          tick: {
            format: ((d: any) => `$${(d / 1000).toFixed(0)}K`) as any,
          },
        },
        y: {
          label: {
            text: 'Median Earnings 10yr After ($)',
            position: 'outer-middle',
          },
          tick: {
            format: (d: number) => `$${(d / 1000).toFixed(0)}K`,
          },
        },
      },
      grid: {
        x: {
          show: true,
        },
        y: {
          show: true,
        },
      },
      point: {
        r: 5,
      },
      tooltip: {
        format: {
          title: (index: number) => {
            const school = data[index];
            return school ? school.school_name : '';
          },
          value: (value: number, ratio: number, id: string, index: number) => {
            const school = data[index];
            if (!school) return '';
            
            return `Cost: $${school.cost.toLocaleString()}\nEarnings: $${school.earnings.toLocaleString()}${
              school.completion_rate ? `\nCompletion: ${(school.completion_rate * 100).toFixed(1)}%` : ''
            }`;
          },
        },
      },
      legend: {
        show: false,
      },
    });

    return () => {
      if (chartInstance.current) {
        try {
          chartInstance.current.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
        chartInstance.current = null;
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
        <div className="text-sm text-gray mt-2">
          Each point represents a school. Hover over points for details.
        </div>
      </div>
    </div>
  );
};

export default CostVsEarningsChart;