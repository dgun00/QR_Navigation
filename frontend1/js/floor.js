document.addEventListener('DOMContentLoaded', () => {
    // --- 기본 설정 및 DOM 요소 가져오기 ---
    const API_BASE_URL = 'http://127.0.0.1:8000/api/navigation';
    const buildingTitleBtn = document.getElementById('building-title-btn');
    const floorList = document.getElementById('floor-list');
    const mapContainer = document.getElementById('map-container');
    const marker = document.getElementById('marker');
    const startInput = document.getElementById('start-input');
    const destinationInput = document.getElementById('destination-input');
    const swapBtn = document.getElementById('swap-btn');
    const findPathBtn = document.getElementById('find-path-btn');
    const searchResults = document.getElementById('search-results');
    const canvas = document.getElementById('path-canvas');
    const ctx = canvas.getContext('2d');

    const buildingsData = {
        'A12': ['1F', '2F', '3F', '4F'],
        'A13': ['1F', '2F', '3F', '4F']
    };

    let startNode = null;
    let destinationNode = null;
    let activeInput = null;
    let floorMapImage = null;

    let animationFrameId = null;
    let fullPath = [];
    let pathIndex = 0;
    let scale = 1; // --- 이미지 스케일 변수 ---
    const markerSpeed = 2;

    const params = new URLSearchParams(window.location.search);
    const building = params.get('building');
    const floor = params.get('floor');
    const qrId = params.get('qr_id');

    // --- 지도 설정 및 초기화  ---
    const setupMap = () => {
        const existingImg = mapContainer.querySelector('img');
        if (existingImg) existingImg.remove();
        
        floorMapImage = new Image();
        const mapImageUrl = `images/${building}_${floor}.png`;
        floorMapImage.src = mapImageUrl;

        floorMapImage.onload = () => {
            // 캔버스 해상도는 원본 이미지 크기로 설정 (고화질 유지)
            canvas.width = floorMapImage.naturalWidth;
            canvas.height = floorMapImage.naturalHeight;
            mapContainer.appendChild(floorMapImage);

            // 초기 스케일 계산 및 위치 조정
            updateScaleAndPositions();

            if (qrId) fetchNodeByQrId(qrId);

            const remainingPath = sessionStorage.getItem('remainingPath');
            if (remainingPath) {
                fullPath = JSON.parse(remainingPath);
                sessionStorage.removeItem('remainingPath');
                startPathAnimation();
            }
        };

        floorMapImage.onerror = () => {
            console.error(`${mapImageUrl}을 불러올 수 없습니다.`);
            mapContainer.textContent = '지도 이미지를 불러올 수 없습니다. images 폴더를 확인해주세요.';
        };
    };
    

    const fetchNodeByQrId = async (qrId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/nodes/qr/${qrId}/`);
            if (!response.ok) throw new Error('해당 QR ID의 노드를 찾을 수 없습니다.');
            const node = await response.json();
            startNode = node;
            startInput.value = node.name;
            startInput.disabled = true;
            updateMarkerPosition(node.pixel_x, node.pixel_y);
        } catch (error) {
            console.error(error); alert(error.message);
        }
    };


    // --- 마커 위치 업데이트 함수에 스케일 적용 ---
    const updateMarkerPosition = (x, y) => {
        const scaledX = x * scale;
        const scaledY = y * scale;
        marker.style.transform = `translateX(${scaledX}px) translateY(${scaledY}px)`;
        marker.style.display = 'block';
    };


    // --- 스케일 계산 및 캔버스/마커 위치 조정 함수 ---
    const updateScaleAndPositions = () => {
        if (!floorMapImage || !floorMapImage.naturalWidth) return;

        // 1. 스케일 계산
        scale = floorMapImage.clientWidth / floorMapImage.naturalWidth;

        // 2. 캔버스와 마커의 위치/크기를 이미지에 맞춤
        const rect = floorMapImage.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();

        canvas.style.left = `${rect.left - containerRect.left}px`;
        canvas.style.top = `${rect.top - containerRect.top}px`;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        marker.style.left = canvas.style.left;
        marker.style.top = canvas.style.top;

        // 3. 스케일 변경에 따라 경로 다시 그리기
        if (fullPath.length > 0) {
            const currentFloorPath = fullPath.filter(node => node.building === building && node.floor === floor);
            drawPath(currentFloorPath);
            if(pathIndex > 0) {
                 updateMarkerPosition(fullPath[pathIndex].pixel_x, fullPath[pathIndex].pixel_y);
            }
        }
    };


    // --- 길찾기 ---
findPathBtn.addEventListener('click', async () => {
    if (!startNode || !destinationNode) {
        alert('출발지와 목적지를 모두 설정해주세요.');
        return;
    }
    // qr_id로 비교하도록 수정
    if (startNode.qr_id === destinationNode.qr_id) {
        alert('출발지와 목적지가 같습니다.');
        return;
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    try {
        const response = await fetch(`${API_BASE_URL}/pathfind/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 수정된 부분 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
            body: JSON.stringify({
                start_node_id: startNode.qr_id,
                end_node_id: destinationNode.qr_id
            })
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        });
        
        const result = await response.json(); // 응답을 먼저 받고

        if (!response.ok || result.error) {
            // API가 에러를 반환했는지 확인
            throw new Error(result.error || '경로를 찾을 수 없습니다.');
        }

        fullPath = result.path; // 응답 객체의 'path' 배열을 할당
        startPathAnimation();

    } catch (error) {
        console.error('길찾기 오류:', error);
        alert(error.message);
    }
});

    // --- 경로 애니메이션 관련 함수 ---
    const startPathAnimation = () => {
        if (fullPath.length < 2) return;
        const currentFloorPath = fullPath.filter(node => node.building === building && node.floor === floor);
        drawPath(currentFloorPath);
        pathIndex = fullPath.findIndex(node => node.building === building && node.floor === floor);
        if (pathIndex === -1) return;
        const startPos = fullPath[pathIndex];
        updateMarkerPosition(startPos.pixel_x, startPos.pixel_y);
        animateMarker();
    };

