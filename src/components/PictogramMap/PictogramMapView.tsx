import { useState, useEffect, useMemo } from 'react';
import DistrictTile from './DistrictTile';
import DistrictTooltip from './DistrictTooltip';
import { SEOUL_DISTRICTS, PICTOGRAM_CONFIG } from '@/data/districts';
import { District, PictogramMapProps } from '@/types/pictogram';

interface TooltipState {
  district: District | null;
  position: { x: number; y: number };
  isVisible: boolean;
}

const PictogramMapView = ({
  districts = SEOUL_DISTRICTS,
  selectedDistrict,
  onDistrictClick,
  onDistrictHover,
  colorScale = 'population',
  showLabels = true,
  showTooltips = true
}: PictogramMapProps) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    district: null,
    position: { x: 0, y: 0 },
    isVisible: false
  });

  // Calculate value ranges for color scaling
  const { minValue, maxValue } = useMemo(() => {
    const values = districts
      .map(d => {
        switch (colorScale) {
          case 'density':
            return d.populationData?.density || 0;
          case 'change':
            return Math.abs(d.populationData?.change || 0);
          default:
            return d.populationData?.current || 0;
        }
      })
      .filter(v => v > 0);

    return {
      minValue: Math.min(...values) || 0,
      maxValue: Math.max(...values) || 1
    };
  }, [districts, colorScale]);

  // Create grid layout
  const gridLayout = useMemo(() => {
    const { rows, cols } = PICTOGRAM_CONFIG.gridSize;
    const grid: (District | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
    
    districts.forEach(district => {
      const { row, col } = district.gridPosition;
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        grid[row][col] = district;
      }
    });
    
    return grid;
  }, [districts]);

  const handleDistrictClick = (district: District) => {
    onDistrictClick(district.id);
  };

  const handleDistrictHover = (district: District | null, event?: React.MouseEvent) => {
    setHoveredDistrict(district?.id || null);
    onDistrictHover(district?.id || null);
    
    if (showTooltips) {
      if (district && event) {
        setTooltip({
          district,
          position: { x: event.clientX, y: event.clientY },
          isVisible: true
        });
      } else {
        setTooltip(prev => ({ ...prev, isVisible: false }));
      }
    }
  };

  const getColorIntensity = (district: District): number => {
    if (!district.populationData) return 0.2;
    
    let value: number;
    switch (colorScale) {
      case 'density':
        value = district.populationData.density;
        break;
      case 'change':
        value = Math.abs(district.populationData.change);
        break;
      default:
        value = district.populationData.current;
    }
    
    if (maxValue === minValue) return 0.5;
    return (value - minValue) / (maxValue - minValue);
  };

  // Hide tooltip when component unmounts or props change
  useEffect(() => {
    return () => {
      setTooltip(prev => ({ ...prev, isVisible: false }));
    };
  }, [colorScale, selectedDistrict]);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          서울특별시 인구 분포도
        </h2>
        <p className="text-gray-600">
          각 구역을 클릭하면 상세 정보를 볼 수 있습니다
        </p>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center gap-4 text-sm">
        <span className="text-gray-700 font-medium">
          {colorScale === 'population' && '인구수'}
          {colorScale === 'density' && '인구밀도'}  
          {colorScale === 'change' && '변화율'}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-200" />
          <span className="text-xs text-gray-500">낮음</span>
          <div className="flex gap-1">
            {PICTOGRAM_CONFIG.colors[colorScale].steps.map((color, index) => (
              <div
                key={index}
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">높음</span>
          <div className="w-4 h-4 rounded bg-red-200" />
        </div>
      </div>

      {/* Pictogram Grid */}
      <div 
        className="relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${PICTOGRAM_CONFIG.gridSize.cols}, 1fr)`,
          gridTemplateRows: `repeat(${PICTOGRAM_CONFIG.gridSize.rows}, 1fr)`,
          gap: `${PICTOGRAM_CONFIG.spacing}px`,
          maxWidth: `${PICTOGRAM_CONFIG.gridSize.cols * (PICTOGRAM_CONFIG.tileSize.width + PICTOGRAM_CONFIG.spacing)}px`
        }}
      >
        {gridLayout.map((row, rowIndex) =>
          row.map((district, colIndex) => {
            if (!district) {
              return (
                <div
                  key={`empty-${rowIndex}-${colIndex}`}
                  className="w-20 h-20"
                />
              );
            }

            return (
              <DistrictTile
                key={district.id}
                district={district}
                isSelected={selectedDistrict === district.id}
                isHovered={hoveredDistrict === district.id}
                colorIntensity={getColorIntensity(district)}
                onClick={() => handleDistrictClick(district)}
                onMouseEnter={(e) => handleDistrictHover(district, e as React.MouseEvent)}
                onMouseLeave={() => handleDistrictHover(null)}
                showLabel={showLabels}
              />
            );
          })
        )}
      </div>

      {/* Statistics Summary */}
      <div className="mt-8 grid grid-cols-3 gap-6 text-center">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {districts.length}
          </div>
          <div className="text-sm text-gray-600">총 구역 수</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {districts.reduce((sum, d) => sum + (d.populationData?.current || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">총 인구수</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(districts.reduce((sum, d) => sum + (d.populationData?.density || 0), 0) / districts.length).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">평균 밀도</div>
        </div>
      </div>

      {/* Tooltip */}
      <DistrictTooltip
        district={tooltip.district}
        position={tooltip.position}
        isVisible={tooltip.isVisible}
      />
    </div>
  );
};

export default PictogramMapView;