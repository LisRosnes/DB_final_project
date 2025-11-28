import axios, { AxiosInstance } from 'axios';
import {
  School,
  FilterParams,
  SchoolsResponse,
  ComparisonData,
  Major,
  ProgramTrend,
  StateAggregation,
  ROIData,
  CIPCode,
  EarningsDistribution
} from '../types';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Schools API
export const schoolsAPI = {
  // Filter schools
  filter: async (params: FilterParams): Promise<SchoolsResponse> => {
    const response = await api.get('/schools/filter', { params });
    return response.data;
  },

  // Search schools by name
  search: async (query: string, limit: number = 20): Promise<{ results: School[]; count: number }> => {
    const response = await api.get('/schools/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // Compare multiple schools
  compare: async (schoolIds: number[], year: number = 2024): Promise<{ schools: ComparisonData[]; year: number }> => {
    const response = await api.get('/schools/compare', {
      params: { school_ids: schoolIds.join(','), year },
    });
    return response.data;
  },

  // Get detailed school information
  getDetails: async (schoolId: number, year: number = 2024, includeHistory: boolean = false): Promise<any> => {
    const response = await api.get(`/schools/${schoolId}`, {
      params: { year, include_history: includeHistory },
    });
    return response.data;
  },

  // Get list of states
  getStates: async (): Promise<{ states: Array<{ _id: string; count: number }> }> => {
    const response = await api.get('/schools/states');
    return response.data;
  },
};

// Programs API
export const programsAPI = {
  // Get program trends
  getTrends: async (cipCode: string, startYear: number = 2015, endYear: number = 2024): Promise<{
    cip_code: string;
    trends: ProgramTrend[];
    years: string;
  }> => {
    const response = await api.get('/programs/trends', {
      params: { cip_code: cipCode, start_year: startYear, end_year: endYear },
    });
    return response.data;
  },

  // Compare programs across schools
  compare: async (cipCode: string, schoolIds: number[], year: number = 2024): Promise<any> => {
    const response = await api.post('/programs/compare', {
      cip_code: cipCode,
      school_ids: schoolIds,
      year,
    });
    return response.data;
  },

  // Get available majors
  getMajors: async (year: number = 2024): Promise<{ majors: Major[]; count: number }> => {
    const response = await api.get('/programs/majors', { params: { year } });
    return response.data;
  },

  // Get CIP codes reference
  getCIPCodes: async (): Promise<{ cip_codes: CIPCode[]; count: number }> => {
    const response = await api.get('/programs/cip-codes');
    return response.data;
  },

  // Get programs for a school
  getSchoolPrograms: async (schoolId: number, year: number = 2024): Promise<any> => {
    const response = await api.get(`/programs/school/${schoolId}`, { params: { year } });
    return response.data;
  },
};

// Aggregations API
export const aggregationsAPI = {
  // Get state aggregations
  getStateAggregations: async (state?: string): Promise<{ state: string; aggregations: StateAggregation[] }> => {
    const response = await api.get('/aggregations/state', {
      params: state ? { state } : {},
    });
    return response.data;
  },

  // Calculate ROI
  getROI: async (filters: {
    state?: string;
    ownership?: number;
    major?: string;
    year?: number;
  }): Promise<{ roi_data: ROIData[]; count: number; filters: any }> => {
    const response = await api.get('/aggregations/roi', { params: filters });
    return response.data;
  },

  // Get earnings distribution
  getEarningsDistribution: async (filters: {
    year?: number;
    major?: string;
    state?: string;
  }): Promise<{ distribution: EarningsDistribution[]; year: number; filters: any }> => {
    const response = await api.get('/aggregations/earnings-distribution', { params: filters });
    return response.data;
  },

  // Get cost vs earnings data
  getCostVsEarnings: async (filters: {
    year?: number;
    state?: string;
    ownership?: number;
    limit?: number;
  }): Promise<{ data: any[]; count: number; year: number }> => {
    const response = await api.get('/aggregations/cost-vs-earnings', { params: filters });
    return response.data;
  },

  // Get completion rates
  getCompletionRates: async (groupBy: 'state' | 'ownership' | 'degree_level' = 'state', year: number = 2024): Promise<{
    data: any[];
    group_by: string;
    year: number;
  }> => {
    const response = await api.get('/aggregations/completion-rates', {
      params: { group_by: groupBy, year },
    });
    return response.data;
  },
};

// Health check
export const healthCheck = async (): Promise<any> => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
