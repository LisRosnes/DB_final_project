// Utility functions for the College Search Platform

/**
 * Format currency values
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number | undefined | null, decimals: number = 1): string => {
  if (value === undefined || value === null) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format number with commas
 */
export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Get ownership type label
 */
export const getOwnershipLabel = (ownership: number): string => {
  const labels: { [key: number]: string } = {
    1: 'Public',
    2: 'Private Nonprofit',
    3: 'Private For-Profit',
  };
  return labels[ownership] || 'Unknown';
};

/**
 * Get degree level label
 */
export const getDegreeLabel = (level: number): string => {
  const labels: { [key: number]: string } = {
    1: 'Certificate',
    2: 'Associate',
    3: 'Bachelor',
    4: 'Graduate',
  };
  return labels[level] || 'Unknown';
};

/**
 * Get color for ownership type
 */
export const getOwnershipColor = (ownership: number): string => {
  const colors: { [key: number]: string } = {
    1: '#3b82f6', // blue for public
    2: '#10b981', // green for private nonprofit
    3: '#f59e0b', // amber for private for-profit
  };
  return colors[ownership] || '#6b7280';
};

/**
 * Calculate ROI
 */
export const calculateROI = (earnings: number, cost: number, years: number = 10): number => {
  if (!earnings || !cost || cost === 0) return 0;
  const totalEarnings = earnings * years;
  const totalCost = cost * 4; // Assuming 4 years of education
  return ((totalEarnings - totalCost) / totalCost) * 100;
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Get US state abbreviations
 */
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

/**
 * Validate filter values
 */
export const validateFilters = (filters: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (filters.cost_min && filters.cost_max && filters.cost_min > filters.cost_max) {
    errors.push('Minimum cost cannot be greater than maximum cost');
  }

  if (filters.size_min && filters.size_max && filters.size_min > filters.size_max) {
    errors.push('Minimum size cannot be greater than maximum size');
  }

  if (filters.admission_rate_max && (filters.admission_rate_max < 0 || filters.admission_rate_max > 1)) {
    errors.push('Admission rate must be between 0 and 1');
  }

  if (filters.completion_rate_min && (filters.completion_rate_min < 0 || filters.completion_rate_min > 1)) {
    errors.push('Completion rate must be between 0 and 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Build query string from filters
 */
export const buildQueryString = (filters: any): string => {
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
};

/**
 * Save to localStorage
 */
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Load from localStorage
 */
export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};
