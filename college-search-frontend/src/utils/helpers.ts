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
 * Format compact currency (e.g., $45K)
 */
export const formatCurrencyCompact = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return 'N/A';
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number | undefined | null, decimals = 1): string => {
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
 * Format compact number (e.g., 15K)
 */
export const formatNumberCompact = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return 'N/A';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Get ownership type label
 */
export const getOwnershipLabel = (ownership: number): string => {
  const labels: Record<number, string> = {
    1: 'Public',
    2: 'Private Nonprofit',
    3: 'Private For-Profit',
  };
  return labels[ownership] || 'Unknown';
};

/**
 * Get short ownership label
 */
export const getOwnershipShortLabel = (ownership: number): string => {
  const labels: Record<number, string> = {
    1: 'Public',
    2: 'Private',
    3: 'For-Profit',
  };
  return labels[ownership] || 'Unknown';
};

/**
 * Get degree level label
 */
export const getDegreeLabel = (level: number): string => {
  const labels: Record<number, string> = {
    1: 'Certificate',
    2: 'Associate',
    3: "Bachelor's",
    4: 'Graduate',
  };
  return labels[level] || 'Unknown';
};

/**
 * Get color for ownership type
 */
export const getOwnershipColor = (ownership: number): string => {
  const colors: Record<number, string> = {
    1: '#0ea5e9', // sky blue for public
    2: '#8b5cf6', // purple for private nonprofit
    3: '#f97316', // orange for private for-profit
  };
  return colors[ownership] || '#6b7280';
};

/**
 * Get gradient colors for ownership type
 */
export const getOwnershipGradient = (ownership: number): [string, string] => {
  const gradients: Record<number, [string, string]> = {
    1: ['#0ea5e9', '#06b6d4'], // sky to cyan
    2: ['#8b5cf6', '#a78bfa'], // purple to light purple
    3: ['#f97316', '#fb923c'], // orange to light orange
  };
  return gradients[ownership] || ['#6b7280', '#9ca3af'];
};

/**
 * Get locale label
 */
export const getLocaleLabel = (locale: number): string => {
  const labels: Record<number, string> = {
    11: 'City: Large',
    12: 'City: Midsize',
    13: 'City: Small',
    21: 'Suburb: Large',
    22: 'Suburb: Midsize',
    23: 'Suburb: Small',
    31: 'Town: Fringe',
    32: 'Town: Distant',
    33: 'Town: Remote',
    41: 'Rural: Fringe',
    42: 'Rural: Distant',
    43: 'Rural: Remote',
  };
  return labels[locale] || 'Unknown';
};

/**
 * Calculate ROI
 */
export const calculateROI = (earnings: number, cost: number, years = 10): number => {
  if (!earnings || !cost || cost === 0) return 0;
  const totalEarnings = earnings * years;
  const totalCost = cost * 4; // Assuming 4 years of education
  return ((totalEarnings - totalCost) / totalCost) * 100;
};

/**
 * Get ROI color based on value
 */
export const getROIColor = (roi: number): string => {
  if (roi >= 200) return '#10b981'; // excellent
  if (roi >= 100) return '#22c55e'; // good
  if (roi >= 50) return '#84cc16'; // decent
  if (roi >= 0) return '#eab308'; // break even
  return '#ef4444'; // negative
};

/**
 * Get admission selectivity label
 */
export const getSelectivityLabel = (rate: number | undefined): string => {
  if (rate === undefined || rate === null) return 'Unknown';
  if (rate < 0.1) return 'Most Selective';
  if (rate < 0.2) return 'Highly Selective';
  if (rate < 0.35) return 'Very Selective';
  if (rate < 0.5) return 'Selective';
  if (rate < 0.7) return 'Moderately Selective';
  return 'Open Admission';
};

/**
 * Get selectivity color
 */
export const getSelectivityColor = (rate: number | undefined): string => {
  if (rate === undefined || rate === null) return '#6b7280';
  if (rate < 0.1) return '#7c3aed'; // most selective - purple
  if (rate < 0.2) return '#2563eb'; // highly selective - blue
  if (rate < 0.35) return '#0891b2'; // very selective - cyan
  if (rate < 0.5) return '#059669'; // selective - emerald
  if (rate < 0.7) return '#65a30d'; // moderately - lime
  return '#ca8a04'; // open - amber
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
 * US States with codes
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
  { code: 'DC', name: 'District of Columbia' },
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
  { code: 'PR', name: 'Puerto Rico' },
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
 * Get state name from code
 */
export const getStateName = (code: string): string => {
  return US_STATES.find((s) => s.code === code)?.name || code;
};

/**
 * Major field friendly names
 */
export const MAJOR_NAMES: Record<string, string> = {
  agriculture: 'Agriculture',
  resources: 'Natural Resources',
  architecture: 'Architecture',
  ethnic_cultural_gender: 'Ethnic, Cultural & Gender Studies',
  communication: 'Communication',
  communications_technology: 'Communications Technology',
  computer: 'Computer Science',
  personal_culinary: 'Personal & Culinary Services',
  education: 'Education',
  engineering: 'Engineering',
  engineering_technology: 'Engineering Technology',
  language: 'Foreign Languages',
  family_consumer_science: 'Family & Consumer Sciences',
  legal: 'Legal Studies',
  english: 'English',
  humanities: 'Liberal Arts & Humanities',
  library: 'Library Science',
  biological: 'Biological Sciences',
  mathematics: 'Mathematics & Statistics',
  military: 'Military Science',
  multidiscipline: 'Multidisciplinary Studies',
  parks_recreation_fitness: 'Parks, Recreation & Fitness',
  philosophy_religious: 'Philosophy & Religious Studies',
  theology_religious_vocation: 'Theology & Religious Vocations',
  physical_science: 'Physical Sciences',
  science_technology: 'Science Technology',
  psychology: 'Psychology',
  security_law_enforcement: 'Security & Law Enforcement',
  public_administration_social_service: 'Public Administration',
  social_science: 'Social Sciences',
  construction: 'Construction Trades',
  mechanic_repair_technology: 'Mechanic & Repair Technology',
  precision_production: 'Precision Production',
  transportation: 'Transportation',
  visual_performing: 'Visual & Performing Arts',
  health: 'Health Professions',
  business_marketing: 'Business & Marketing',
  history: 'History',
};

/**
 * Get major display name
 */
export const getMajorName = (code: string): string => {
  return MAJOR_NAMES[code] || code.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation between two values
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Map a value from one range to another
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};