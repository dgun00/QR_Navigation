// src/App.jsx
import { useEffect, useState } from 'react';
import IndoorMap from './components/IndoorMap';
import MainScreen from './components/MainScreen';
import { getFloorFromLoc, getPlaceById, floorData } from './floorData';

function App() {
  const [currentLocId, setCurrentLocId] = useState(null); // 예: "1F-Lobby"
  const [selectedFloorId, setSelectedFloorId] = useState(null); // 예: "1F"
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locFromQR = params.get('loc'); // 특정 장소 QR 스캔 시
    const floorFromNav = params.get('floor'); // 층 선택 버튼 클릭 시

    if (locFromQR) {
      const floor = getFloorFromLoc(locFromQR);
      if (floor && floorData[floor]) {
        setCurrentLocId(locFromQR);
        setSelectedFloorId(floor);
      } else {
        // 유효하지 않은 loc 파라미터 처리 (예: 기본 화면으로)
        setSelectedFloorId(null);
        setCurrentLocId(null);
      }
    } else if (floorFromNav) {
      if (floorData[floorFromNav]) {
        setSelectedFloorId(floorFromNav);
        setCurrentLocId(null); // 층 전체 보기, 특정 위치는 없음
      } else {
        // 유효하지 않은 floor 파라미터 처리
        setSelectedFloorId(null);
        setCurrentLocId(null);
      }
    } else {
      // 파라미터 없이 접속 시 (메인 화면)
      setSelectedFloorId(null);
      setCurrentLocId(null);
    }
    setIsLoading(false);
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  const currentPlace = getPlaceById(currentLocId);
  const currentFloorInfo = selectedFloorId ? floorData[selectedFloorId] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex justify-center items-center">
        <p className="text-2xl text-sky-300">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
            QR 실내 내비게이션
          </span>
        </h1>
      </header>

      <main className="w-full flex justify-center">
        {selectedFloorId ? (
          <IndoorMap selectedFloor={selectedFloorId} currentLoc={currentLocId} />
        ) : (
          <MainScreen />
        )}
      </main>

      {selectedFloorId && currentPlace && (
        <p className="mt-8 text-xl text-sky-300 animate-pulse">
          현재 스캔 위치: <span className="font-semibold text-yellow-300">{currentPlace.name}</span> ({currentFloorInfo?.name})
        </p>
      )}
      {selectedFloorId && !currentPlace && (
         <p className="mt-8 text-xl text-slate-400">
           {currentFloorInfo?.name} 지도를 보고 있습니다.
         </p>
      )}
       {!selectedFloorId && !currentLocId && (
         <p className="mt-8 text-md text-slate-400 fixed bottom-5">
           &copy; {new Date().getFullYear()} QR 실내 내비게이션.
         </p>
       )}
    </div>
  );
}

export default App;
