// Type definitions for College Search Platform

export interface School {
  _id?: string;
  school_id: number;
  ope8_id?: string;
  ope6_id?: string;
  
  school: {
    name: string;
    alias?: string;
    city: string;
    state: string;
    zip?: string;
    school_url?: string;
    ownership: number; // 1=public, 2=private nonprofit, 3=private for-profit
    degrees_awarded?: {
      predominant?: number;
    };
  };
  
  location?: {
    lat: number;
    lon: number;
  };
  
  latest: {
    year: number;
    admission_rate?: number;
    sat_avg?: number;
    act_avg?: number;
    size?: number;
    tuition_in_state?: number;
    tuition_out_of_state?: number;
    avg_net_price?: number;
    pell_grant_rate?: number;
    median_debt?: number;
    completion_rate_4yr?: number;
    completion_rate_overall?: number;
    median_earnings_6yr?: number;
    median_earnings_10yr?: number;
    default_rate_3yr?: number;
  };
}

export interface FilterParams {
  state?: string;
  cost_min?: number;
  cost_max?: number;
  earnings_min?: number;
  admission_rate_max?: number;
  completion_rate_min?: number;
  ownership?: number;
  size_min?: number;
  size_max?: number;
  degree_level?: number;
  major?: string;
  major_threshold?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SchoolsResponse {
  results: School[];
  total: number;
  page: number;
  limit: number;
}

export interface ComparisonData {
  school_id: number;
  basic_info: School;
  programs?: any;
  costs_outcomes?: any;
}

export interface Major {
  field_code: string;
  field_name: string;
}

export interface ProgramTrend {
  _id: number; // year
  avg_1yr_earnings?: number;
  avg_3yr_earnings?: number;
  avg_5yr_earnings?: number;
  avg_debt?: number;
  school_count: number;
}

export interface StateAggregation {
  _id: string; // state code
  avg_cost: number;
  avg_earnings_10yr: number;
  avg_completion_rate: number;
  school_count: number;
}

export interface ROIData {
  school_id: number;
  school_name: string;
  state: string;
  cost: number;
  earnings_6yr: number;
  earnings_10yr: number;
  completion_rate: number;
  median_debt: number;
  roi_10yr: number;
}

export interface CIPCode {
  code: string;
  title: string;
  family: string;
}

export interface EarningsDistribution {
  _id: number | string; // earnings range or 'other'
  count: number;
  schools: Array<{
    school_id: number;
    name: string;
    earnings: number;
  }>;
}
