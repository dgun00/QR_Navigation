document.addEventListener('DOMContentLoaded', () => {
    // --- 기본 설정 및 DOM 요소 가져오기 ---
    const API_BASE_URL = 'http://127.0.0.1:8000/api/navigation';

    const mapContainer = document.getElementById('map-container');
    const marker = document.getElementById('marker');
    const startInput = document.getElementById('start-input');
    const destinationInput = document.getElementById('destination-input');
    const swapBtn = document.getElementById('swap-btn');
    const findPathBtn = document.getElementById('find-path-btn');
    const searchResults = document.getElementById('search-results');
    const canvas = document.getElementById('path-canvas');
    const ctx = canvas.getContext('2d');

    let startNode = null;
    let destinationNode = null;
    let activeInput = null; // 현재 활성화된 입력 필드 (startInput 또는 destinationInput)
    let floorMapImage = null;

    // --- URL 파라미터에서 정보 추출 ---
    const params = new URLSearchParams(window.location.search);
    const building = params.get('building');
    const floor = params.get('floor');
    const qrId = params.get('qr_id');

    // --- 지도 설정 및 초기화 ---
    const setupMap = () => {
        floorMapImage = new Image();
        const mapImageUrl = `images/${building}_${floor}.png`;
        floorMapImage.src = mapImageUrl;

        floorMapImage.onload = () => {
            canvas.width = floorMapImage.width;
            canvas.height = floorMapImage.height;
            mapContainer.prepend(floorMapImage);

            if (qrId) {
                fetchNodeByQrId(qrId);
            }
        };

        floorMapImage.onerror = () => {
            console.error(`${mapImageUrl}을 불러올 수 없습니다.`);
            mapContainer.textContent = '지도 이미지를 불러올 수 없습니다. images 폴더를 확인해주세요.';
        };
    };

    // --- QR ID로 노드 정보 가져오기 ---
    const fetchNodeByQrId = async (qrId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/nodes/qr/${qrId}/`);
            if (!response.ok) throw new Error('해당 QR ID의 노드를 찾을 수 없습니다.');
            const node = await response.json();

            // QR로 스캔한 위치를 출발지로 설정
            startNode = node;
            startInput.value = node.name;
            startInput.disabled = true; // QR 스캔 시 출발지 고정
            
            updateMarkerPosition(node.pixel_x, node.pixel_y);

        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };
    
    // 마커 위치 업데이트
    const updateMarkerPosition = (x, y) => {
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        marker.style.display = 'block';
    };


    // --- 검색 기능 ---
    const handleSearch = async (event) => {
        const query = event.target.value;
        if (!query) {
            searchResults.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/nodes/?query=${query}`);
            const nodes = await response.json();
            displaySearchResults(nodes);
        } catch (error) {
            console.error('검색 오류:', error);
        }
    };

    // 검색 결과 표시
    const displaySearchResults = (nodes) => {
        searchResults.innerHTML = '';
        const filteredNodes = nodes.filter(node => node.floor === floor);

        if(filteredNodes.length === 0){
             searchResults.style.display = 'none';
             return;
        }

        filteredNodes.forEach(node => {
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

    // 입력 필드 포커스 및 입력 이벤트 리스너
    startInput.addEventListener('focus', () => activeInput = startInput);
    destinationInput.addEventListener('focus', () => activeInput = destinationInput);
    startInput.addEventListener('input', handleSearch);
    destinationInput.addEventListener('input', handleSearch);


    // --- 출발지/목적지 전환 ---
    swapBtn.addEventListener('click', () => {
        // QR로 출발지가 고정된 경우는 제외
        if (startInput.disabled) return;

        [startNode, destinationNode] = [destinationNode, startNode];
        [startInput.value, destinationInput.value] = [destinationInput.value, startInput.value];
    });

    // --- 길찾기 ---
    findPathBtn.addEventListener('click', async () => {
        if (!startNode || !destinationNode) {
            alert('출발지와 목적지를 모두 설정해주세요.');
            return;
        }
        if (startNode.id === destinationNode.id) {
            alert('출발지와 목적지가 같습니다.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/pathfind/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_node_id: startNode.id,
                    end_node_id: destinationNode.id
                })
            });

            if (!response.ok) throw new Error('경로를 찾을 수 없습니다.');
            const pathNodes = await response.json();
            drawPath(pathNodes);

        } catch (error) {
            console.error('길찾기 오류:', error);
            alert(error.message);
        }
    });

    // 경로 그리기
    const drawPath = (path) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (path.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(path[0].pixel_x, path[0].pixel_y);
        path.slice(1).forEach(node => {
            ctx.lineTo(node.pixel_x, node.pixel_y);
        });
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([10, 10]); // 점선 효과
        ctx.stroke();
        
        // 마커를 경로의 시작점으로 이동
        updateMarkerPosition(path[0].pixel_x, path[0].pixel_y);
    };

    // --- 초기화 실행 ---
    if ((building && floor) || qrId) {
        setupMap();
    } else {
        mapContainer.innerHTML = '<h1>표시할 지도 정보가 없습니다.</h1><p>메인 화면에서 층을 선택하거나 QR코드를 스캔해주세요.</p>';
    }
});