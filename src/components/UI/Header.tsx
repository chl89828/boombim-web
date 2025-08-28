import React from 'react';
import { useAppStore, selectDataState } from '@/stores/appStore';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { lastUpdated } = useAppStore(selectDataState);

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '업데이트 정보 없음';
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 및 제목 */}
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔥</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                BoomBim
              </h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                실시간 유동인구 히트맵
              </p>
            </div>
          </div>

          {/* 상태 정보 */}
          <div className="flex items-center gap-4">
            {/* 실시간 업데이트 표시 */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">실시간</span>
            </div>

            {/* 마지막 업데이트 시간 */}
            <div className="text-sm text-gray-500">
              <span className="hidden sm:inline">업데이트: </span>
              {formatLastUpdated(lastUpdated)}
            </div>

            {/* 새로고침 버튼 */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                         rounded-lg transition-colors"
              title="새로고침"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;