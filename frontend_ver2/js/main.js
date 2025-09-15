document.addEventListener('DOMContentLoaded', () => {
    const buildingSelection = document.getElementById('building-selection');
    const quickAccessIconsContainer = document.getElementById('quick-access-icons');

    const buildings = {
        'A12': ['1F', '2F', '3F', '4F'],
        'A13': ['1F', '2F', '3F', '4F']
    };

    // 주요 시설 데이터 (아이콘 클래스는 Font Awesome 기준)
    const quickAccessItems = [
        { name: '학과사무실', icon: 'fa-circle-info', building: 'A동', floor: '1F' },
        { name: '화장실', icon: 'fa-restroom', building: 'A동', floor: '1F' },
        { name: '엘리베이터', icon: 'fa-elevator', building: 'A동', floor: '1F' }
    ];

    for (const building in buildings) {
        const card = document.createElement('div');
        card.className = 'building-card';

        const title = document.createElement('h2');
        title.textContent = building;
        card.appendChild(title);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'floor-buttons';

        buildings[building].forEach(floor => {
            const button = document.createElement('button');
            button.textContent = floor;
            button.onclick = () => {
                window.location.href = `floor.html?building=${building}&floor=${floor}`;
            };
            buttonContainer.appendChild(button);
        });

        card.appendChild(buttonContainer);
        buildingSelection.appendChild(card);
    }

    // 주요 시설 바로가기 아이콘 생성
    quickAccessItems.forEach(item => {
        const button = document.createElement('button');
        button.className = 'icon-btn';
        
        button.innerHTML = `
            <div class="icon-circle">
                <i class="fas ${item.icon}"></i>
            </div>
            <span>${item.name}</span>
        `;
        
        button.onclick = () => {
            // 클릭 시 목적지 이름과 건물, 층 정보를 URL에 담아 이동
            // 사용자는 출발지만 선택하면 바로 길을 찾을 수 있게 됩니다.
            // floor.js에서 destination 파라미터를 받아 처리하는 로직이 필요합니다.
            const destinationName = encodeURIComponent(item.name);
            window.location.href = `floor.html?building=${item.building}&floor=${item.floor}&destination=${destinationName}`;
        };

        quickAccessIconsContainer.appendChild(button);
    });
});