import React from 'react';
import { useNavigate } from 'react-router-dom';
import { School } from '../types';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumberCompact, 
  getOwnershipLabel,
  getOwnershipColor,
  getSelectivityLabel,
  getSelectivityColor,
} from '../utils/helpers';

interface SchoolCardProps {
  school: School;
  onCompare?: (schoolId: number) => void;
  isSelected?: boolean;
  showCompareButton?: boolean;
}

const SchoolCard: React.FC<SchoolCardProps> = ({
  school,
  onCompare,
  isSelected = false,
  showCompareButton = true,
}) => {
  const navigate = useNavigate();

  if (!school?.school || !school?.latest) {
    return null;
  }

  const ownershipColor = getOwnershipColor(school.school.ownership);
  const admissionRate = school.latest.admission_rate;
  const selectivityColor = getSelectivityColor(admissionRate);

  const handleCardClick = () => {
    navigate(`/school/${school.school_id}`);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCompare?.(school.school_id);
  };

  return (
    <div className="school-card" onClick={handleCardClick}>
      {/* Header */}
      <div className="school-card-header">
        <div style={{ flex: 1 }}>
          <h3 className="school-card-name">{school.school.name}</h3>
          <p className="school-card-location">
             {school.school.city}, {school.school.state}
          </p>
        </div>
        <span
          className="badge"
          style={{
            backgroundColor: `${ownershipColor}15`,
            color: ownershipColor,
            fontWeight: 600,
          }}
        >
          {getOwnershipLabel(school.school.ownership)}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="school-card-stats">
        {/* Net Price */}
        <div className="school-card-stat">
          <div className="school-card-stat-label"> Avg Net Price</div>
          <div className="school-card-stat-value">
            {formatCurrency(school.latest.avg_net_price || school.latest.tuition_in_state)}
          </div>
        </div>

        {/* Admission Rate */}
        <div className="school-card-stat">
          <div className="school-card-stat-label"> Admission Rate</div>
          <div className="school-card-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {formatPercentage(admissionRate)}
            {admissionRate !== undefined && admissionRate !== null && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: `${selectivityColor}15`,
                  color: selectivityColor,
                  fontWeight: 500,
                }}
              >
                {getSelectivityLabel(admissionRate)}
              </span>
            )}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="school-card-stat">
          <div className="school-card-stat-label"> Completion Rate</div>
          <div className="school-card-stat-value">
            {formatPercentage(school.latest.completion_rate_overall || school.latest.completion_rate_4yr)}
          </div>
          {(school.latest.completion_rate_overall || school.latest.completion_rate_4yr) && (
            <div className="progress-bar" style={{ marginTop: '8px', height: '6px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(school.latest.completion_rate_overall || school.latest.completion_rate_4yr || 0) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Student Size */}
        <div className="school-card-stat">
          <div className="school-card-stat-label">Enrollment</div>
          <div className="school-card-stat-value">
            {formatNumberCompact(school.latest.size)} students
          </div>
        </div>
      </div>

      {/* SAT Score if available */}
      {school.latest.sat_avg && (
        <div style={{ 
          marginTop: 'var(--space-4)', 
          padding: 'var(--space-3) var(--space-4)',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white',
        }}>
          <span style={{ fontSize: 'var(--text-sm)', opacity: 0.9 }}> SAT Average</span>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{school.latest.sat_avg}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ 
        marginTop: 'var(--space-4)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        {school.school.school_url && (
          <a
            href={`https://${school.school.school_url.replace(/^https?:\/\//, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--color-primary)' }}
          >
            Visit Website →
          </a>
        )}

        {showCompareButton && onCompare && (
          <button
            className={`btn btn-sm ${isSelected ? 'btn-accent' : 'btn-outline'}`}
            onClick={handleCompareClick}
          >
            {isSelected ? (
              <>
                <span>✓</span> Selected
              </>
            ) : (
              <>
                <span>+</span> Compare
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SchoolCard;