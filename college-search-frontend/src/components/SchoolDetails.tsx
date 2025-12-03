import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schoolsAPI } from '../services/api';
import { formatCurrency, formatPercentage, formatNumber, getOwnershipLabel, getOwnershipColor } from '../utils/helpers';

const SchoolDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [schoolDetails, setSchoolDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'costs' | 'outcomes'>('overview');

  useEffect(() => {
    const fetchSchoolDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await schoolsAPI.getDetails(Number(id), 2023, true);
        setSchoolDetails(details);
      } catch (err) {
        setError('Failed to load school details.');
        console.error(err);
      }
      setLoading(false);
    };
    fetchSchoolDetails();
  }, [id]);

  const formatWebsiteUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  if (loading) {
    return (
      <div className="container main-content">
        <div className="loading-wrapper">
          <div className="spinner"></div>
          <p className="mt-4">Loading school details...</p>
        </div>
      </div>
    );
  }

  if (error || !schoolDetails) {
    return (
      <div className="container main-content">
        <div className="card">
          <div className="card-body text-center">
            <p className="text-danger">{error || 'School not found'}</p>
            <div className="mt-4">
              <button onClick={() => navigate('/')} className="btn btn-primary">
                Back to Search
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { basic_info, programs, costs_outcomes, admissions, year } = schoolDetails;
  const school = basic_info?.school || {};
  const latest = basic_info?.latest || {};
  const ownershipColor = getOwnershipColor(school.ownership);
  const ownershipBadgeClass = school.ownership === 1 ? 'badge-public' : 
                              school.ownership === 2 ? 'badge-private' : 
                              school.ownership === 3 ? 'badge-forprofit' : 'badge';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'academics', label: 'Academics' },
    { id: 'costs', label: 'Costs & Aid' },
    { id: 'outcomes', label: 'Outcomes' },
  ] as const;

  return (
    <div className="container main-content">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline mb-6 flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Back
      </button>

      {/* Hero Section */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {school.name}
              </h1>
              <p className="text-gray-500 text-lg mb-4">
                {school.city}, {school.state}
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className={`badge ${ownershipBadgeClass} px-4 py-2`}>
                  {getOwnershipLabel(school.ownership)}
                </span>
                {school.accreditor && (
                  <span className="badge badge-primary px-4 py-2">
                    {school.accreditor}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              {school.school_url && (
                <a
                  href={formatWebsiteUrl(school.school_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Visit Website
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              )}
              {school.price_calculator_url && (
                <a
                  href={school.price_calculator_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  Net Price Calculator
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center p-6">
          <div className="text-3xl font-bold">
            {formatNumber(latest.student?.size || 0)}
          </div>
          <div className="text-gray-500 mt-1">Students</div>
        </div>
        <div className="card text-center p-6">
          <div className="text-3xl font-bold">
            {formatPercentage(latest.admission_rate || latest.admissions?.admission_rate?.overall)}
          </div>
          <div className="text-gray-500 mt-1">Acceptance Rate</div>
        </div>
        <div className="card text-center p-6">
          <div className="text-3xl font-bold">
            {formatCurrency(latest.avg_net_price || costs_outcomes?.cost?.avg_net_price?.private)}
          </div>
          <div className="text-gray-500 mt-1">Avg. Net Price</div>
        </div>
        <div className="card text-center p-6">
          <div className="text-3xl font-bold">
            {formatPercentage(latest.completion_rate_4yr || costs_outcomes?.completion?.completion_rate_4yr_150nt)}
          </div>
          <div className="text-gray-500 mt-1">Graduation Rate</div>
        </div>
      </div>

      {/* Custom Styled Tab Navigation */}
      <div className="custom-tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`custom-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.id === 'overview' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            )}
            {tab.id === 'academics' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            )}
            {tab.id === 'costs' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            )}
            {tab.id === 'outcomes' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            )}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="card-body">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">School Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">General Information</h4>
                  <div className="space-y-2">
                    <div className="metric-row">
                      <span className="metric-label">Address</span>
                      <span className="metric-value">{school.address || 'N/A'}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">City, State</span>
                      <span className="metric-value">{school.city}, {school.state} {school.zip}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Institution Type</span>
                      <span className="metric-value">{getOwnershipLabel(school.ownership)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Accreditor</span>
                      <span className="metric-value">{school.accreditor || 'N/A'}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Religious Affiliation</span>
                      <span className="metric-value">{school.religious_affiliation ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Student Body</h4>
                  <div className="space-y-2">
                    <div className="metric-row">
                      <span className="metric-label">Undergraduate Enrollment</span>
                      <span className="metric-value">{formatNumber(latest.student?.size)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Graduate Enrollment</span>
                      <span className="metric-value">{formatNumber(latest.student?.grad_students)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Full-Time Faculty Rate</span>
                      <span className="metric-value">{formatPercentage(school.ft_faculty_rate)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Instructional Expenditure/FTE</span>
                      <span className="metric-value">{formatCurrency(school.instructional_expenditure_per_fte)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Demographics */}
              {latest.student?.demographics?.race_ethnicity && (
                <div className="mt-8">
                  <h4 className="font-semibold mb-4">Student Demographics</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(latest.student.demographics.race_ethnicity)
                      .filter(([_, val]: [string, any]) => val && val > 0)
                      .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                      .map(([race, percentage]: [string, any]) => (
                        <div key={race} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold">{formatPercentage(percentage)}</div>
                          <div className="text-sm text-gray-500 capitalize">{race.replace(/_/g, ' ')}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'academics' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Academics & Admissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Admissions Statistics</h4>
                  <div className="space-y-2">
                    <div className="metric-row">
                      <span className="metric-label">Acceptance Rate</span>
                      <span className="metric-value">{formatPercentage(latest.admission_rate || latest.admissions?.admission_rate?.overall)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Average SAT Score</span>
                      <span className="metric-value">{latest.sat_avg || latest.admissions?.sat_scores?.average?.overall || 'N/A'}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Average ACT Score</span>
                      <span className="metric-value">{latest.act_avg || latest.admissions?.act_scores?.midpoint?.cumulative || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Completion Rates</h4>
                  <div className="space-y-2">
                    <div className="metric-row">
                      <span className="metric-label">4-Year Graduation Rate</span>
                      <span className="metric-value">{formatPercentage(costs_outcomes?.completion?.completion_rate_4yr_100nt)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">6-Year Graduation Rate (150%)</span>
                      <span className="metric-value">{formatPercentage(costs_outcomes?.completion?.completion_rate_4yr_150nt)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">8-Year Graduation Rate (200%)</span>
                      <span className="metric-value">{formatPercentage(costs_outcomes?.completion?.completion_rate_4yr_200nt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Programs */}
              {programs?.academics?.program_percentage && (
                <div className="mt-8">
                  <h4 className="font-semibold mb-4">Top Programs Offered</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(programs.academics.program_percentage)
                      .filter(([_, percentage]: [string, any]) => percentage > 0.01)
                      .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                      .slice(0, 8)
                      .map(([major, percentage]: [string, any]) => (
                        <div key={major} className="badge badge-primary px-4 py-3 flex justify-between items-center">
                          <span className="truncate">
                            {major.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="font-semibold ml-2">
                            {formatPercentage(percentage)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'costs' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Costs & Financial Aid</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Tuition & Fees</h4>
                  <div className="space-y-2">
                    <div className="metric-row">
                      <span className="metric-label">In-State Tuition</span>
                      <span className="metric-value">{formatCurrency(costs_outcomes?.cost?.tuition?.in_state)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Out-of-State Tuition</span>
                      <span className="metric-value">{formatCurrency(costs_outcomes?.cost?.tuition?.out_of_state)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Average Net Price</span>
                      <span className="metric-value text-success">{formatCurrency(costs_outcomes?.cost?.avg_net_price?.private)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Room & Board (On Campus)</span>
                      <span className="metric-value">{formatCurrency(costs_outcomes?.cost?.roomboard?.oncampus)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Books & Supplies</span>
                      <span className="metric-value">{formatCurrency(costs_outcomes?.cost?.booksupply)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Total Cost of Attendance</span>
                      <span className="metric-value">{formatCurrency(costs_outcomes?.cost?.attendance?.academic_year)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Financial Aid</h4>
                  <div className="space-y-2">
                    <div className="metric-row">
                      <span className="metric-label">Pell Grant Rate</span>
                      <span className="metric-value">{formatPercentage(costs_outcomes?.aid?.pell_grant_rate)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Federal Loan Rate</span>
                      <span className="metric-value">{formatPercentage(costs_outcomes?.aid?.federal_loan_rate)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Median Debt (Completers)</span>
                      <span className="metric-value">{formatCurrency(latest.median_debt)}</span>
                    </div>
                  </div>
                  
                  {/* Net Price by Income Level */}
                  {costs_outcomes?.cost?.net_price?.private?.by_income_level && (
                    <div className="mt-6">
                      <h5 className="font-semibold mb-3">Net Price by Income Level</h5>
                      <div className="space-y-1">
                        {Object.entries(costs_outcomes.cost.net_price.private.by_income_level)
                          .sort(([a], [b]) => {
                            const getMin = (range: string) => parseInt(range.split('-')[0]) || parseInt(range.split('+')[0]) || 0;
                            return getMin(a) - getMin(b);
                          })
                          .map(([range, price]: [string, any]) => (
                            <div key={range} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                              <span className="text-gray-600">${range}</span>
                              <span className="font-semibold">{formatCurrency(price)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'outcomes' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Student Outcomes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Loan Repayment & Default</h4>
                  <div className="space-y-2">
                    <div className="metric-row">
                      <span className="metric-label">3-Year Default Rate</span>
                      <span className="metric-value">{formatPercentage(costs_outcomes?.repayment?.['3_yr_default_rate'])}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Default Rate Denominator</span>
                      <span className="metric-value">{costs_outcomes?.repayment?.['3_yr_default_rate_denom']?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* Completion Outcomes */}
                  <div className="mt-6">
                    <h5 className="font-semibold mb-3">Completion Outcomes (8 Year)</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Award Received</span>
                        <span className="font-semibold">{formatPercentage(costs_outcomes?.completion?.outcome_percentage?.all_students?.['8yr']?.award)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Still Enrolled</span>
                        <span className="font-semibold">{formatPercentage(costs_outcomes?.completion?.outcome_percentage?.all_students?.['8yr']?.still_enrolled)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Transferred</span>
                        <span className="font-semibold">{formatPercentage(costs_outcomes?.completion?.outcome_percentage?.all_students?.['8yr']?.transfer)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Unknown</span>
                        <span className="font-semibold">{formatPercentage(costs_outcomes?.completion?.outcome_percentage?.all_students?.['8yr']?.unknown)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Endowment & Resources</h4>
                  <div className="space-y-2">
                    <div className="metric-row">
                      <span className="metric-label">Endowment (Beginning)</span>
                      <span className="metric-value">{formatCurrency(school.endowment?.begin)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Endowment (End)</span>
                      <span className="metric-value">{formatCurrency(school.endowment?.end)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Faculty Salary</span>
                      <span className="metric-value">{formatCurrency(school.faculty_salary)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Tuition Revenue per FTE</span>
                      <span className="metric-value">{formatCurrency(school.tuition_revenue_per_fte)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Year Info */}
      <div className="text-sm text-gray mt-6 text-center">
        Data Year: {year} - Last Updated: {new Date(basic_info?.last_updated?.$date || Date.now()).toLocaleDateString()}
      </div>
    </div>
  );
};

export default SchoolDetails;