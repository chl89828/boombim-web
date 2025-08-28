import React from 'react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  className?: string;
}

const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* 줌인 버튼 */}
      <button
        onClick={onZoomIn}
        className="bg-white hover:bg-gray-50 shadow-lg border border-gray-200 
                   rounded-lg w-10 h-10 flex items-center justify-center
                   transition-all duration-200 hover:shadow-xl"
        title="확대"
      >
        <svg 
          className="w-5 h-5 text-gray-700" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* 줌아웃 버튼 */}
      <button
        onClick={onZoomOut}
        className="bg-white hover:bg-gray-50 shadow-lg border border-gray-200 
                   rounded-lg w-10 h-10 flex items-center justify-center
                   transition-all duration-200 hover:shadow-xl"
        title="축소"
      >
        <svg 
          className="w-5 h-5 text-gray-700" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      </button>

      {/* 구분선 */}
      <div className="h-px bg-gray-200 mx-2"></div>

      {/* 초기 위치로 돌아가기 버튼 */}
      <button
        onClick={onResetView}
        className="bg-white hover:bg-gray-50 shadow-lg border border-gray-200 
                   rounded-lg w-10 h-10 flex items-center justify-center
                   transition-all duration-200 hover:shadow-xl"
        title="초기 위치로 돌아가기"
      >
        <svg 
          className="w-5 h-5 text-gray-700" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>
    </div>
  );
};

export default MapControls;