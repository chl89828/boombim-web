import { memo } from 'react';
import { DistrictTileProps } from '@/types/pictogram';

const DistrictTile = memo(({
  district,
  isSelected,
  isHovered,
  colorIntensity,
  onClick,
  onMouseEnter,
  onMouseLeave,
  showLabel = true
}: DistrictTileProps) => {
  const baseIntensity = Math.max(0.2, colorIntensity);
  
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        w-20 h-20 rounded-lg cursor-pointer
        transition-all duration-300 ease-in-out
        border-2 border-gray-200
        ${isHovered ? 'scale-110 shadow-lg z-10' : 'scale-100'}
        ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={{
        backgroundColor: `hsl(${220 - (colorIntensity * 60)}, 70%, ${85 - (colorIntensity * 30)}%)`,
        borderColor: isSelected ? '#3B82F6' : isHovered ? '#6B7280' : '#E5E7EB'
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`${district.name} 구역`}
    >
      {/* Population intensity indicator */}
      <div 
        className="absolute inset-2 rounded opacity-30"
        style={{
          backgroundColor: `hsl(${10 + (colorIntensity * 40)}, 80%, 50%)`,
          transform: `scale(${0.3 + (colorIntensity * 0.7)})`
        }}
      />
      
      {/* District name */}
      {showLabel && (
        <div className="relative z-10 text-center">
          <div className="text-xs font-semibold text-gray-800 leading-tight">
            {district.name.replace('구', '')}
          </div>
          {district.populationData && (
            <div className="text-[10px] text-gray-600 mt-1">
              {(district.populationData.current / 10000).toFixed(0)}만
            </div>
          )}
        </div>
      )}
      
      {/* Hover effect overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg" />
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
});

DistrictTile.displayName = 'DistrictTile';

export default DistrictTile;