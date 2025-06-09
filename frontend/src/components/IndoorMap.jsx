// src/components/IndoorMap.jsx
import React from 'react';
import { floorData, getPlaceById } from '../floorData';

const IndoorMap = ({ selectedFloor, currentLoc }) => {
  const currentFloorData = floorData[selectedFloor];

  if (!currentFloorData) {
    return (
      <div className="p-4 text-center text-red-400 bg-slate-800 rounded-lg shadow-md">
        선택된 층의 지도 정보를 찾을 수 없습니다. (층: {selectedFloor || '알 수 없음'})
      </div>
    );
  }

  const { places, svgWidth, svgHeight, viewBox } = currentFloorData;
  const highlightedPlace = getPlaceById(currentLoc);

  const markerStyle = {
    fill: "#fde047", // yellow-300
    stroke: "#1e293b", // slate-800
    strokeWidth: 2.5,
    filter: "drop-shadow(0px 3px 4px rgba(0,0,0,0.6))",
    transition: "all 0.3s ease",
  };

  const getMarker = (place) => {
    if (place) {
      return <circle cx={place.cx} cy={place.cy} r="12" style={markerStyle} />;
    }
    return null;
  };

  return (
    <div className="w-full max-w-2xl p-2 sm:p-4 bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl">
      <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-center text-sky-300">
        {currentFloorData.name}
      </h3>
      <svg
        width="100%"
        height="auto"
        viewBox={viewBox || `0 0 ${svgWidth || 500} ${svgHeight || 250}`}
        className="border-2 border-slate-600 rounded-lg shadow-lg mx-auto bg-slate-700/50"
        aria-labelledby="mapTitle"
        role="img"
      >
        <title id="mapTitle">{currentFloorData.name} 실내 지도</title>
        {places.map((place) => (
          <g key={place.id} role="listitem" aria-label={place.name}>
            {place.shape === 'rect' && (
              <rect
                x={place.details.x}
                y={place.details.y}
                width={place.details.width}
                height={place.details.height}
                fill={place.details.fill || '#d1d5db'} // gray-300
                stroke={place.details.stroke || '#6b7280'} // gray-500
                strokeWidth={place.details.strokeWidth || 1}
                rx="5" // 둥근 모서리
              />
            )}
            {/* 다른 모양 (예: circle, polygon)도 추가 가능 */}
            <text
              x={place.textX}
              y={place.textY}
              fontSize="20"
              fontWeight="medium"
              fill={place.textFill || '#1f2937'} // gray-800
              className="pointer-events-none select-none"
              textAnchor="middle"
            >
              {place.name}
            </text>
          </g>
        ))}
        {highlightedPlace && getMarker(highlightedPlace)}
      </svg>
       <div className="mt-6 text-center">
        <a
          href="/" // 메인 화면(층 선택)으로 돌아가는 링크
          className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-6 rounded-lg text-base shadow-md hover:shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75"
        >
          다른 층 보기 / 메인으로
        </a>
      </div>
    </div>
  );
};

export default IndoorMap;
