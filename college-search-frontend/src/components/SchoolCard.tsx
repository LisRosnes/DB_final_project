import React from 'react';
import { School } from '../types';
import { formatCurrency, formatPercentage, formatNumber, getOwnershipLabel, getOwnershipColor } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

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
  showCompareButton = true 
}) => {
  const navigate = useNavigate();
  
  // Safety check for required data
  if (!school || !school.school) {
    return null;
  }

  const ownershipColor = getOwnershipColor(school.school.ownership);

  // Helper to get nested latest values safely
  const getLatestValue = (path: string) => {
    if (!school.latest) return undefined;
    const parts = path.split('.');
    let value: any = school.latest;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  };

  // Format website URL properly
  const formatWebsiteUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or links
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    navigate(`/school/${school.school_id}`);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCompare) {
      onCompare(school.school_id);
    }
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="card clickable"
      style={{ 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onClick={handleCardClick}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold">{school.school.name}</h3>
          <p className="text-sm text-gray">
            {school.school.city}, {school.school.state}
          </p>
        </div>
        <span 
          className="badge" 
          style={{ backgroundColor: `${ownershipColor}20`, color: ownershipColor }}
        >
          {getOwnershipLabel(school.school.ownership)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cost */}
        <div>
          <p className="text-sm text-gray">Avg. Net Price</p>
          <p className="font-semibold">
            {formatCurrency(getLatestValue('cost.avg_net_price.overall'))}
          </p>
        </div>

        {/* Admission Rate */}
        <div>
          <p className="text-sm text-gray">Admission Rate</p>
          <p className="font-semibold">
            {formatPercentage(getLatestValue('admissions.admission_rate.overall'))}
          </p>
        </div>

        {/* Completion Rate */}
        <div>
          <p className="text-sm text-gray">Completion Rate</p>
          <p className="font-semibold">
            {formatPercentage(getLatestValue('completion.completion_rate_4yr_150nt'))}
          </p>
        </div>

        {/* Size */}
        <div>
          <p className="text-sm text-gray">Size</p>
          <p className="font-semibold">
            {formatNumber(getLatestValue('student.size'))} students
          </p>
        </div>

        {/* SAT Average */}
        {getLatestValue('admissions.sat_scores.average.overall') && (
          <div>
            <p className="text-sm text-gray">SAT Avg.</p>
            <p className="font-semibold">{getLatestValue('admissions.sat_scores.average.overall')}</p>
          </div>
        )}

        {/* Earnings */}
        {getLatestValue('earnings.10_yrs_after_entry.median') && (
          <div>
            <p className="text-sm text-gray">Earnings (10yr)</p>
            <p className="font-semibold" style={{ color: '#10b981' }}>
              {formatCurrency(getLatestValue('earnings.10_yrs_after_entry.median'))}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {showCompareButton && onCompare && (
          <button
            className={`btn ${isSelected ? 'btn-secondary' : 'btn-outline'}`}
            style={{ flex: 1 }}
            onClick={handleCompareClick}
          >
            {isSelected ? '✓ Selected' : 'Add to Compare'}
          </button>
        )}

        {school.school.school_url && (
          <a
            href={formatWebsiteUrl(school.school.school_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            onClick={handleWebsiteClick}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            Website →
          </a>
        )}
      </div>
    </div>
  );
};

export default SchoolCard;