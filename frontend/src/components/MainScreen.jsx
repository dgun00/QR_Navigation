// src/components/MainScreen.jsx
import React from 'react';
import { floorData } from '../floorData';

const MainScreen = () => {
  const floors = Object.keys(floorData);

  return (
    <div className="w-full max-w-lg p-6 sm:p-10 bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl transform transition-all duration-500 ease-out">
      <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-sky-300 tracking-wide">
        층별 안내
      </h2>
      <div className="space-y-5">
        {floors.map(floorId => (
          <a
            key={floorId}
            href={`?floor=${floorId}`} // URL 파라미터로 층 정보 전달
            className="block w-full text-center bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3.5 px-6 rounded-lg text-lg shadow-lg hover:shadow-xl transform transition-all duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
          >
            {floorData[floorId]?.name || `${floorId} 지도 보기`}
          </a>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-slate-400">
        층을 선택하여 지도를 보거나, 장소 QR 코드를 스캔하세요.
      </p>
    </div>
  );
};

export default MainScreen;
