import React from 'react';
import type { PopulationStatus } from '@/types';

interface PopulationStatsProps {
  current: number;
  baseline: number;
  changeRate: number;
  status: PopulationStatus;
  confidence: number;
}

const PopulationStats: React.FC<PopulationStatsProps> = ({
  current,
  baseline,
  changeRate,
  status,
  confidence
}) => {
  const getChangeIcon = (rate: number) => {
    if (rate > 0.1) return '📈';
    if (rate < -0.1) return '📉';
    return '➡️';
  };

  const getChangeText = (rate: number) => {
    const percentage = Math.abs(rate * 100).toFixed(1);
    if (rate > 0.1) return `+${percentage}% 증가`;
    if (rate < -0.1) return `${percentage}% 감소`;
    return '변화 없음';
  };

  const getStatusColor = (status: PopulationStatus) => {
    switch (status) {
      case 'low': return 'text-blue-600';
      case 'normal': return 'text-green-600';
      case 'high': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* 현재 인구 */}
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {current.toLocaleString()}명
        </div>
        <div className="text-sm text-gray-600">현재 인구</div>
      </div>

      {/* 통계 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 평소 대비 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">평소 대비</div>
          <div className="flex items-center gap-1">
            <span className="text-lg">{getChangeIcon(changeRate)}</span>
            <span className="font-semibold">{getChangeText(changeRate)}</span>
          </div>
        </div>

        {/* 기준 인구 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">평소 인구</div>
          <div className="font-semibold">
            {baseline.toLocaleString()}명
          </div>
        </div>
      </div>

      {/* 상태 및 신뢰도 */}
      <div className="flex items-center justify-between">
        <div className={`font-semibold ${getStatusColor(status)}`}>
          상태: {status === 'low' ? '한산함' :
                  status === 'normal' ? '보통' :
                  status === 'high' ? '붐빔' : '매우 붐빔'}
        </div>
        <div className="text-sm text-gray-600">
          신뢰도 {Math.round(confidence * 100)}%
        </div>
      </div>

      {/* 변화량 바 */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>인구 변화</span>
          <span>{current - baseline > 0 ? '+' : ''}{(current - baseline).toLocaleString()}명</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              changeRate > 0.3 ? 'bg-red-500' :
              changeRate > 0.1 ? 'bg-yellow-500' :
              changeRate > -0.1 ? 'bg-green-500' :
              'bg-blue-500'
            }`}
            style={{
              width: `${Math.min(Math.abs(changeRate) * 100, 100)}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PopulationStats;