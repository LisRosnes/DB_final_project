export interface School {
  _id?: string;
  school_id: number;
  ope8_id?: string;
  ope6_id?: string;
  fed_sch_cd?: string;

  school: {
    name: string;
    alias?: string;
    city: string;
    state: string;
    zip?: string;
    address?: string;
    school_url?: string;
    price_calculator_url?: string;
    ownership: number; // 1=public, 2=private nonprofit, 3=private for-profit
    locale?: number;
    region_id?: number;
    carnegie_basic?: number;
    carnegie_size_setting?: number;
    religious_affiliation?: number;
    accreditor?: string;
    main_campus?: number;
    branches?: number;
    degrees_awarded?: {
      predominant?: number;
      highest?: number;
    };
    faculty_salary?: number;
    ft_faculty_rate?: number;
    instructional_expenditure_per_fte?: number;
    endowment?: {
      begin?: string;
      end?: string;
    };
  };

  location?: {
    lat: number;
    lon: number;
  };

  latest: {
    // Admissions
    admission_rate?: number;
    sat_avg?: number;
    act_avg?: number;
    
    // Student body
    size?: number;
    grad_students?: number;
    
    // Cost
    tuition_in_state?: number;
    tuition_out_of_state?: number;
    avg_net_price?: number;
    
    // Aid
    pell_grant_rate?: number;
    federal_loan_rate?: number;
    median_debt?: number;
    
    // Completion
    completion_rate_4yr?: number;
    completion_rate_overall?: number;
    
    // Earnings
    median_earnings_6yr?: number;
    median_earnings_10yr?: number;
    
    // Repayment
    default_rate_3yr?: number;

    // Demographics (from raw data)
    student?: {
      size?: number;
      grad_students?: number;
      demographics?: {
        race_ethnicity?: {
          white?: number;
          black?: number;
          hispanic?: number;
          asian?: number;
          aian?: number;
          nhpi?: number;
          two_or_more?: number;
          non_resident_alien?: number;
          unknown?: number;
        };
      };
    };

    admissions?: {
      admission_rate?: {
        overall?: number;
      };
      sat_scores?: {
        average?: {
          overall?: number;
        };
        midpoint?: {
          critical_reading?: number;
          math?: number;
          writing?: number;
        };
      };
      act_scores?: {
        midpoint?: {
          cumulative?: number;
          english?: number;
          math?: number;
        };
      };
    };

    cost?: {
      tuition?: {
        in_state?: number;
        out_of_state?: number;
      };
      avg_net_price?: {
        overall?: number;
        public?: number;
        private?: number;
      };
    };

    completion?: {
      completion_rate_4yr_150nt?: number;
      rate_suppressed?: {
        four_year?: number;
      };
    };

    aid?: {
      pell_grant_rate?: number;
      federal_loan_rate?: number;
    };

    repayment?: {
      '3_yr_default_rate'?: number;
    };
  };
}

export interface CostsAidCompletion {
  school_id: number;
  year: number;
  
  cost?: {
    attendance?: {
      academic_year?: number;
    };
    avg_net_price?: {
      private?: number;
      public?: number;
      overall?: number;
    };
    tuition?: {
      in_state?: number;
      out_of_state?: number;
    };
    booksupply?: number;
    roomboard?: {
      oncampus?: number;
      offcampus?: number;
    };
    net_price?: {
      private?: {
        by_income_level?: Record<string, number>;
      };
      public?: {
        by_income_level?: Record<string, number>;
      };
    };
  };

  aid?: {
    pell_grant_rate?: number;
    federal_loan_rate?: number;
    median_debt?: {
      completers?: {
        overall?: number;
      };
    };
  };

  completion?: {
    completion_rate_4yr_150nt?: number;
    completion_rate_4yr_100nt?: number;
    completion_rate_4yr_200nt?: number;
    completion_rate_4yr_150_white?: number;
    completion_rate_4yr_150_black?: number;
    completion_rate_4yr_150_hispanic?: number;
    completion_rate_4yr_150_asian?: number;
    rate_suppressed?: {
      four_year?: number;
      four_year_100_pooled?: number;
      four_year_200percent?: number;
    };
  };

  repayment?: {
    '3_yr_default_rate'?: number;
    '3_yr_default_rate_denom'?: number;
  };

  earnings?: {
    '6_yrs_after_entry'?: {
      median?: number;
    };
    '10_yrs_after_entry'?: {
      median?: number;
    };
  };
}

export interface AcademicsPrograms {
  school_id: number;
  year: number;
  academics?: {
    program_percentage?: Record<string, number>;
    program?: {
      bachelors?: Record<string, number>;
      assoc?: Record<string, number>;
      certificate_lt_1_yr?: Record<string, number>;
    };
  };
}

export interface FilterParams {
  state?: string;
  cost_min?: number;
  cost_max?: number;
  ownership?: number;
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
  message?: string;
}

export interface ComparisonData {
  school_id: number;
  basic_info: School;
  programs?: AcademicsPrograms;
  costs_outcomes?: CostsAidCompletion;
}

export interface SchoolDetails {
  school_id: number;
  year: number;
  basic_info: School;
  programs?: AcademicsPrograms;
  costs_outcomes?: CostsAidCompletion;
  admissions?: any;
  field_of_study?: any;
  historical_data?: CostsAidCompletion[];
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
  _id: number | string;
  count: number;
  schools: Array<{
    school_id: number;
    name: string;
    earnings: number;
  }>;
}

export interface CostVsEarningsData {
  school_id: number;
  school_name: string;
  state: string;
  ownership: number;
  cost: number;
  earnings: number;
  completion_rate?: number;
  size?: number;
}