import React from 'react';
import type { HourlyPopulation } from '@/types';

interface HourlyChartProps {
  data: HourlyPopulation[];
}

const HourlyChart: React.FC<HourlyChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        시간대별 데이터가 없습니다
      </div>
    );
  }

  // 24시간 데이터로 정규화 (빈 시간대는 0으로 채움)
  const normalizedData = Array.from({ length: 24 }, (_, hour) => {
    const hourData = data.find(d => d.hour === hour);
    return hourData || {
      hour,
      population: 0,
      changeRate: 0,
      dataPoints: 0,
      confidence: 0
    };
  });

  // 최대값 계산 (차트 스케일링용)
  const maxPopulation = Math.max(...normalizedData.map(d => d.population));
  const minPopulation = Math.min(...normalizedData.map(d => d.population));
  const range = maxPopulation - minPopulation || 1;

  // 피크 시간과 최저 시간 찾기
  const peakHour = normalizedData.reduce((peak, current) => 
    current.population > peak.population ? current : peak
  );
  const quietHour = normalizedData.reduce((quiet, current) => 
    current.population < quiet.population ? current : quiet
  );

  const getBarHeight = (population: number) => {
    const normalizedValue = (population - minPopulation) / range;
    return Math.max(normalizedValue * 100, 2); // 최소 2% 높이
  };

  const getBarColor = (changeRate: number) => {
    if (changeRate > 0.2) return 'bg-red-400';
    if (changeRate > 0) return 'bg-yellow-400';
    if (changeRate === 0) return 'bg-gray-400';
    return 'bg-blue-400';
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12AM';
    if (hour < 12) return `${hour}AM`;
    if (hour === 12) return '12PM';
    return `${hour - 12}PM`;
  };

  return (
    <div className="space-y-4">
      {/* 통계 요약 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-red-600 font-medium">피크 시간</div>
          <div className="text-lg font-bold text-red-700">
            {formatHour(peakHour.hour)}
          </div>
          <div className="text-red-600">
            {peakHour.population.toLocaleString()}명
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-blue-600 font-medium">한산한 시간</div>
          <div className="text-lg font-bold text-blue-700">
            {formatHour(quietHour.hour)}
          </div>
          <div className="text-blue-600">
            {quietHour.population.toLocaleString()}명
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div className="relative">
        <div className="flex items-end justify-between h-32 px-1">
          {normalizedData.map((hourData, index) => (
            <div key={index} className="flex flex-col items-center flex-1 group">
              {/* 바 */}
              <div className="relative flex-1 flex items-end w-full px-0.5">
                <div
                  className={`w-full rounded-t transition-all duration-200 hover:opacity-80 ${getBarColor(hourData.changeRate)}`}
                  style={{ height: `${getBarHeight(hourData.population)}%` }}
                  title={`${formatHour(hourData.hour)}: ${hourData.population.toLocaleString()}명`}
                />
                
                {/* 호버 정보 */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 
                               opacity-0 group-hover:opacity-100 transition-opacity
                               bg-black text-white text-xs rounded px-2 py-1 pointer-events-none
                               whitespace-nowrap z-10">
                  {hourData.population.toLocaleString()}명
                </div>
              </div>
              
              {/* 시간 라벨 */}
              <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-center">
                {index % 3 === 0 ? formatHour(hourData.hour) : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Y축 라벨 */}
        <div className="absolute left-0 top-0 h-32 flex flex-col justify-between text-xs text-gray-500 -ml-12">
          <span>{maxPopulation.toLocaleString()}</span>
          <span>{Math.round((maxPopulation + minPopulation) / 2).toLocaleString()}</span>
          <span>{minPopulation.toLocaleString()}</span>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-400 rounded"></div>
          <span>급증</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
          <span>증가</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-400 rounded"></div>
          <span>보통</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-400 rounded"></div>
          <span>감소</span>
        </div>
      </div>
    </div>
  );
};

export default HourlyChart;