import axios, { AxiosInstance } from 'axios';
import {
  School,
  FilterParams,
  SchoolsResponse,
  ComparisonData,
  SchoolDetails,
  Major,
  ProgramTrend,
  StateAggregation,
  ROIData,
  CIPCode,
  EarningsDistribution,
  CostVsEarningsData,
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
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Schools API
export const schoolsAPI = {
  filter: async (params: FilterParams): Promise<SchoolsResponse> => {
    const response = await api.get('/schools/filter', { params });
    return response.data;
  },

  getById: async (schoolId: number): Promise<School> => {
    const response = await api.get(`/schools/${schoolId}`);
    return response.data?.basic_info || response.data;
  },

  search: async (query: string, limit = 20): Promise<{ results: School[]; count: number }> => {
    const response = await api.get('/schools/search', { params: { q: query, limit } });
    return response.data;
  },

  compare: async (schoolIds: number[], year = 2023): Promise<{ schools: ComparisonData[]; year: number }> => {
    const response = await api.get('/schools/compare', {
      params: { school_ids: schoolIds.join(','), year },
    });
    return response.data;
  },

  getDetails: async (schoolId: number, year = 2023, includeHistory = false): Promise<SchoolDetails> => {
    const response = await api.get(`/schools/${schoolId}`, {
      params: { year, include_history: includeHistory },
    });
    return response.data;
  },

  getStates: async (): Promise<{ states: Array<{ _id: string; count: number }> }> => {
    const response = await api.get('/schools/states');
    return response.data;
  },

  debug: async (schoolId: number, year = 2023): Promise<any> => {
    const response = await api.get(`/schools/debug/${schoolId}`, { params: { year } });
    return response.data;
  },
};

// Programs API
export const programsAPI = {
  getTrends: async (
    cipCode: string,
    startYear = 2015,
    endYear = 2023
  ): Promise<{ cip_code: string; trends: ProgramTrend[]; years: string }> => {
    const response = await api.get('/programs/trends', {
      params: { cip_code: cipCode, start_year: startYear, end_year: endYear },
    });
    return response.data;
  },

  compare: async (cipCode: string, schoolIds: number[], year = 2023): Promise<any> => {
    const response = await api.post('/programs/compare', {
      cip_code: cipCode,
      school_ids: schoolIds,
      year,
    });
    return response.data;
  },

  getMajors: async (year = 2023): Promise<{ majors: Major[]; count: number }> => {
    const response = await api.get('/programs/majors', { params: { year } });
    return response.data;
  },

  getCIPCodes: async (): Promise<{ cip_codes: CIPCode[]; count: number }> => {
    const response = await api.get('/programs/cip-codes');
    return response.data;
  },

  getSchoolPrograms: async (schoolId: number, year = 2023): Promise<any> => {
    const response = await api.get(`/programs/school/${schoolId}`, { params: { year } });
    return response.data;
  },
};

// Aggregations API
export const aggregationsAPI = {
  getStateAggregations: async (state?: string): Promise<{ state: string; aggregations: StateAggregation[] }> => {
    const response = await api.get('/aggregations/state', {
      params: state ? { state } : {},
    });
    return response.data;
  },

  getROI: async (filters: {
    state?: string;
    ownership?: number;
    major?: string;
    year?: number;
  }): Promise<{ roi_data: ROIData[]; count: number; filters: any }> => {
    const response = await api.get('/aggregations/roi', { params: filters });
    return response.data;
  },

  getEarningsDistribution: async (filters: {
    year?: number;
    major?: string;
    state?: string;
  }): Promise<{ distribution: EarningsDistribution[]; year: number; filters: any }> => {
    const response = await api.get('/aggregations/earnings-distribution', { params: filters });
    return response.data;
  },

  getCostVsEarnings: async (filters: {
    year?: number;
    state?: string;
    ownership?: number;
    limit?: number;
  }): Promise<{ data: CostVsEarningsData[]; count: number; year: number }> => {
    const response = await api.get('/aggregations/cost-vs-earnings', { params: filters });
    return response.data;
  },

  getCompletionRates: async (
    groupBy: 'state' | 'ownership' | 'degree_level' = 'state',
    year = 2023
  ): Promise<{ data: any[]; group_by: string; year: number }> => {
    const response = await api.get('/aggregations/completion-rates', {
      params: { group_by: groupBy, year },
    });
    return response.data;
  },
};

// Analytics API - New comprehensive analytics endpoints
export const analyticsAPI = {
  getStateAnalytics: async (stateCode: string, year = 2023): Promise<any> => {
    const response = await api.get(`/analytics/state/${stateCode}`, { params: { year } });
    return response.data;
  },

  getStateComparison: async (year = 2023): Promise<{ year: number; states: any[] }> => {
    const response = await api.get('/analytics/state-comparison', { params: { year } });
    return response.data;
  },

  getSchoolAnalytics: async (
    schoolId: number,
    year = 2023,
    includeHistory = true
  ): Promise<any> => {
    const response = await api.get(`/analytics/school/${schoolId}`, {
      params: { year, include_history: includeHistory },
    });
    return response.data;
  },

  getAvailableYears: async (): Promise<{ years: number[] }> => {
    const response = await api.get('/analytics/available-years');
    return response.data;
  },
};

// Health check
export const healthCheck = async (): Promise<any> => {
  const response = await api.get('/health');
  return response.data;
};

export default api;