import { District } from '@/types/pictogram';

interface DistrictTooltipProps {
  district: District | null;
  position: { x: number; y: number };
  isVisible: boolean;
}

const DistrictTooltip = ({ district, position, isVisible }: DistrictTooltipProps) => {
  if (!district || !isVisible) return null;

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="text-sm font-semibold text-gray-900 mb-1">
        {district.name}
      </div>
      
      {district.populationData && (
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between gap-4">
            <span>현재 인구:</span>
            <span className="font-medium">
              {district.populationData.current.toLocaleString()}명
            </span>
          </div>
          
          <div className="flex justify-between gap-4">
            <span>인구밀도:</span>
            <span className="font-medium">
              {district.populationData.density.toLocaleString()}명/km²
            </span>
          </div>
          
          {district.populationData.change !== 0 && (
            <div className="flex justify-between gap-4">
              <span>변화율:</span>
              <span className={`font-medium ${
                district.populationData.change > 0 
                  ? 'text-red-600' 
                  : 'text-blue-600'
              }`}>
                {district.populationData.change > 0 ? '+' : ''}
                {district.populationData.change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="text-xs text-gray-400 mt-2 border-t pt-1">
        클릭하면 상세 정보를 볼 수 있습니다
      </div>
      
      {/* Tooltip arrow */}
      <div 
        className="absolute bottom-0 left-4 transform translate-y-full"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid white',
        }}
      />
    </div>
  );
};

export default DistrictTooltip;