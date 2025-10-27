document.addEventListener('DOMContentLoaded', () => {
    // --- 기본 설정 및 DOM 요소 가져오기 (이전과 동일) ---
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

    let startNode = null; // 초기 노드 정보 (API 응답 전체 저장)
    let destinationNode = null; // 목적지 노드 정보 (API 응답 전체 저장)
    let activeInput = null;
    let floorMapImage = null;

    let animationFrameId = null;
    let fullPath = []; // 백엔드로부터 받은 경로 배열 [{id:'...', x:..., y:..., floor:..., building:...}, ...]
    let pathIndex = 0;
    let scale = 1;
    const markerSpeed = 2;

    const params = new URLSearchParams(window.location.search);
    const urlBuilding = params.get('building');
    const urlFloor = params.get('floor');
    const urlQrId = params.get('qr_id');

    // --- 지도 설정 및 초기화 ---
    const setupMap = (building, floor) => {
        const existingImg = mapContainer.querySelector('img');
        if (existingImg) existingImg.remove();
        floorMapImage = new Image();
        const floorString = String(floor).endsWith('F') ? floor : `${floor}F`;
        const mapImageUrl = `images/${building}_${floorString}.png`;
        floorMapImage.src = mapImageUrl;

        floorMapImage.onload = () => {
            canvas.width = floorMapImage.naturalWidth;
            canvas.height = floorMapImage.naturalHeight;
            mapContainer.appendChild(floorMapImage);
            updateScaleAndPositions(); // 스케일 먼저 계산

            if (startNode && startNode.building === building && String(startNode.floor) === String(floor)) {
                 // **[키 이름 수정]** 초기 노드 정보에서 pixel_x/y 사용
                if (typeof startNode.pixel_x === 'number' && typeof startNode.pixel_y === 'number') {
                    updateMarkerPosition(startNode.pixel_x, startNode.pixel_y);
                } else { console.error("startNode의 좌표값이 유효하지 않습니다:", startNode); }
            }

            const remainingPath = sessionStorage.getItem('remainingPath');
            if (remainingPath) {
                fullPath = JSON.parse(remainingPath);
                sessionStorage.removeItem('remainingPath');
                startPathAnimation(); // 경로 애니메이션 시작
            }
        };
        floorMapImage.onerror = () => {
            console.error(`${mapImageUrl}을 불러올 수 없습니다.`);
            mapContainer.textContent = `지도 이미지(${mapImageUrl})를 불러올 수 없습니다. images 폴더를 확인해주세요.`;
        };
    };

    // --- QR ID로 노드 정보 가져오기 ---
    const fetchNodeByQrId = async (qrId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/nodes/qr/${qrId}/`);
            if (!response.ok) throw new Error('해당 QR ID의 노드를 찾을 수 없습니다.');
            const node = await response.json(); // node 객체는 pixel_x, pixel_y 키를 가짐
            startNode = node;
            startInput.value = node.name;
            startInput.disabled = true;
            const floorString = String(node.floor).endsWith('F') ? node.floor : `${node.floor}F`;
            buildingTitleBtn.textContent = `${node.building} - ${floorString}`;
            setupSidebar(node.building, node.floor);
            setupMap(node.building, node.floor);
        } catch (error) { console.error(error); alert(error.message); }
    };

    // --- 마커 위치 업데이트 (top/left 사용) ---
    const updateMarkerPosition = (x, y) => {
        if (typeof x !== 'number' || typeof y !== 'number') {
            console.error("updateMarkerPosition: 잘못된 좌표값이 들어왔습니다:", x, y); return;
        }
        const scaledX = x * scale;
        const scaledY = y * scale;
        marker.style.left = `${scaledX}px`;
        marker.style.top = `${scaledY}px`;
        marker.style.transform = `translate(-50%, -50%)`;
        marker.style.display = 'block';
    };

    // --- 스케일 계산 및 위치 재조정 ---
    const updateScaleAndPositions = () => {
        if (!floorMapImage || !floorMapImage.naturalWidth || !floorMapImage.complete) return;
        scale = floorMapImage.clientWidth / floorMapImage.naturalWidth;
        const rect = floorMapImage.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        canvas.style.left = `${rect.left - containerRect.left}px`;
        canvas.style.top = `${rect.top - containerRect.top}px`;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        let markerNodeData = null; // 마커 위치에 사용할 노드 데이터 (x, y 키 사용)
        const currentBuilding = startNode ? startNode.building : urlBuilding;
        const currentFloor = startNode ? startNode.floor : urlFloor?.replace('F', '');

        if (fullPath.length > 0 && pathIndex < fullPath.length) {
             const currentPathNode = fullPath[pathIndex]; // fullPath 객체는 x, y 키를 가짐
             if (currentPathNode && currentPathNode.building === currentBuilding && String(currentPathNode.floor) === String(currentFloor)) {
                 markerNodeData = currentPathNode;
            }
        }
        if (!markerNodeData && startNode && startNode.building === currentBuilding && String(startNode.floor) === String(currentFloor)) {
            // fullPath 없을 때 startNode 사용 시, 키 이름 변환
            markerNodeData = { x: startNode.pixel_x, y: startNode.pixel_y };
        }

        if (fullPath.length > 0) {
            const currentFloorPath = fullPath.filter(node => node.building === currentBuilding && String(node.floor) === String(currentFloor));
            drawPath(currentFloorPath); // 경로 다시 그리기 (drawPath는 x, y 사용)
        } else { ctx.clearRect(0, 0, canvas.width, canvas.height); }

        if (markerNodeData && typeof markerNodeData.x === 'number' && typeof markerNodeData.y === 'number') {
            updateMarkerPosition(markerNodeData.x, markerNodeData.y); // updateMarkerPosition은 x, y 사용
        } else if (markerNodeData) {
            console.error("updateScaleAndPositions: markerNodeData의 좌표값이 유효하지 않습니다:", markerNodeData);
        }
    };
    window.addEventListener('resize', updateScaleAndPositions);

    // --- 길찾기 API 호출 ---
    findPathBtn.addEventListener('click', async () => {
        if (!startNode || !destinationNode) { alert('출발지와 목적지를 모두 설정해주세요.'); return; }
        if (startNode.qr_id === destinationNode.qr_id) { alert('출발지와 목적지가 같습니다.'); return; }
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        try {
            const payload = { start_node_id: startNode.qr_id, end_node_id: destinationNode.qr_id };
            const response = await fetch(`${API_BASE_URL}/pathfind/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json(); // result.path 안의 객체는 x, y 키를 가짐
            if (!response.ok || result.error) { throw new Error(result.error || '경로를 찾을 수 없습니다.'); }
            if (!result.path || result.path.length === 0) { throw new Error('경로 데이터가 비어있습니다.'); }
            fullPath = result.path; // fullPath에 저장
            startPathAnimation();
        } catch (error) { console.error('길찾기 오류:', error); alert(error.message); }
    });

    // --- 경로 애니메이션 시작 ---
    const startPathAnimation = () => {
        if (!startNode || fullPath.length < 2) return;
        const currentBuilding = startNode.building;
        const currentFloor = startNode.floor;
        const currentFloorPath = fullPath.filter(node => node.building === currentBuilding && String(node.floor) === String(currentFloor));
        drawPath(currentFloorPath); // drawPath는 x, y 사용

        pathIndex = fullPath.findIndex(node => node.building === currentBuilding && String(node.floor) === String(currentFloor));
        if (pathIndex === -1) { console.error("현재 층에 해당하는 경로 시작점을 찾을 수 없습니다."); return; }

        const startPos = fullPath[pathIndex]; // startPos 객체는 x, y 키를 가짐
        if (startPos && typeof startPos.x === 'number' && typeof startPos.y === 'number') { // **[키 이름 수정]**
            updateMarkerPosition(startPos.x, startPos.y); // updateMarkerPosition은 x, y 사용
            animateMarker();
        } else { console.error("경로 시작점의 좌표가 유효하지 않습니다:", startPos); }
    };

    // --- 마커 이동 애니메이션 ---
    const animateMarker = () => {
        if (!fullPath || pathIndex < 0 || pathIndex >= fullPath.length - 1) {
            if (fullPath && pathIndex === fullPath.length - 1) {
                 const finalPoint = fullPath[pathIndex]; // finalPoint 객체는 x, y 키를 가짐
                 if (finalPoint && typeof finalPoint.x === 'number' && typeof finalPoint.y === 'number') { // **[키 이름 수정]**
                     updateMarkerPosition(finalPoint.x, finalPoint.y); // updateMarkerPosition은 x, y 사용
                 }
                 alert("목적지에 도착했습니다!");
            } else { console.error("animateMarker: 경로 인덱스가 잘못되었습니다.", pathIndex, fullPath?.length); }
            if (animationFrameId) cancelAnimationFrame(animationFrameId); return;
        }

        const currentPoint = fullPath[pathIndex]; // x, y 키
        const nextPoint = fullPath[pathIndex + 1]; // x, y 키

        // **[키 이름 수정]** 좌표 유효성 검사 시 x, y 사용
        if (!currentPoint || typeof currentPoint.x !== 'number' || typeof currentPoint.y !== 'number' ||
            !nextPoint || typeof nextPoint.x !== 'number' || typeof nextPoint.y !== 'number') {
            console.error("animateMarker: 현재 또는 다음 지점의 좌표가 유효하지 않습니다.", currentPoint, nextPoint);
            if (animationFrameId) cancelAnimationFrame(animationFrameId); return;
        }

        if (currentPoint.is_transition) { handleTransition(currentPoint); return; }

        let markerCurrentX, markerCurrentY;
        try {
            markerCurrentX = parseFloat(marker.style.left || '0');
            markerCurrentY = parseFloat(marker.style.top || '0');
        } catch(e) {
            // **[키 이름 수정]** 첫 프레임 위치 계산 시 x, y 사용
            markerCurrentX = currentPoint.x * scale;
            markerCurrentY = currentPoint.y * scale;
        }

        // **[키 이름 수정]** 목표 지점 계산 시 x, y 사용
        const targetPos = { x: nextPoint.x * scale, y: nextPoint.y * scale };
        const dx = targetPos.x - markerCurrentX;
        const dy = targetPos.y - markerCurrentY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < markerSpeed) {
            pathIndex++;
        } else {
            const moveX = markerCurrentX + (dx / distance) * markerSpeed;
            const moveY = markerCurrentY + (dy / distance) * markerSpeed;
            marker.style.left = `${moveX}px`;
            marker.style.top = `${moveY}px`;
            marker.style.transform = `translate(-50%, -50%)`;
        }
        animationFrameId = requestAnimationFrame(animateMarker);
    };

    // --- 경로 그리기 ---
    const drawPath = (currentFloorPath) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!currentFloorPath || currentFloorPath.length < 2) return;
        try {
            ctx.beginPath();
            // **[키 이름 수정]** 경로 시작점 좌표 x, y 사용
            ctx.moveTo(currentFloorPath[0].x, currentFloorPath[0].y);
            // **[키 이름 수정]** 나머지 노드 좌표 x, y 사용
            currentFloorPath.slice(1).forEach(node => { ctx.lineTo(node.x, node.y); });
            ctx.strokeStyle = '#3498db'; ctx.lineWidth = 7; ctx.lineCap = 'round';
            ctx.lineJoin = 'round'; ctx.setLineDash([10, 10]); ctx.stroke();
        } catch (error) { console.error("경로 그리기 중 오류 발생:", error, currentFloorPath); }
    };

    // --- 층간 이동 처리 (이전과 동일) ---
    const handleTransition = (transitionNode) => {
        const nextInfo = transitionNode.transition_to;
        if (!nextInfo || !nextInfo.building || !nextInfo.floor) { console.error("층간 이동 정보가 잘못되었습니다:", transitionNode); return; }
        const type = transitionNode.transition_type || '이동 수단';
        alert(`${type}을(를) 이용하여 ${nextInfo.building} ${nextInfo.floor}으로 이동하세요.`);
        const remainingPath = fullPath.slice(pathIndex + 1);
        sessionStorage.setItem('remainingPath', JSON.stringify(remainingPath));
        window.location.href = `floor.html?building=${nextInfo.building}&floor=${nextInfo.floor}F`;
    };

    // --- 검색 API 호출 (이전과 동일) ---
    const handleSearch = async (event) => {
        const query = event.target.value;
        const currentBuilding = startNode ? startNode.building : urlBuilding;
        const currentFloor = startNode ? String(startNode.floor) : urlFloor?.replace('F', '');
        if (!query || !currentBuilding || !currentFloor) { searchResults.style.display = 'none'; return; }
        try {
            const response = await fetch(`${API_BASE_URL}/nodes/?query=${query}&building=${currentBuilding}&floor=${currentFloor}`);
            const nodes = await response.json(); // API 응답 객체는 pixel_x, pixel_y 사용
            displaySearchResults(nodes);
        } catch (error) { console.error('검색 오류:', error); }
    };

    // --- 검색 결과 표시 (이전과 동일) ---
    const displaySearchResults = (nodes) => {
        searchResults.innerHTML = '';
        if (!nodes || nodes.length === 0) { searchResults.style.display = 'none'; return; }
        nodes.forEach(node => { // node 객체는 pixel_x, pixel_y 사용
            const resultItem = document.createElement('div');
            const floorDisplay = typeof node.floor === 'number' || !isNaN(parseInt(node.floor)) ? `${node.floor}F` : node.floor;
            resultItem.textContent = `${node.name} (${floorDisplay})`;
            resultItem.classList.add('search-result-item');
            resultItem.addEventListener('click', () => {
                // startNode/destinationNode에 저장 시 API 응답 그대로 저장 (pixel_x/y 포함)
                if (activeInput === startInput) { startNode = node; startInput.value = node.name; }
                else { destinationNode = node; destinationInput.value = node.name; }
                searchResults.style.display = 'none';
            });
            searchResults.appendChild(resultItem);
        });
        searchResults.style.display = 'block';
    };

    // --- 사이드바 설정 (이전과 동일) ---
    const setupSidebar = (currentBuilding, currentFloor) => {
        floorList.innerHTML = '';
        for (const buildingName in buildingsData) {
            const headerItem = document.createElement('li');
            headerItem.className = 'building-header'; headerItem.textContent = buildingName;
            floorList.appendChild(headerItem);
            const floors = buildingsData[buildingName];
            floors.forEach(floorName => {
                const listItem = document.createElement('li');
                const button = document.createElement('button'); button.textContent = floorName;
                if (buildingName === currentBuilding && floorName === `${currentFloor}F`) { button.classList.add('active'); }
                button.addEventListener('click', () => { window.location.href = `floor.html?building=${buildingName}&floor=${floorName}`; });
                listItem.appendChild(button); floorList.appendChild(listItem);
            });
        }
    };

    // --- 이벤트 리스너 설정 (이전과 동일) ---
    startInput.addEventListener('focus', () => activeInput = startInput);
    destinationInput.addEventListener('focus', () => activeInput = destinationInput);
    startInput.addEventListener('input', handleSearch);
    destinationInput.addEventListener('input', handleSearch);
    swapBtn.addEventListener('click', () => {
        if (startInput.disabled) return;
        [startNode, destinationNode] = [destinationNode, startNode];
        [startInput.value, destinationInput.value] = [destinationInput.value, startInput.value];
    });
    buildingTitleBtn.addEventListener('click', (event) => { event.stopPropagation(); floorList.classList.toggle('show'); });
    window.addEventListener('click', (event) => {
        if (!event.target.matches('#building-title-btn') && floorList.classList.contains('show')) {
            floorList.classList.remove('show');
        }
    });

    // --- 초기 실행 로직 (이전과 동일) ---
    if (urlQrId) { fetchNodeByQrId(urlQrId); }
    else if (urlBuilding && urlFloor) {
        buildingTitleBtn.textContent = `${urlBuilding} - ${urlFloor}`;
        const floorNumber = urlFloor.replace('F', '');
        setupSidebar(urlBuilding, floorNumber);
        setupMap(urlBuilding, floorNumber);
    } else {
        document.querySelector('.floor-container').innerHTML = '<h1>표시할 지도 정보가 없습니다.</h1><p>메인 화면에서 층을 선택하거나 QR코드를 스캔해주세요.</p>';
    }
});
