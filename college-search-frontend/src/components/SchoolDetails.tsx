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
        const details = await schoolsAPI.getDetails(Number(id), 2024, true);
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

  const school = schoolDetails.basic_info;
  
  // Get nested latest values safely
  const getLatestValue = (path: string) => {
    const parts = path.split('.');
    let value = school?.latest;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  };

  const ownershipColor = getOwnershipColor(school?.school?.ownership);

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
              {school?.school?.name}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
              {school?.school?.city}, {school?.school?.state}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ backgroundColor: `${ownershipColor}20`, color: ownershipColor, padding: '0.5rem 1rem' }}>
                {getOwnershipLabel(school?.school?.ownership)}
              </span>
              {school?.location && (
                <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.5rem 1rem' }}>
                  📍 {school.location.lat?.toFixed(2)}, {school.location.lon?.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {school?.school?.school_url && (
              <a
                href={formatWebsiteUrl(school.school.school_url)}
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
            {formatNumber(getLatestValue('student.size'))}
          </div>
          <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Students</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {formatPercentage(getLatestValue('admissions.admission_rate.overall'))}
          </div>
          <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Acceptance Rate</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {formatCurrency(getLatestValue('cost.avg_net_price.overall'))}
          </div>
          <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Avg. Net Price</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {formatPercentage(getLatestValue('completion.completion_rate_4yr_150nt'))}
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
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Institution Type</td><td style={{ fontWeight: '500' }}>{getOwnershipLabel(school?.school?.ownership)}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Location</td><td style={{ fontWeight: '500' }}>{school?.school?.city}, {school?.school?.state}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Total Students</td><td style={{ fontWeight: '500' }}>{formatNumber(getLatestValue('student.size'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Graduate Students</td><td style={{ fontWeight: '500' }}>{formatNumber(getLatestValue('student.grad_students'))}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Admissions</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Acceptance Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('admissions.admission_rate.overall'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>SAT Average</td><td style={{ fontWeight: '500' }}>{getLatestValue('admissions.sat_scores.average.overall') || 'N/A'}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>ACT Midpoint</td><td style={{ fontWeight: '500' }}>{getLatestValue('admissions.act_scores.midpoint.cumulative') || 'N/A'}</td></tr>
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
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>4-Year Graduation Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('completion.completion_rate_4yr_150nt'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Overall Completion Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('completion.rate_suppressed.overall'))}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Student Demographics</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>White</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('student.demographics.race_ethnicity.white'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Black</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('student.demographics.race_ethnicity.black'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Hispanic</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('student.demographics.race_ethnicity.hispanic'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Asian</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('student.demographics.race_ethnicity.asian'))}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
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
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>In-State Tuition</td><td style={{ fontWeight: '500' }}>{formatCurrency(getLatestValue('cost.tuition.in_state'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Out-of-State Tuition</td><td style={{ fontWeight: '500' }}>{formatCurrency(getLatestValue('cost.tuition.out_of_state'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Average Net Price</td><td style={{ fontWeight: '500', color: '#10b981' }}>{formatCurrency(getLatestValue('cost.avg_net_price.overall'))}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Financial Aid</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Pell Grant Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('aid.pell_grant_rate'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Federal Loan Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('aid.federal_loan_rate'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>Median Debt</td><td style={{ fontWeight: '500' }}>{formatCurrency(getLatestValue('aid.median_debt.completers.overall'))}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'outcomes' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Student Outcomes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Earnings After Graduation</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>6 Years After Entry</td><td style={{ fontWeight: '500', color: '#10b981' }}>{formatCurrency(getLatestValue('earnings.6_yrs_after_entry.median'))}</td></tr>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>10 Years After Entry</td><td style={{ fontWeight: '500', color: '#10b981' }}>{formatCurrency(getLatestValue('earnings.10_yrs_after_entry.median'))}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>Loan Repayment</h4>
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr><td style={{ padding: '0.5rem 0', color: '#6b7280' }}>3-Year Default Rate</td><td style={{ fontWeight: '500' }}>{formatPercentage(getLatestValue('repayment.3_yr_default_rate'))}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* ROI Calculator */}
            <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#166534' }}>💰 Return on Investment</h4>
              {(() => {
                const cost = getLatestValue('cost.avg_net_price.overall');
                const earnings = getLatestValue('earnings.10_yrs_after_entry.median');
                if (cost && earnings) {
                  const totalCost = cost * 4;
                  const totalEarnings = earnings * 10;
                  const roi = ((totalEarnings - totalCost) / totalCost * 100).toFixed(1);
                  return (
                    <div>
                      <p style={{ color: '#166534' }}>Based on 4 years of education and 10 years of earnings:</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534', marginTop: '0.5rem' }}>
                        ROI: {roi}%
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#15803d', marginTop: '0.25rem' }}>
                        Total Investment: {formatCurrency(totalCost)} → 10-Year Earnings: {formatCurrency(totalEarnings)}
                      </p>
                    </div>
                  );
                }
                return <p style={{ color: '#6b7280' }}>Insufficient data to calculate ROI</p>;
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolDetails;