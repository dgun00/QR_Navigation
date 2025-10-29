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
    const arScanBtn = document.getElementById('ar-scan-btn'); // AR 버튼 추가

    const buildingsData = {
        'A12': ['1F', '2F', '3F', '4F'],
        'A13': ['1F', '2F', '3F', '4F']
    };

    let startNode = null;       // 개별 노드 정보 (pixel_x, pixel_y 키 사용)
    let destinationNode = null; // 개별 노드 정보 (pixel_x, pixel_y 키 사용)
    let activeInput = null;
    let floorMapImage = null;

    let animationFrameId = null;
    let fullPath = [];          // 경로 노드 배열 (x, y 키 사용)
    let pathIndex = 0;
    let scale = 1;
    const markerSpeed = 2;

    const params = new URLSearchParams(window.location.search);
    const urlBuilding = params.get('building');
    const urlFloor = params.get('floor'); // '1F' 같은 문자열
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
            updateScaleAndPositions(); // 스케일 및 기본 위치 계산

            // startNode가 유효하고 현재 층/건물과 일치하면 마커 표시
            if (startNode && startNode.building === building && String(startNode.floor) === String(floor)) {
                // 초기 마커는 startNode의 pixel_x, pixel_y 사용
                if (typeof startNode.pixel_x === 'number' && typeof startNode.pixel_y === 'number') {
                    updateMarkerPosition(startNode.pixel_x, startNode.pixel_y);
                } else { console.error("startNode의 좌표값이 유효하지 않습니다:", startNode); }
            }

            const remainingPath = sessionStorage.getItem('remainingPath');
            if (remainingPath) {
                fullPath = JSON.parse(remainingPath); // 경로 데이터는 x, y 키 사용
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
            const node = await response.json(); // node는 pixel_x, pixel_y 키 사용
            startNode = node;
            startInput.value = node.name;
            startInput.disabled = true;
            const floorString = String(node.floor).endsWith('F') ? node.floor : `${node.floor}F`;
            buildingTitleBtn.textContent = `${node.building} - ${floorString}`;
            setupSidebar(node.building, node.floor);
            setupMap(node.building, node.floor);
        } catch (error) { console.error(error); alert(error.message); }
    };

    // --- 마커 위치 업데이트 (반응형 top/left 사용) ---
    const updateMarkerPosition = (x, y) => {
        if (typeof x !== 'number' || typeof y !== 'number') {
            console.error("updateMarkerPosition: 잘못된 좌표값이 들어왔습니다:", x, y); return;
        }
        if (!floorMapImage || !floorMapImage.complete || !mapContainer) return; // 이미지 로딩 확인

        const imageRect = floorMapImage.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        const offsetX = imageRect.left - containerRect.left; // 컨테이너 기준 이미지 시작 X
        const offsetY = imageRect.top - containerRect.top;  // 컨테이너 기준 이미지 시작 Y

        // 원본 좌표(x, y)에 스케일과 오프셋을 적용하여 최종 화면 좌표 계산
        const finalX = offsetX + x * scale;
        const finalY = offsetY + y * scale;

        marker.style.left = `${finalX}px`;
        marker.style.top = `${finalY}px`;
        // 중앙 정렬은 CSS에서 처리하므로 transform 제거
        // marker.style.transform = `translate(-50%, -50%)`;
        marker.style.display = 'block';
    };


    // --- 스케일 계산 및 위치 재조정 (반응형 로직) ---
    const updateScaleAndPositions = () => {
        if (!floorMapImage || !floorMapImage.naturalWidth || !floorMapImage.complete) return;

        scale = floorMapImage.clientWidth / floorMapImage.naturalWidth;
        const imageRect = floorMapImage.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        const offsetX = imageRect.left - containerRect.left;
        const offsetY = imageRect.top - containerRect.top;

        // 캔버스 위치/크기 조정
        canvas.style.left = `${offsetX}px`;
        canvas.style.top = `${offsetY}px`;
        canvas.style.width = `${imageRect.width}px`;
        canvas.style.height = `${imageRect.height}px`;

        // 현재 표시해야 할 마커 노드 데이터 결정
        let markerNodeData = null; // 마커 위치에 사용할 노드 데이터 (pixel_x/y 또는 x/y)
        const currentBuilding = startNode ? startNode.building : urlBuilding;
        const currentFloor = startNode ? startNode.floor : urlFloor?.replace('F', '');

        if (fullPath.length > 0 && pathIndex < fullPath.length) {
             const currentPathNode = fullPath[pathIndex]; // fullPath 객체는 x, y 키 가짐
             if (currentPathNode && currentPathNode.building === currentBuilding && String(currentPathNode.floor) === String(currentFloor)) {
                 markerNodeData = currentPathNode; // 경로 데이터 사용 시 x, y
            }
        }
        if (!markerNodeData && startNode && startNode.building === currentBuilding && String(startNode.floor) === String(currentFloor)) {
            // 초기 노드 데이터 사용 시 pixel_x, pixel_y
            markerNodeData = { x: startNode.pixel_x, y: startNode.pixel_y };
        }

        // 경로 다시 그리기 (현재 층 경로만)
        if (fullPath.length > 0) {
            const currentFloorPath = fullPath.filter(node => node.building === currentBuilding && String(node.floor) === String(currentFloor));
            drawPath(currentFloorPath); // drawPath는 경로 데이터(x,y) 사용
        } else { ctx.clearRect(0, 0, canvas.width, canvas.height); }

        // 마커 위치 업데이트 (유효한 노드가 있을 때만)
        // updateMarkerPosition 함수는 어떤 키 이름이든 x, y로 받음
        if (markerNodeData && typeof markerNodeData.x === 'number' && typeof markerNodeData.y === 'number') {
            updateMarkerPosition(markerNodeData.x, markerNodeData.y);
        } else if (markerNodeData) {
            console.error("updateScaleAndPositions: markerNodeData의 좌표값이 유효하지 않습니다:", markerNodeData);
        }
    };
    window.addEventListener('resize', updateScaleAndPositions);

    // --- 길찾기 API 호출 (qr_id 사용) ---
    findPathBtn.addEventListener('click', async () => {
        if (!startNode || !destinationNode) { alert('출발지와 목적지를 모두 설정해주세요.'); return; }
        // **[키 이름 수정]** id 대신 qr_id로 비교
        if (startNode.qr_id === destinationNode.qr_id) { alert('출발지와 목적지가 같습니다.'); return; }
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        try {
            const payload = { start_node_id: startNode.qr_id, end_node_id: destinationNode.qr_id };
            const response = await fetch(`${API_BASE_URL}/pathfind/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json(); // result.path 안 객체는 x, y 키 가짐
            if (!response.ok || result.error) { throw new Error(result.error || '경로를 찾을 수 없습니다.'); }
            if (!result.path || result.path.length === 0) { throw new Error('경로 데이터가 비어있습니다.'); }
            fullPath = result.path; // fullPath에 저장 (x, y 키)
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

        const startPos = fullPath[pathIndex]; // startPos 객체는 x, y 키 가짐
        if (startPos && typeof startPos.x === 'number' && typeof startPos.y === 'number') {
            updateMarkerPosition(startPos.x, startPos.y); // updateMarkerPosition은 x, y 사용
            animateMarker(); // 애니메이션 시작
        } else { console.error("경로 시작점의 좌표가 유효하지 않습니다:", startPos); }
    };

    // --- 마커 이동 애니메이션 (반응형 top/left 사용) ---
    const animateMarker = () => {
        if (!fullPath || pathIndex < 0 || pathIndex >= fullPath.length - 1) {
            if (fullPath && pathIndex === fullPath.length - 1) {
                 const finalPoint = fullPath[pathIndex]; // finalPoint는 x, y 키 가짐
                 if (finalPoint && typeof finalPoint.x === 'number' && typeof finalPoint.y === 'number') {
                     updateMarkerPosition(finalPoint.x, finalPoint.y); // x, y 사용
                 }
                 alert("목적지에 도착했습니다!");
            } else { console.error("animateMarker: 경로 인덱스가 잘못되었습니다.", pathIndex, fullPath?.length); }
            if (animationFrameId) cancelAnimationFrame(animationFrameId); return;
        }

        const currentPoint = fullPath[pathIndex]; // x, y 키
        const nextPoint = fullPath[pathIndex + 1]; // x, y 키

        if (!currentPoint || typeof currentPoint.x !== 'number' || typeof currentPoint.y !== 'number' ||
            !nextPoint || typeof nextPoint.x !== 'number' || typeof nextPoint.y !== 'number') {
            console.error("animateMarker: 현재 또는 다음 지점의 좌표가 유효하지 않습니다.", currentPoint, nextPoint);
            if (animationFrameId) cancelAnimationFrame(animationFrameId); return;
        }

        if (currentPoint.is_transition) { handleTransition(currentPoint); return; }

        // 현재 마커 위치 읽기 (top/left)
        let markerCurrentX, markerCurrentY;
        try {
            markerCurrentX = parseFloat(marker.style.left || '0');
            markerCurrentY = parseFloat(marker.style.top || '0');
        } catch(e) {
            // 첫 프레임 등 스타일 값 없을 경우 데이터상의 위치 사용 (scale + offset 적용)
             if (!floorMapImage || !floorMapImage.complete) return; // 이미지 로딩 확인
             const imageRect = floorMapImage.getBoundingClientRect();
             const containerRect = mapContainer.getBoundingClientRect();
             const offsetX = imageRect.left - containerRect.left;
             const offsetY = imageRect.top - containerRect.top;
             markerCurrentX = offsetX + currentPoint.x * scale; // x, y 사용
             markerCurrentY = offsetY + currentPoint.y * scale; // x, y 사용
        }

        // 다음 목표 지점 계산 (scale + offset 적용)
         if (!floorMapImage || !floorMapImage.complete) return; // 이미지 로딩 확인
         const imageRect = floorMapImage.getBoundingClientRect();
         const containerRect = mapContainer.getBoundingClientRect();
         const offsetX = imageRect.left - containerRect.left;
         const offsetY = imageRect.top - containerRect.top;
         const targetPos = { x: offsetX + nextPoint.x * scale, y: offsetY + nextPoint.y * scale }; // x, y 사용

        const dx = targetPos.x - markerCurrentX;
        const dy = targetPos.y - markerCurrentY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < markerSpeed) {
            pathIndex++; // 다음 노드로 이동
        } else {
            // top/left 스타일 업데이트로 마커 이동
            const moveX = markerCurrentX + (dx / distance) * markerSpeed;
            const moveY = markerCurrentY + (dy / distance) * markerSpeed;
            marker.style.left = `${moveX}px`;
            marker.style.top = `${moveY}px`;
            // transform은 중앙 정렬만 유지 (필요하다면 CSS에서 처리)
            // marker.style.transform = `translate(-50%, -50%)`;
        }
        animationFrameId = requestAnimationFrame(animateMarker); // 다음 프레임 요청
    };


    // --- 경로 그리기 (반응형 로직 포함) ---
    const drawPath = (currentFloorPath) => { // currentFloorPath 안 객체는 x, y 키 사용
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!currentFloorPath || currentFloorPath.length < 2) return;
        try {
            ctx.save(); // 현재 상태 저장
            // 스케일 적용 (캔버스 크기는 원본, 그리는 좌표에 스케일 적용 대신)
            // --> 아니면 캔버스 자체 크기를 조절했으니 원본 좌표로 그려야 함
            // ctx.scale(scale, scale); // 이 줄 제거 또는 주석 처리

            ctx.beginPath();
            ctx.moveTo(currentFloorPath[0].x, currentFloorPath[0].y); // x, y 사용
            currentFloorPath.slice(1).forEach(node => { ctx.lineTo(node.x, node.y); }); // x, y 사용

            // 스케일에 따라 선 굵기, 점선 간격 조절
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = Math.max(1, 7 / scale); // 스케일이 커지면 선이 얇아 보이므로 보정 (최소 1px)
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            const dashLength = Math.max(2, 10 / scale); // 스케일 따라 점선 간격 조절 (최소 2px)
            ctx.setLineDash([dashLength, dashLength]);
            ctx.stroke();

            ctx.restore(); // 저장된 상태 복원 (스케일 등)
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

    // --- 검색 API 호출 ---
    const handleSearch = async (event) => {
        const query = event.target.value;
        const currentBuilding = startNode ? startNode.building : urlBuilding;
        const currentFloor = startNode ? String(startNode.floor) : urlFloor?.replace('F', '');
        if (!query || !currentBuilding || !currentFloor) { searchResults.style.display = 'none'; return; }
        try {
            // API 요청 시 floor는 숫자 '1'로 보냄
            const response = await fetch(`${API_BASE_URL}/nodes/?query=${query}&building=${currentBuilding}&floor=${currentFloor}`);
            const nodes = await response.json(); // node 객체는 pixel_x, pixel_y 사용
            displaySearchResults(nodes);
        } catch (error) { console.error('검색 오류:', error); }
    };

    // --- 검색 결과 표시 ---
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

    // --- 사이드바 설정 ---
    const setupSidebar = (currentBuilding, currentFloor) => { // currentFloor는 DB의 숫자 '1'
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

    // --- 이벤트 리스너 설정 ---
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

    // --- AR 스캔 버튼 이벤트 ---
    if (arScanBtn) { // AR 버튼 존재 여부 확인
        arScanBtn.addEventListener('click', () => {
            if (startInput.disabled) {
                alert('출발지가 이미 QR/이미지 스캔으로 설정되었습니다. 새로고침 후 다시 시도해주세요.');
                return;
            }
            window.open('ar.html', 'AR Scanner', 'width=800,height=600');
        });
    }

    // --- AR 창으로부터 메시지 수신 ---
    window.addEventListener('message', (event) => {
        // 보안을 위해 origin 검사 추가 (필요시)
        // if (event.origin !== 'expected-origin') return;
        
        // 데이터 형식 확인
        if (event.data && typeof event.data === 'object') {
            const { type, data } = event.data;

            if (type === 'ar-scan-success') {
                const node = data; // node 객체는 pixel_x, pixel_y 사용
                if (node && node.name && typeof node.pixel_x === 'number' && typeof node.pixel_y === 'number') {
                    startNode = node;
                    startInput.value = `이미지 인식: ${node.name}`;
                    startInput.disabled = true;

                    // 스케일 업데이트 및 마커 위치 조정 (pixel_x, pixel_y 사용)
                    // setupMap -> onload -> updateScaleAndPositions -> updateMarkerPosition 순서로 호출됨
                    // 따라서 여기서는 UI 업데이트만 트리거
                    const floorString = String(node.floor).endsWith('F') ? node.floor : `${node.floor}F`;
                    buildingTitleBtn.textContent = `${node.building} - ${floorString}`;
                    setupSidebar(node.building, node.floor);
                    setupMap(node.building, node.floor); // 지도를 다시 로드하여 마커 위치 설정

                } else {
                    console.error("AR 스캔 데이터 형식이 잘못되었습니다:", data);
                    alert('잘못된 AR 스캔 데이터입니다.');
                }
            }
        }
    });


    // --- 초기 실행 로직 (QR ID 우선 처리) ---
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
