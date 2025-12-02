import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { schoolsAPI } from '../services/api';

// TopoJSON URL for US states
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// State FIPS to abbreviation mapping
const FIPS_TO_STATE: { [key: string]: string } = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY'
};

const STATE_NAMES: { [key: string]: string } = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
  'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
  'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

interface MapVisualizationProps {
  selectedState?: string;
  onStateClick: (stateCode: string) => void;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({
  selectedState,
  onStateClick
}) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [stateCounts, setStateCounts] = useState<{ [key: string]: number }>({});
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Load state counts
    loadStateCounts();
  }, []);

  const loadStateCounts = async () => {
    try {
      const response = await schoolsAPI.getStates();
      const counts: { [key: string]: number } = {};
      response.states.forEach((s: any) => {
        if (s._id) {
          counts[s._id] = s.count;
        }
      });
      setStateCounts(counts);
    } catch (error) {
      console.error('Error loading state counts:', error);
    }
  };

  const getStateColor = (stateCode: string) => {
    if (selectedState === stateCode) {
      return '#1d4ed8'; // Selected - dark blue
    }
    if (hoveredState === stateCode) {
      return '#3b82f6'; // Hovered - medium blue
    }
    
    const count = stateCounts[stateCode] || 0;
    if (count === 0) return '#e5e7eb';
    if (count < 50) return '#bfdbfe';
    if (count < 100) return '#93c5fd';
    if (count < 200) return '#60a5fa';
    return '#3b82f6';
  };

  const handleMouseMove = (event: React.MouseEvent, stateCode: string) => {
    const count = stateCounts[stateCode] || 0;
    const stateName = STATE_NAMES[stateCode] || stateCode;
    setTooltipContent(`${stateName}: ${count} schools`);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '300px' }}>
      <ComposableMap
        projection="geoAlbersUsa"
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup center={[-96, 38]} zoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateCode = FIPS_TO_STATE[geo.id];
                if (!stateCode) return null;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => onStateClick(stateCode)}
                    onMouseEnter={() => setHoveredState(stateCode)}
                    onMouseLeave={() => {
                      setHoveredState(null);
                      setTooltipContent('');
                    }}
                    onMouseMove={(e) => handleMouseMove(e, stateCode)}
                    style={{
                      default: {
                        fill: getStateColor(stateCode),
                        stroke: '#fff',
                        strokeWidth: 0.5,
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'fill 0.2s'
                      },
                      hover: {
                        fill: selectedState === stateCode ? '#1d4ed8' : '#3b82f6',
                        stroke: '#fff',
                        strokeWidth: 0.75,
                        outline: 'none',
                        cursor: 'pointer'
                      },
                      pressed: {
                        fill: '#1d4ed8',
                        stroke: '#fff',
                        strokeWidth: 0.75,
                        outline: 'none'
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 30,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap'
          }}
        >
          {tooltipContent}
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '11px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Schools per state</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#bfdbfe' }}></div>
          <span>&lt; 50</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#93c5fd' }}></div>
          <span>50-100</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#60a5fa' }}></div>
          <span>100-200</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6' }}></div>
          <span>200+</span>
        </div>
      </div>
    </div>
  );
};

export default MapVisualization;