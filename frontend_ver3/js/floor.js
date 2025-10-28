document.addEventListener('DOMContentLoaded', () => {
    // --- 기본 설정 및 DOM 요소 가져오기 ---
    const API_BASE_URL = 'https://325721254205.ngrok-free.app/api/navigation';
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
    const arScanBtn = document.getElementById('ar-scan-btn');

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
    let scale = 1;
    const markerSpeed = 2;

    const params = new URLSearchParams(window.location.search);
    const building = params.get('building');
    const floor = params.get('floor');
    const qrId = params.get('qr_id');

    // QR ID로 노드 정보를 가져오는 함수
    const fetchNodeByQrId = async (qrId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/nodes/qr/${qrId}/`);
            if (!response.ok) throw new Error('해당 QR ID의 노드를 찾을 수 없습니다.');
            const node = await response.json();
            startNode = node;
            startInput.value = node.name;
            startInput.disabled = true;
            updateScaleAndPositions();
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };
    
    // --- 지도 설정 및 초기화 ---
    const setupMap = () => {
        const existingImg = mapContainer.querySelector('img');
        if (existingImg) existingImg.remove();
        
        floorMapImage = new Image();
        const mapImageUrl = `images/${building}_${floor}.png`;
        floorMapImage.src = mapImageUrl;

        floorMapImage.onload = () => {
            canvas.width = floorMapImage.naturalWidth;
            canvas.height = floorMapImage.naturalHeight;
            mapContainer.appendChild(floorMapImage);

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

    const updateScaleAndPositions = () => {
        if (!floorMapImage || !floorMapImage.naturalWidth) return;
        scale = floorMapImage.clientWidth / floorMapImage.naturalWidth;
        const imageRect = floorMapImage.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        const offsetX = imageRect.left - containerRect.left;
        const offsetY = imageRect.top - containerRect.top;
        canvas.style.left = `${offsetX}px`;
        canvas.style.top = `${offsetY}px`;
        canvas.style.width = `${imageRect.width}px`;
        canvas.style.height = `${imageRect.height}px`;
        const currentNode = (fullPath.length > 0) ? fullPath[pathIndex] : startNode;
        if (fullPath.length > 0) {
            const currentFloorPath = fullPath.filter(node => node.building === building && node.floor === floor);
            drawPath(currentFloorPath);
        }
        if (currentNode) {
            marker.style.left = `${offsetX + currentNode.pixel_x * scale}px`;
            marker.style.top = `${offsetY + currentNode.pixel_y * scale}px`;
            marker.style.display = 'block';
        }
    };

    // --- 길찾기 ---
    findPathBtn.addEventListener('click', async () => {
        if (!startNode || !destinationNode) {
            alert('출발지와 목적지를 모두 설정해주세요.'); return;
        }
        if (startNode.id === destinationNode.id) {
            alert('출발지와 목적지가 같습니다.'); return;
        }
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        try {
            const response = await fetch(`${API_BASE_URL}/pathfind/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start_node_id: startNode.id, end_node_id: destinationNode.id })
            });
            if (!response.ok) throw new Error('경로를 찾을 수 없습니다.');
            fullPath = await response.json();
            startPathAnimation();
        } catch (error) {
            console.error('길찾기 오류:', error); alert(error.message);
        }
    });

    // --- 경로 애니메이션 관련 함수 ---
    const startPathAnimation = () => {
        if (fullPath.length < 2) return;
        const currentFloorPath = fullPath.filter(node => node.building === building && node.floor === floor);
        drawPath(currentFloorPath);
        pathIndex = fullPath.findIndex(node => node.building === building && node.floor === floor);
        if (pathIndex === -1) return;
        updateScaleAndPositions();
        animateMarker();
    };

    const animateMarker = () => {
        if (pathIndex >= fullPath.length - 1) {
            alert("목적지에 도착했습니다!");
            return;
        }
        const currentPoint = fullPath[pathIndex];
        const nextPoint = fullPath[pathIndex + 1];

        if (currentPoint.is_transition) {
            handleTransition(currentPoint);
            return;
        }
        
        const imageRect = floorMapImage.getBoundingClientRect();
        const containerRect = mapContainer.getBoundingClientRect();
        const offsetX = imageRect.left - containerRect.left;
        const offsetY = imageRect.top - containerRect.top;

        const currentPos = {
            x: parseFloat(marker.style.left || 0),
            y: parseFloat(marker.style.top || 0)
        };
        const targetPos = {
            x: offsetX + nextPoint.pixel_x * scale,
            y: offsetY + nextPoint.pixel_y * scale
        };

        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < markerSpeed) {
            pathIndex++;
            updateScaleAndPositions();
            animationFrameId = requestAnimationFrame(animateMarker);
        } else {
            const moveX = currentPos.x + (dx / distance) * markerSpeed;
            const moveY = currentPos.y + (dy / distance) * markerSpeed;
            marker.style.left = `${moveX}px`;
            marker.style.top = `${moveY}px`;
            animationFrameId = requestAnimationFrame(animateMarker);
        }
    };

    const drawPath = (currentFloorPath) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (currentFloorPath.length < 2) return;

        ctx.save();
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.moveTo(currentFloorPath[0].pixel_x, currentFloorPath[0].pixel_y);
        currentFloorPath.slice(1).forEach(node => {
            ctx.lineTo(node.pixel_x, node.pixel_y);
        });

        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 7 / scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([10 / scale, 10 / scale]);
        ctx.stroke();

        ctx.restore();
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

    // --- AR 스캔 버튼 이벤트 ---
    arScanBtn.addEventListener('click', () => {
        if (startInput.disabled) {
            alert('출발지가 이미 QR/이미지 스캔으로 설정되었습니다. 새로고침 후 다시 시도해주세요.');
            return;
        }
        // 새 창 열기
        window.open('ar.html', 'AR Scanner', 'width=800,height=600');
    });
    
    // --- AR 창으로부터 메시지 수신 ---
    window.addEventListener('message', (event) => {
        const { type, data } = event.data;

        if (type === 'ar-scan-success') {
            const node = data;
            startNode = node;
            startInput.value = `이미지 인식: ${node.name}`;
            startInput.disabled = true;
            updateScaleAndPositions();
        }
    });

    window.addEventListener('resize', updateScaleAndPositions);
});