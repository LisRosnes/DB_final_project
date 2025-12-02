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

  const getValueFromPath = (obj: any, path: string) => {
    if (!obj) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      current = current?.[part];
      if (current === undefined) break;
    }
    return current;
  };

  const formatWebsiteUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="loading">
          <div className="spinner"></div>
          <p className="mt-4">Loading school details...</p>
        </div>
      </div>
    );
  }

  if (error || !schoolDetails) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card">
          <p className="text-center" style={{ color: '#ef4444' }}>{error || 'School not found'}</p>
          <div className="text-center mt-4">
            <button onClick={() => navigate('/')} className="btn btn-primary">
              ← Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { basic_info, programs, costs_outcomes, admissions, year } = schoolDetails;
  const school = basic_info?.school || {};
  const latest = basic_info?.latest || {};
  
  const ownershipColor = getOwnershipColor(school.ownership);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-outline mb-4"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
      >
        ← Back
      </button>

      {/* Hero Section */}
      <div className="card" style={{ 
        background: `linear-gradient(135deg, ${ownershipColor}15, ${ownershipColor}05)`,
        borderLeft: `4px solid ${ownershipColor}`,
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {school.name}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
              {school.city}, {school.state}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ backgroundColor: `${ownershipColor}20`, color: ownershipColor, padding: '0.5rem 1rem' }}>
                {getOwnershipLabel(school.ownership)}
              </span>
              <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.5rem 1rem' }}>
                📍 {basic_info?.location?.lat?.toFixed(2) || 'N/A'}, {basic_info?.location?.lon?.toFixed(2) || 'N/A'}
              </span>
              <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.5rem 1rem' }}>
                ID: {schoolDetails.school_id}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {school.school_url && (
              <a
                href={formatWebsiteUrl(school.school_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ marginBottom: '0.5rem' }}
              >
                Visit Website →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {formatNumber(latest.student?.size || 0)}
          </div>
          <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Students</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {formatPercentage(latest.admission_rate || latest.admissions?.admission_rate?.overall)}
          </div>
          <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Acceptance Rate</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {formatCurrency(latest.avg_net_price || costs_outcomes?.cost?.avg_net_price?.private)}
          </div>
          <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Avg. Net Price</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {formatPercentage(latest.completion_rate_4yr || costs_outcomes?.completion?.completion_rate_4yr_150nt)}
          </div>
          <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Graduation Rate</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        {(['overview', 'academics', 'costs', 'outcomes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === tab ? '#3b82f6' : 'transparent',
              color: activeTab === tab ? 'white' : '#6b7280',
              borderRadius: '0.5rem 0.5rem 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>School Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Basic Information</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Institution Type</td><td style={{ fontWeight: '500' }}>{getOwnershipLabel(school.ownership)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Location</td><td style={{ fontWeight: '500' }}>{school.city}, {school.state}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Total Students</td><td style={{ fontWeight: '500' }}>{formatNumber(latest.student?.size || 0)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Graduate Students</td><td style={{ fontWeight: '500' }}>{formatNumber(latest.student?.grad_students || 0)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Accreditor</td><td style={{ fontWeight: '500' }}>{school.accreditor || 'N/A'}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Religious Affiliation</td><td style={{ fontWeight: '500' }}>{school.religious_affiliation ? 'Yes' : 'No'}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Admissions</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Acceptance Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(latest.admission_rate || latest.admissions?.admission_rate?.overall)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>SAT Average</td><td style={{ fontWeight: '500' }}>{latest.sat_avg || latest.admissions?.sat_scores?.average?.overall || 'N/A'}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>ACT Midpoint</td><td style={{ fontWeight: '500' }}>{latest.act_avg || 'N/A'}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Open Admissions</td><td style={{ fontWeight: '500' }}>{school.open_admissions_policy === 1 ? 'Yes' : 'No'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academics' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Academics & Programs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Graduation & Retention</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>4-Year Graduation Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(costs_outcomes?.completion?.completion_rate_4yr_150nt)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Overall Completion Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(costs_outcomes?.completion?.rate_suppressed?.four_year)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>FT Faculty Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(school.ft_faculty_rate)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Instructional Expenditure per FTE</td><td style={{ fontWeight: '500' }}>{formatCurrency(school.instructional_expenditure_per_fte)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Student Demographics</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>White</td><td style={{ fontWeight: '500' }}>{formatPercentage(latest.student?.demographics?.race_ethnicity?.white)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Black</td><td style={{ fontWeight: '500' }}>{formatPercentage(latest.student?.demographics?.race_ethnicity?.black)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Hispanic</td><td style={{ fontWeight: '500' }}>{formatPercentage(latest.student?.demographics?.race_ethnicity?.hispanic)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Asian</td><td style={{ fontWeight: '500' }}>{formatPercentage(latest.student?.demographics?.race_ethnicity?.asian)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>International</td><td style={{ fontWeight: '500' }}>{formatPercentage(costs_outcomes?.completion?.completion_rate_4yr_150_nonresident?.alien)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Programs Offered */}
            {programs?.academics?.program_percentage && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>Top Programs Offered</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {Object.entries(programs.academics.program_percentage)
                    .filter(([_, percentage]: [string, any]) => percentage > 0.01)
                    .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                    .slice(0, 8)
                    .map(([major, percentage]: [string, any]) => (
                      <div key={major} className="badge" style={{ 
                        backgroundColor: '#f3f4f6', 
                        color: '#374151', 
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>{major.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <span style={{ fontWeight: '600', color: '#3b82f6' }}>
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Costs & Financial Aid</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Tuition & Fees</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>In-State Tuition</td><td style={{ fontWeight: '500' }}>{formatCurrency(costs_outcomes?.cost?.tuition?.in_state)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Out-of-State Tuition</td><td style={{ fontWeight: '500' }}>{formatCurrency(costs_outcomes?.cost?.tuition?.out_of_state)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Average Net Price</td><td style={{ fontWeight: '500', color: '#10b981' }}>{formatCurrency(costs_outcomes?.cost?.avg_net_price?.private)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Room & Board (On Campus)</td><td style={{ fontWeight: '500' }}>{formatCurrency(costs_outcomes?.cost?.roomboard?.oncampus)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Books & Supplies</td><td style={{ fontWeight: '500' }}>{formatCurrency(costs_outcomes?.cost?.booksupply)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Total Cost of Attendance</td><td style={{ fontWeight: '500' }}>{formatCurrency(costs_outcomes?.cost?.attendance?.academic_year)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Financial Aid</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Pell Grant Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(costs_outcomes?.aid?.pell_grant_rate)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Federal Loan Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(costs_outcomes?.aid?.federal_loan_rate)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Median Debt (Completers)</td><td style={{ fontWeight: '500' }}>{formatCurrency(latest.median_debt)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Price Calculator URL</td><td style={{ fontWeight: '500' }}>
                      {school.price_calculator_url ? (
                        <a href={school.price_calculator_url} target="_blank" rel="noopener noreferrer">
                          Net Price Calculator
                        </a>
                      ) : 'N/A'}
                    </td></tr>
                  </tbody>
                </table>
                
                {/* Net Price by Income Level */}
                {costs_outcomes?.cost?.net_price?.private?.by_income_level && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h5 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Net Price by Income Level</h5>
                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                      <tbody>
                        {Object.entries(costs_outcomes.cost.net_price.private.by_income_level)
                          .sort(([a], [b]) => {
                            // Sort by income range
                            const getMin = (range: string) => parseInt(range.split('-')[0]) || parseInt(range.split('+')[0]) || 0;
                            return getMin(a) - getMin(b);
                          })
                          .map(([range, price]: [string, any]) => (
                            <tr key={range}>
                              <td style={{ padding: '0.25rem 0', color: '#6b7280' }}>${range}</td>
                              <td style={{ fontWeight: '500', textAlign: 'right' }}>{formatCurrency(price)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'outcomes' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Student Outcomes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Loan Repayment & Default</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>3-Year Default Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(costs_outcomes?.repayment?.['3_yr_default_rate'])}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Default Rate Denominator</td><td style={{ fontWeight: '500' }}>{costs_outcomes?.repayment?.['3_yr_default_rate_denom']?.toLocaleString() || 'N/A'}</td></tr>
                  </tbody>
                </table>
                
                {/* Completion Outcomes */}
                <div style={{ marginTop: '1.5rem' }}>
                  <h5 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Completion Outcomes (8 Year)</h5>
                  <table style={{ width: '100%', fontSize: '0.875rem' }}>
                    <tbody>
                      <tr><td style={{ padding: '0.25rem 0', color: '#6b7280' }}>Award Received</td><td style={{ fontWeight: '500', textAlign: 'right' }}>{formatPercentage(costs_outcomes?.completion?.outcome_percentage?.all_students?.['8yr']?.award)}</td></tr>
                      <tr><td style={{ padding: '0.25rem 0', color: '#6b7280' }}>Still Enrolled</td><td style={{ fontWeight: '500', textAlign: 'right' }}>{formatPercentage(costs_outcomes?.completion?.outcome_percentage?.all_students?.['8yr']?.still_enrolled)}</td></tr>
                      <tr><td style={{ padding: '0.25rem 0', color: '#6b7280' }}>Transferred</td><td style={{ fontWeight: '500', textAlign: 'right' }}>{formatPercentage(costs_outcomes?.completion?.outcome_percentage?.all_students?.['8yr']?.transfer)}</td></tr>
                      <tr><td style={{ padding: '0.25rem 0', color: '#6b7280' }}>Unknown</td><td style={{ fontWeight: '500', textAlign: 'right' }}>{formatPercentage(costs_outcomes?.completion?.outcome_percentage?.all_students?.['8yr']?.unknown)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Endowment & Resources</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Endowment (Beginning)</td><td style={{ fontWeight: '500' }}>{formatCurrency(school.endowment?.begin)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Endowment (End)</td><td style={{ fontWeight: '500' }}>{formatCurrency(school.endowment?.end)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Faculty Salary</td><td style={{ fontWeight: '500' }}>{formatCurrency(school.faculty_salary)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Tuition Revenue per FTE</td><td style={{ fontWeight: '500' }}>{formatCurrency(school.tuition_revenue_per_fte)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Year Info */}
      <div className="text-sm text-gray mt-4 text-center">
        Data Year: {year} • Last Updated: {new Date(basic_info?.last_updated?.$date || Date.now()).toLocaleDateString()}
      </div>
    </div>
  );
};

export default SchoolDetails;