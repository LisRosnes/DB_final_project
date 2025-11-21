import React from 'react';
import { School } from '../types';
import { formatCurrency, formatPercentage, formatNumber, getOwnershipLabel, getOwnershipColor } from '../utils/helpers';

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
  // Safety check for required data
  if (!school || !school.school || !school.latest) {
    return null;
  }

  const ownershipColor = getOwnershipColor(school.school.ownership);

  return (
    <div className="card">
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
            {formatCurrency(school.latest.avg_net_price)}
          </p>
        </div>

        {/* Earnings */}
        <div>
          <p className="text-sm text-gray">Median Earnings (10yr)</p>
          <p className="font-semibold">
            {formatCurrency(school.latest.median_earnings_10yr)}
          </p>
        </div>

        {/* Admission Rate */}
        <div>
          <p className="text-sm text-gray">Admission Rate</p>
          <p className="font-semibold">
            {formatPercentage(school.latest.admission_rate)}
          </p>
        </div>

        {/* Completion Rate */}
        <div>
          <p className="text-sm text-gray">Completion Rate</p>
          <p className="font-semibold">
            {formatPercentage(school.latest.completion_rate_overall)}
          </p>
        </div>

        {/* Size */}
        <div>
          <p className="text-sm text-gray">Size</p>
          <p className="font-semibold">
            {formatNumber(school.latest.size)} students
          </p>
        </div>

        {/* SAT Average */}
        {school.latest.sat_avg && (
          <div>
            <p className="text-sm text-gray">SAT Avg.</p>
            <p className="font-semibold">{school.latest.sat_avg}</p>
          </div>
        )}
      </div>

      {showCompareButton && onCompare && (
        <div className="mt-4">
          <button
            className={`btn ${isSelected ? 'btn-secondary' : 'btn-outline'} w-full`}
            onClick={() => onCompare(school.school_id)}
          >
            {isSelected ? '✓ Selected' : 'Add to Compare'}
          </button>
        </div>
      )}

      {school.school.school_url && (
        <div className="mt-4">
          <a
            href={school.school.school_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm"
            style={{ color: 'var(--primary-color)' }}
          >
            Visit Website →
          </a>
        </div>
      )}
    </div>
  );
};

export default SchoolCard;