const animateMarker = () => {
    // 애니메이션이 끝났는지 확인 (도착지에 도달)
    if (pathIndex >= fullPath.length - 1) {
        // 마지막 지점에 마커를 정확히 위치시키고 애니메이션 종료
        const finalPoint = fullPath[fullPath.length - 1];
        updateMarkerPosition(finalPoint.pixel_x, finalPoint.pixel_y);
        alert("목적지에 도착했습니다!");
        cancelAnimationFrame(animationFrameId); // 애니메이션 중지
        return;
    }

    const currentPoint = fullPath[pathIndex];
    const nextPoint = fullPath[pathIndex + 1];

    // 층이나 건물이 바뀌는 지점인지 확인 (이 코드는 이미 있었습니다)
    if (currentPoint.is_transition) {
        handleTransition(currentPoint);
        return;
    }

    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 이 부분이 핵심 수정 사항입니다 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // 불안정한 CSS 스타일 대신, 정확한 데이터로 현재 위치를 계산합니다.
    const currentPos = { 
        x: currentPoint.pixel_x * scale, 
        y: currentPoint.pixel_y * scale 
    };
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const targetPos = { x: nextPoint.pixel_x * scale, y: nextPoint.pixel_y * scale };
    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 마커가 다음 지점에 거의 도달했는지 확인
    // (현재 마커의 실제 위치를 읽어와서 비교해야 더 부드럽습니다)
    const markerTransform = marker.style.transform;
    const markerCurrentX = parseFloat(markerTransform.match(/translateX\(([^p]+)px\)/)?.[1] || currentPos.x);
    const markerCurrentY = parseFloat(markerTransform.match(/translateY\(([^p]+)px\)/)?.[1] || currentPos.y);

    const remainingDistance = Math.sqrt(Math.pow(targetPos.x - markerCurrentX, 2) + Math.pow(targetPos.y - markerCurrentY, 2));

    if (remainingDistance < markerSpeed) {
        // 다음 지점으로 인덱스 이동
        pathIndex++;
        // 다음 애니메이션 프레임 요청
        animationFrameId = requestAnimationFrame(animateMarker);
    } else {
        // 다음 지점으로 이동
        const moveX = markerCurrentX + (dx / distance) * markerSpeed;
        const moveY = markerCurrentY + (dy / distance) * markerSpeed;
        marker.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
        // 다음 애니메이션 프레임 요청
        animationFrameId = requestAnimationFrame(animateMarker);
    }
};

    // --- 경로 그리기 함수에 스케일 적용 ---
    const drawPath = (currentFloorPath) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (currentFloorPath.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(currentFloorPath[0].pixel_x, currentFloorPath[0].pixel_y);
        currentFloorPath.slice(1).forEach(node => {
            ctx.lineTo(node.pixel_x, node.pixel_y);
        });
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 7; // 선 굵기는 고정 (스케일링된 캔버스에 원본 해상도로 그리므로)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([10, 10]);
        ctx.stroke();
    };


    const handleTransition = (transitionNode) => {
        const nextInfo = transitionNode.transition_to;
        const type = transitionNode.transition_type || '이동 수단';
        alert(`${type}을(를) 이용하여 ${nextInfo.building} ${nextInfo.floor}으로 이동하세요.`);
        const remainingPath = fullPath.slice(pathIndex + 1);
        sessionStorage.setItem('remainingPath', JSON.stringify(remainingPath));
        window.location.href = `floor.html?building=${nextInfo.building}&floor=${nextInfo.floor}`;
    };
    

    const handleSearch = async (event) => {
        const query = event.target.value;
        if (!query) { searchResults.style.display = 'none'; return; }
        try {
            const response = await fetch(`${API_BASE_URL}/nodes/?query=${query}&building=${building}&floor=${floor}`);
            const nodes = await response.json();
            displaySearchResults(nodes);
        } catch (error) { console.error('검색 오류:', error); }
    };

    const displaySearchResults = (nodes) => {
        searchResults.innerHTML = '';
        if (nodes.length === 0) { searchResults.style.display = 'none'; return; }
        nodes.forEach(node => {
            const resultItem = document.createElement('div');
            resultItem.textContent = `${node.name} (${node.floor})`;
            resultItem.classList.add('search-result-item');
            resultItem.addEventListener('click', () => {
                if (activeInput === startInput) {
                    startNode = node;
                    startInput.value = node.name;
                } else {
                    destinationNode = node;
                    destinationInput.value = node.name;
                }
                searchResults.style.display = 'none';
            });
            searchResults.appendChild(resultItem);
        });
        searchResults.style.display = 'block';
    };

    const setupSidebar = () => {
        floorList.innerHTML = '';
        for (const buildingName in buildingsData) {
            const headerItem = document.createElement('li');
            headerItem.className = 'building-header';
            headerItem.textContent = buildingName;
            floorList.appendChild(headerItem);
            const floors = buildingsData[buildingName];
            floors.forEach(floorName => {
                const listItem = document.createElement('li');
                const button = document.createElement('button');
                button.textContent = floorName;
                if (buildingName === building && floorName === floor) {
                    button.classList.add('active');
                }
                button.addEventListener('click', () => {
                    window.location.href = `floor.html?building=${buildingName}&floor=${floorName}`;
                });
                listItem.appendChild(button);
                floorList.appendChild(listItem);
            });
        }
    };

    startInput.addEventListener('focus', () => activeInput = startInput);
    destinationInput.addEventListener('focus', () => activeInput = destinationInput);
    startInput.addEventListener('input', handleSearch);
    destinationInput.addEventListener('input', handleSearch);
    swapBtn.addEventListener('click', () => {
        if (startInput.disabled) return;
        [startNode, destinationNode] = [destinationNode, startNode];
        [startInput.value, destinationInput.value] = [destinationInput.value, startInput.value];
    });

    if ((building && floor) || qrId) {
        if (building) {
            buildingTitleBtn.textContent = `${building} - ${floor}`;
        }
        setupSidebar();
        setupMap();
    } else {
        document.querySelector('.floor-container').innerHTML = '<h1>표시할 지도 정보가 없습니다.</h1><p>메인 화면에서 층을 선택하거나 QR코드를 스캔해주세요.</p>';
    }

    buildingTitleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        floorList.classList.toggle('show');
    });

    window.addEventListener('click', (event) => {
        if (!event.target.matches('#building-title-btn')) {
            if (floorList.classList.contains('show')) {
                floorList.classList.remove('show');
            }
        }
    });

    // --- 창 크기 변경 시 스케일 다시 계산 ---
    window.addEventListener('resize', updateScaleAndPositions);
});
