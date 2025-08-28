import React, { useEffect } from 'react';
import { usePopulationData } from './hooks/usePopulationData';
import { useAppStore } from './stores/appStore';
import MapView from './components/Map/MapView';
import DetailsModal from './components/Modal/DetailsModal';
import Header from './components/UI/Header';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorBoundary from './components/UI/ErrorBoundary';

const App: React.FC = () => {
  const { setError } = useAppStore();

  // 유동인구 데이터 가져오기
  const {
    data: populationData,
    isLoading,
    isError,
    error,
    statistics,
    hotspots,
    refresh
  } = usePopulationData({
    refreshInterval: 10 * 60 * 1000, // 10분마다 새로고침
    enabled: true
  });

  // 에러 상태를 store에 동기화
  useEffect(() => {
    if (isError && error) {
      setError(error.message);
    } else if (!isError) {
      setError(null);
    }
  }, [isError, error, setError]);

  // 지역 클릭 핸들러
  const handleRegionClick = (regionId: string) => {
    console.log('App: Region clicked -', regionId);
    // MapView에서 이미 store 업데이트를 처리하므로 추가 로직 불필요
  };

  // 로딩 상태
  if (isLoading && populationData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner 
            size="lg" 
            text="유동인구 데이터를 불러오는 중..."
          />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError && populationData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              데이터를 불러올 수 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <button
              onClick={() => refresh()}
              className="bg-primary-orange text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <Header />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 relative">
        <ErrorBoundary
          fallback={
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-lg font-medium mb-2">
                  지도를 불러올 수 없습니다
                </div>
                <div className="text-gray-600 text-sm">
                  페이지를 새로고침해주세요
                </div>
              </div>
            </div>
          }
        >
          {/* 지도 뷰 */}
          <MapView
            className="w-full h-full"
            onRegionClick={handleRegionClick}
          />
        </ErrorBoundary>

        {/* 로딩 오버레이 (데이터 새로고침 중) */}
        {isLoading && populationData.length > 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-orange border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">업데이트 중...</span>
            </div>
          </div>
        )}

        {/* 통계 패널 */}
        {statistics && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
            <div className="text-sm font-medium text-gray-700 mb-2">
              현재 통계
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>전체 지역: {statistics.totalRegions}곳</div>
              <div>평균 인구: {statistics.averagePopulation.toLocaleString()}명</div>
              <div className="flex items-center gap-1">
                <span>🔥 핫스팟: {statistics.criticalAreas}곳</span>
              </div>
              {hotspots.length > 0 && (
                <div className="text-primary-orange font-medium">
                  급증 지역 {hotspots.length}곳 발견!
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 상세 정보 모달 */}
      <DetailsModal />

      {/* 접근성 정보 (스크린 리더용) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading && "데이터를 업데이트하고 있습니다."}
        {isError && "데이터 로딩에 실패했습니다."}
        {statistics && `현재 ${statistics.totalRegions}개 지역의 데이터를 표시하고 있습니다.`}
      </div>
    </div>
  );
};

export default App;