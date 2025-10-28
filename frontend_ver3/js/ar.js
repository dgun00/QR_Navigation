document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://325721254205.ngrok-free.app/api/navigation';
    const statusText = document.getElementById('status-text');
    let isProcessing = false;

    // 인식 성공 시 처리하는 공통 함수
    const handleMarkerFound = async (qr_id) => {
        if (isProcessing) return;
        isProcessing = true;
        statusText.textContent = `'${qr_id}' 인식 완료! 위치 정보를 가져옵니다.`;

        try {
            // 백엔드에 이미지 이름을 보내 위치 정보 요청
            const response = await fetch(`${API_BASE_URL}/nodes/qr/${qr_id}/`);
            if (!response.ok) throw new Error('해당 이미지의 위치 정보를 찾을 수 없습니다.');
            
            const node = await response.json();

            // 부모 창(floor.html)으로 노드 데이터 전송
            if (window.opener) {
                window.opener.postMessage({ type: 'ar-scan-success', data: node }, '*');
            }
            
            statusText.textContent = '위치 설정 완료! 창을 닫습니다.';
            
            setTimeout(() => {
                window.close();
            }, 1000);

        } catch (error) {
            console.error(error);
            statusText.textContent = `오류: ${error.message}. 다시 스캔해주세요.`;
            isProcessing = false;
        }
    };

    // 각 마커에 대한 이벤트 리스너 설정
    const marker1 = document.querySelector('#marker1');
    const marker2 = document.querySelector('#marker2');

    marker1.addEventListener('markerFound', () => {
        console.log('첫 번째 마커(marker1)를 찾았습니다!');
        const imageUrl = marker1.getAttribute('url');
        const qr_id = imageUrl.split('/').pop(); 
        handleMarkerFound(qr_id);
    });

    marker2.addEventListener('markerFound', () => {
        console.log('두 번째 마커(marker2)를 찾았습니다!');
        const imageUrl = marker2.getAttribute('url');
        const qr_id = imageUrl.split('/').pop(); 
        handleMarkerFound(qr_id);
    });
});