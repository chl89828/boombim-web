import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegionDetails } from '@/hooks/useRegionDetails';
import { useAppStore, selectUIState, selectSelectedRegionData } from '@/stores/appStore';
import { populationService } from '@/services/population';
import PopulationStats from './PopulationStats';
import HourlyChart from './HourlyChart';
import LoadingSpinner from '../UI/LoadingSpinner';

interface DetailsModalProps {
  className?: string;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ className = '' }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { isModalOpen, selectedRegion } = useAppStore(selectUIState);
  const selectedRegionData = useAppStore(selectSelectedRegionData);
  const { setModalOpen, setSelectedRegion } = useAppStore();

  // 지역 상세 정보 가져오기
  const { data: regionDetails, isLoading, error } = useRegionDetails({
    regionId: selectedRegion,
    enabled: Boolean(selectedRegion)
  });

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isModalOpen]);

  // 모달 외부 클릭으로 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen]);

  const handleClose = () => {
    setModalOpen(false);
    setSelectedRegion(null);
  };

  if (!isModalOpen || !selectedRegion) {
    return null;
  }

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 500,
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        />

        {/* Modal Content */}
        <motion.div
          ref={modalRef}
          className={`
            relative bg-white rounded-2xl shadow-2xl
            w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto
            ${className}
          `}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedRegionData?.name || regionDetails?.name || '지역 정보'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="모달 닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Population Status Badge */}
            {selectedRegionData && (
              <div className="mt-4 flex items-center gap-3">
                <PopulationBadge
                  current={selectedRegionData.population.current}
                  changeRate={selectedRegionData.population.changeRate}
                  status={selectedRegionData.population.status}
                />
                <span className="text-2xl">
                  {selectedRegionData.population.changeRate > 0.2 ? '🔥' : '📊'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg font-medium mb-2">
                  데이터를 불러올 수 없습니다
                </div>
                <div className="text-gray-600 text-sm">
                  잠시 후 다시 시도해주세요
                </div>
              </div>
            )}

            {selectedRegionData && !isLoading && !error && (
              <>
                {/* 현재 인구 통계 */}
                <PopulationStats
                  current={selectedRegionData.population.current}
                  baseline={selectedRegionData.population.baseline}
                  changeRate={selectedRegionData.population.changeRate}
                  status={selectedRegionData.population.status}
                  confidence={selectedRegionData.population.confidence}
                />

                {/* 변화율 설명 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    현재 상황
                  </div>
                  <div className="text-lg font-semibold text-primary-orange">
                    {populationService.getChangeDescription(selectedRegionData.population.changeRate)}
                  </div>
                </div>

                {/* 시간대별 그래프 (상세 데이터가 있는 경우) */}
                {regionDetails && regionDetails.population.hourlyData && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">시간대별 인구 변화</h3>
                    <HourlyChart data={regionDetails.population.hourlyData} />
                  </div>
                )}

                {/* 주변 정보 */}
                {regionDetails && regionDetails.nearbyPlaces && regionDetails.nearbyPlaces.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">주변 정보</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {regionDetails.nearbyPlaces.slice(0, 6).map((place, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="text-lg">
                            {place.type === 'subway' ? '🚇' : 
                             place.type === 'bus' ? '🚌' :
                             place.type === 'cafe' ? '☕' :
                             place.type === 'restaurant' ? '🍽️' :
                             place.type === 'shopping' ? '🛍️' : '🏛️'}
                          </span>
                          <span className="truncate">{place.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 메타데이터 */}
                <div className="text-xs text-gray-500 border-t pt-4">
                  <div>마지막 업데이트: {selectedRegionData.metadata.lastUpdated.toDate().toLocaleString('ko-KR')}</div>
                  <div>데이터 품질: {selectedRegionData.metadata.dataQuality === 'good' ? '양호' : 
                                              selectedRegionData.metadata.dataQuality === 'fair' ? '보통' : '불량'}</div>
                  <div>신뢰도: {Math.round(selectedRegionData.population.confidence * 100)}%</div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// 인구 상태 배지 컴포넌트
const PopulationBadge: React.FC<{
  current: number;
  changeRate: number;
  status: 'low' | 'normal' | 'high' | 'critical';
}> = ({ current, changeRate, status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'normal': return 'bg-green-100 text-green-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'low': return '한산함';
      case 'normal': return '보통';
      case 'high': return '붐빔';
      case 'critical': return '매우 붐빔';
      default: return '알 수 없음';
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      <span className="mr-2">{current.toLocaleString()}명</span>
      <span>{getStatusText(status)}</span>
      {changeRate > 0 && <span className="ml-1">📈</span>}
      {changeRate < 0 && <span className="ml-1">📉</span>}
    </div>
  );
};

export default DetailsModal;