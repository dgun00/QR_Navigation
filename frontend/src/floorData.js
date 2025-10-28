// src/floorData.js

/**
 * 각 층의 정보와 장소 데이터를 정의합니다.
 * - id: 각 장소의 고유 ID (층ID-장소코드 형식)
 * - name: 장소의 이름
 * - cx, cy: 지도 위 해당 장소에 표시될 마커의 중심 x, y 좌표
 * - shape: 장소를 나타내는 SVG 도형 (여기서는 'rect' 즉, 사각형)
 * - details: 도형의 상세 정보
 * - x, y: 사각형의 왼쪽 상단 x, y 좌표
 * - width, height: 사각형의 너비와 높이
 * - fill: 사각형의 배경색
 * - stroke: 사각형의 테두리색
 * - strokeWidth: 사각형 테두리 두께
 * - textX, textY: 장소 이름 텍스트의 x, y 좌표
 * - textFill: 텍스트 색상
 *
 * svgWidth, svgHeight, viewBox: 각 층별 지도의 SVG 크기 및 표시 영역
 */
export const floorData = {
  '1F': {
    name: '1층',
    places: [
      {
        id: '1F-1',
        name: 'Room1',
        cx: 100, cy: 150, // 마커 위치 (사각형 중앙 근처)
        shape: 'rect',
        details: { x: 50, y: 100, width: 100, height: 100, fill: 'hsl(195, 50%, 85%)', stroke: 'hsl(195, 50%, 65%)', strokeWidth: 2 },
        textX: 100, textY: 155, textFill: 'hsl(195, 70%, 25%)'
      },
      {
        id: '1F-2',
        name: 'Room2',
        cx: 275, cy: 80, // 마커 위치
        shape: 'rect',
        details: { x: 225, y: 50, width: 100, height: 60, fill: 'hsl(45, 70%, 85%)', stroke: 'hsl(45, 70%, 65%)', strokeWidth: 2 },
        textX: 275, textY: 85, textFill: 'hsl(45, 80%, 25%)'
      },
      {
        id: '1F-3',
        name: 'Room3',
        cx: 450, cy: 200, // 마커 위치
        shape: 'rect',
        details: { x: 400, y: 150, width: 100, height: 100, fill: 'hsl(125, 50%, 85%)', stroke: 'hsl(125, 50%, 65%)', strokeWidth: 2 },
        textX: 450, textY: 205, textFill: 'hsl(125, 60%, 25%)'
      },
    ],
    svgWidth: 550,
    svgHeight: 300,
    viewBox: "0 0 550 300",
  },
  '2F': {
    name: '2층',
    places: [
      {
        id: '2F-1',
        name: 'Room4',
        cx: 100, cy: 80, // 마커 위치
        shape: 'rect',
        details: { x: 50, y: 50, width: 100, height: 120, fill: 'hsl(210, 55%, 88%)', stroke: 'hsl(210, 55%, 68%)', strokeWidth: 2 },
        textX: 100, textY: 115, textFill: 'hsl(210, 65%, 28%)'
      },
      {
        id: '2F-2',
        name: 'Room5',
        cx: 300, cy: 150, // 마커 위치
        shape: 'rect',
        details: { x: 200, y: 100, width: 200, height: 100, fill: 'hsl(30, 65%, 88%)', stroke: 'hsl(30, 65%, 68%)', strokeWidth: 2 },
        textX: 300, textY: 155, textFill: 'hsl(30, 75%, 28%)'
      },
      {
        id: '2F-3',
        name: 'Room6',
        cx: 480, cy: 220, // 마커 위치
        shape: 'rect',
        details: { x: 430, y: 150, width: 100, height: 120, fill: 'hsl(260, 50%, 88%)', stroke: 'hsl(260, 50%, 68%)', strokeWidth: 2 },
        textX: 480, textY: 215, textFill: 'hsl(260, 60%, 28%)'
      },
    ],
    svgWidth: 550,
    svgHeight: 300,
    viewBox: "0 0 550 300",
  },
  '3F': {
    name: '3층',
    places: [
      {
        id: '3F-1',
        name: 'Room7',
        cx: 150, cy: 150, // 마커 위치
        shape: 'rect',
        details: { x: 50, y: 50, width: 200, height: 200, fill: 'hsl(0, 50%, 88%)', stroke: 'hsl(0, 50%, 68%)', strokeWidth: 2 },
        textX: 150, textY: 155, textFill: 'hsl(0, 60%, 28%)'
      },
      {
        id: '3F-2',
        name: 'Room8',
        cx: 380, cy: 100, // 마커 위치
        shape: 'rect',
        details: { x: 300, y: 70, width: 160, height: 80, fill: 'hsl(60, 60%, 88%)', stroke: 'hsl(60, 60%, 68%)', strokeWidth: 2 },
        textX: 380, textY: 115, textFill: 'hsl(60, 70%, 28%)'
      },
      {
        id: '3F-3',
        name: 'Room9',
        cx: 420, cy: 230, // 마커 위치
        shape: 'rect',
        details: { x: 370, y: 200, width: 100, height: 60, fill: 'hsl(180, 40%, 88%)', stroke: 'hsl(180, 40%, 68%)', strokeWidth: 2 },
        textX: 420, textY: 235, textFill: 'hsl(180, 50%, 28%)'
      },
    ],
    svgWidth: 550,
    svgHeight: 300,
    viewBox: "0 0 550 300",
  }
};

// --- 헬퍼 함수들 (이전과 동일) ---

/**
 * QR코드로 스캔된 위치 ID (예: "1F-Entry")에서 층 정보 (예: "1F")를 추출합니다.
 * @param {string | null} locId - 전체 위치 ID
 * @returns {string | null} 층 ID 또는 null
 */
export const getFloorFromLoc = (locId) => {
  if (!locId || typeof locId !== 'string') return null;
  const parts = locId.split('-');
  if (parts.length > 0) {
    return parts[0];
  }
  return null;
};

/**
 * 전체 위치 ID로 장소 객체를 찾습니다.
 * @param {string | null} locId - 전체 위치 ID (예: "1F-Entry")
 * @returns {object | null} 장소 객체 또는 null
 */
export const getPlaceById = (locId) => {
  if (!locId) return null;
  const floorId = getFloorFromLoc(locId);
  if (floorId && floorData[floorId]) {
    return floorData[floorId].places.find(p => p.id === locId) || null;
  }
  return null;
};
