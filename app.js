// State variables
let activeTab = "characters";
let searchQuery = "";
let selectedElement = "전체";
let selectedRole = "전체";
let checkedItems = JSON.parse(localStorage.getItem("relink_checklist") || "{}");

// Elements List for filter
const ELEMENTS = ["전체", "화속성", "수속성", "풍속성", "토속성", "광속성", "암속성"];
const ROLES = ["전체", "딜러", "딜포터", "서포터", "올라운더"];

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Theme check
  const savedTheme = localStorage.getItem("relink_theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  }
  
  // Render Filters
  renderFilterButtons();
  
  // Initial Renders
  switchTab(activeTab);
  
  // Register Global Listeners
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    if (activeTab === "characters") {
      renderCharacters();
    } else if (activeTab === "databases") {
      renderDatabases();
    }
  });

  // Modal close trigger
  document.getElementById("detail-modal").addEventListener("click", (e) => {
    if (e.target.id === "detail-modal") {
      closeModal();
    }
  });
});

// Switch between tabs
function switchTab(tabId) {
  activeTab = tabId;
  
  // Update button active state
  document.querySelectorAll(".tab-btn-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  
  // Hide all panels
  document.getElementById("char-view-panel").style.display = "none";
  document.getElementById("roadmap-panel").style.display = "none";
  document.getElementById("db-panel").style.display = "none";
  document.getElementById("checklist-panel").style.display = "none";
  
  // Show active panel
  if (tabId === "characters") {
    document.getElementById("char-view-panel").style.display = "block";
    document.getElementById("filter-section").style.display = "flex";
    renderCharacters();
  } else if (tabId === "roadmap") {
    document.getElementById("roadmap-panel").style.display = "block";
    document.getElementById("filter-section").style.display = "none";
    renderRoadmap();
  } else if (tabId === "databases") {
    document.getElementById("db-panel").style.display = "block";
    document.getElementById("filter-section").style.display = "none";
    renderDatabases();
  } else if (tabId === "checklist") {
    document.getElementById("checklist-panel").style.display = "block";
    document.getElementById("filter-section").style.display = "none";
    renderChecklist();
  }
}

// Toggle Theme (Light / Dark)
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("relink_theme", isDark ? "dark" : "light");
}

// Render search filter tags
function renderFilterButtons() {
  const elemContainer = document.getElementById("element-filters");
  elemContainer.innerHTML = "";
  ELEMENTS.forEach(el => {
    const btn = document.createElement("button");
    btn.className = `tag-btn ${selectedElement === el ? "active" : ""}`;
    btn.innerText = el;
    btn.onclick = () => {
      selectedElement = el;
      document.querySelectorAll("#element-filters .tag-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderCharacters();
    };
    elemContainer.appendChild(btn);
  });

  const roleContainer = document.getElementById("role-filters");
  roleContainer.innerHTML = "";
  ROLES.forEach(role => {
    const btn = document.createElement("button");
    btn.className = `tag-btn ${selectedRole === role ? "active" : ""}`;
    btn.innerText = role;
    btn.onclick = () => {
      selectedRole = role;
      document.querySelectorAll("#role-filters .tag-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderCharacters();
    };
    roleContainer.appendChild(btn);
  });
}

// Render Character Cards
function renderCharacters() {
  const container = document.getElementById("char-grid-container");
  container.innerHTML = "";
  
  const filtered = RELINK_DATA.characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchQuery) ||
                          char.role.toLowerCase().includes(searchQuery) ||
                          (char.title && char.title.toLowerCase().includes(searchQuery));
    const matchesElement = selectedElement === "전체" || char.element === selectedElement;
    
    // Role filter handling (supporting partial role matches like "딜포터" under "딜러")
    let matchesRole = selectedRole === "전체";
    if (selectedRole === "딜러") {
      matchesRole = char.role.includes("딜러") || char.role.includes("딜포터") || char.role.includes("어택커") || char.role.includes("누커");
    } else if (selectedRole === "서포터") {
      matchesRole = char.role.includes("서포터") || char.role.includes("지원") || char.role.includes("탱커");
    } else if (selectedRole === "딜포터") {
      matchesRole = char.role.includes("딜포터");
    } else if (selectedRole === "올라운더") {
      matchesRole = char.role.includes("올라운더");
    }

    return matchesSearch && matchesElement && matchesRole;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
        검색 조건에 맞는 캐릭터가 없습니다. 다른 조건으로 검색해 보세요.
      </div>
    `;
    return;
  }

  filtered.forEach(char => {
    const card = document.createElement("div");
    card.className = "char-card glass-panel";
    card.onclick = () => openModal(char.id);

    const difficultyStars = "★".repeat(parseInt(char.difficulty.replace(/[^0-9]/g, '')) || 3);

    card.innerHTML = `
      <div>
        <div class="char-header">
          <div>
            <div class="char-name">${char.name}</div>
            <div class="char-title">${char.title || "그랑블루 파이터"}</div>
          </div>
          <div class="char-badge-container">
            <span class="char-badge">${char.element}</span>
            <span class="char-badge orange">${char.role}</span>
          </div>
        </div>
        <div class="char-desc">${char.desc}</div>
      </div>
      <div class="char-footer">
        <span>난이도: <span class="difficulty-stars">${difficultyStars}</span></span>
        <span style="font-weight: bold; color: var(--accent-color);">상세보기 ➡️</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Render Farming Roadmap
function renderRoadmap() {
  const timeline = document.getElementById("roadmap-timeline");
  timeline.innerHTML = "";
  
  // Static steps
  const steps = [
    { label: "1단계", title: "Very Hard ~ Extreme 한계돌파 개방", desc: "챕터 0 '롤란의 의뢰' 로컬 퀘스트를 클리어하고 캐릭터 한계돌파 시스템을 개방합니다. 딜러들의 크리티컬 확률 100% 확보를 목표로 삼는 시기입니다." },
    { label: "2단계", title: "Maniac 진입 & 각성 무기작 개시", desc: "보스들을 사냥해 한계돌파 핵심 재료인 '은천의 빛'을 파밍하고 각성 무기(어센션)를 제작하여 150레벨 풀강 및 대장간 10단계 각성을 달성합니다." },
    { label: "3단계", title: "Proud 진입 & 최종 궁극 무기 획득", desc: "최종 프라우드 난이도를 뚫고 '바하무트의 분노' 프로토 바하무트 퀘스트 뺑뺑이 루프를 돕니다. 최강인 터미너스(궁극) 무기를 획득하고 데미지 상한 65 진 세팅을 갖춥니다." },
    { label: "4단계", title: "확장팩 진입: 루시퍼 & 벨제붑 토벌전", desc: "종말의 비전 루시퍼를 처치하여 최고 등급인 '종말의 진(Dark Opus)'을 파밍합니다. 벨제붑을 처치하여 강력한 전용 유틸 시길을 획득합니다." },
    { label: "5단계", title: "종결: 무기 초월 및 DLC 최종 기어 완성", desc: "확장팩 보스 처치물인 '얼티메이트 메모리'를 사용해 프라우 등 DLC 무기를 대장간에서 최종 제작하고, 모든 종결급 무기의 한계를 200레벨로 확장하는 무기 초월을 개시합니다." }
  ];

  steps.forEach(step => {
    const item = document.createElement("div");
    item.className = "roadmap-step glass-panel";
    item.innerHTML = `
      <div class="step-label">${step.label}</div>
      <div class="step-content">
        <h3>${step.title}</h3>
        <p>${step.desc}</p>
      </div>
    `;
    timeline.appendChild(item);
  });

  // Render Quests
  const questContainer = document.getElementById("quest-grid-container");
  questContainer.innerHTML = "";
  RELINK_DATA.quests.forEach(q => {
    const card = document.createElement("div");
    card.className = "quest-card";
    card.innerHTML = `
      <h4>${q.name} <span class="badge">${q.difficulty}</span></h4>
      <p style="font-size: 12px; font-weight: bold; color: var(--text-secondary); margin-bottom: 5px;">주요 획득품: ${q.target}</p>
      <p style="font-size: 12.5px; color: var(--text-secondary);">${q.desc}</p>
    `;
    questContainer.appendChild(card);
  });
}

// Render Weapons & Sigils Databases
function renderDatabases() {
  const weaponList = document.getElementById("db-weapons-list");
  weaponList.innerHTML = "";
  RELINK_DATA.weapons.forEach(w => {
    const item = document.createElement("div");
    item.className = "db-item";
    item.innerHTML = `
      <strong>${w.name}</strong> <span class="badge">${w.type}</span>
      <p>${w.desc}</p>
    `;
    weaponList.appendChild(item);
  });

  const sigilList = document.getElementById("db-sigils-list");
  sigilList.innerHTML = "";
  
  const filteredSigils = RELINK_DATA.sigils.filter(s => {
    return s.name.toLowerCase().includes(searchQuery) || s.desc.toLowerCase().includes(searchQuery);
  });

  filteredSigils.forEach(s => {
    const item = document.createElement("div");
    item.className = "db-item";
    item.innerHTML = `
      <strong>${s.name}</strong> <span class="badge orange">${s.type}</span>
      <p>${s.desc}</p>
    `;
    sigilList.appendChild(item);
  });
}

// Render Farming Checklist
function renderChecklist() {
  const container = document.getElementById("checklist-wrapper-container");
  container.innerHTML = "";

  const items = [
    { id: "lvl100", label: "주력 4인 파티원 레벨 100 달성" },
    { id: "overmastery", label: "주 캐릭터 한계돌파 개방 및 옵션 뽑기" },
    { id: "stinger150", label: "크리티컬 확률 100%용 스팅어 무기 150레벨" },
    { id: "ascension150", label: "각성 무기 150레벨 도달" },
    { id: "ascension_awakened", label: "대장간 각성 단계 10단계 풀 돌파" },
    { id: "terminus_get", label: "최종 바하무트 궁극 무기(터미너스) 드롭 완료" },
    { id: "dmg_cap65", label: "데미지 상한 진 V 65레벨 풀셋팅 완성" },
    { id: "dark_opus", label: "루시퍼 토벌 후 종말의 진(Dark Opus) 장착" },
    { id: "transcendence200", label: "종결 장비 무기 초월 200레벨 달성" }
  ];

  items.forEach(item => {
    const div = document.createElement("div");
    const isChecked = checkedItems[item.id] ? "checked" : "";
    div.className = `check-item ${isChecked}`;
    div.onclick = () => toggleCheckItem(item.id);

    div.innerHTML = `
      <input type="checkbox" ${isChecked ? "checked" : ""} readonly>
      <span>${item.label}</span>
    `;
    container.appendChild(div);
  });
}

// Toggle checklist items
function toggleCheckItem(itemId) {
  checkedItems[itemId] = !checkedItems[itemId];
  localStorage.setItem("relink_checklist", JSON.stringify(checkedItems));
  renderChecklist();
}

// Open Detail modal for a character
function openModal(charId) {
  const char = RELINK_DATA.characters.find(c => c.id === charId);
  if (!char) return;

  document.getElementById("modal-char-name").innerText = char.name;
  document.getElementById("modal-char-title").innerText = char.title || "그랑블루 파이터";
  document.getElementById("modal-char-desc").innerText = char.desc;
  
  // Elements badge
  const elementContainer = document.getElementById("modal-badges");
  elementContainer.innerHTML = `
    <span class="char-badge">${char.element}</span>
    <span class="char-badge orange">${char.role}</span>
  `;

  // Render Grid Content (Card 1: 어빌리티 & 콤보)
  const card1 = document.getElementById("detail-card-1");
  card1.innerHTML = "<h3>어빌리티 & 핵심 조작법</h3>";
  if (char.skills && char.skills.length > 0) {
    const ul = document.createElement("ul");
    char.skills.forEach(skill => {
      ul.innerHTML += `<li><strong>${skill.name}</strong>: ${skill.desc}</li>`;
    });
    card1.appendChild(ul);
  } else {
    card1.innerHTML += "<p>스킬 쿨타임 주기 관리 및 평타-강공 연계 콤보가 주력입니다.</p>";
  }

  // Card 2: 무기 성장 테크트리
  const card2 = document.getElementById("detail-card-2");
  card2.innerHTML = "<h3>추천 무기 성장 테크트리</h3>";
  if (char.weapons) {
    card2.innerHTML += `
      <div class="weapon-box"><strong>[스팅어/치명타]</strong> ${char.weapons.stinger.name}<br><span style="color: var(--text-secondary);">${char.weapons.stinger.desc}</span></div>
      <div class="weapon-box"><strong>[각성/어센션]</strong> ${char.weapons.ascension.name}<br><span style="color: var(--text-secondary);">${char.weapons.ascension.desc}</span></div>
      <div class="weapon-box"><strong>[궁극/종결]</strong> ${char.weapons.terminus.name}<br><span style="color: var(--text-secondary);">${char.weapons.terminus.desc}</span></div>
    `;
  } else {
    card2.innerHTML += `
      <div class="weapon-box"><strong>[스팅어/치명타]</strong> 스팅어 무기 제작 (크리 확률 확보)</div>
      <div class="weapon-box"><strong>[각성/어센션]</strong> 각성 무기 제작 후 150레벨 각성작 진행</div>
      <div class="weapon-box"><strong>[궁극/종결]</strong> 궁극 무기(터미너스) 및 초월 강화 200레벨 진행</div>
    `;
  }

  // Card 3: 추천 진 세팅
  const card3 = document.getElementById("detail-card-3");
  card3.innerHTML = "<h3>추천 진(시길) 세팅</h3>";
  if (char.sigils && char.sigils.length > 0) {
    const ul = document.createElement("ul");
    char.sigils.forEach(sig => {
      ul.innerHTML += `<li><strong style="color: var(--accent-color);">${sig.priority}</strong> ${sig.name} - ${sig.desc}</li>`;
    });
    card3.appendChild(ul);
  } else {
    card3.innerHTML += `
      <ul>
        <li><strong>★1순위</strong> 데미지 상한 V (최종 65레벨 풀셋팅)</li>
        <li><strong>★2순위</strong> 크리티컬 확률 V (치명타 100% 확보용)</li>
        <li><strong>★3순위</strong> 혼신 / 폭군 (깡공 및 데미지 상한 도달용)</li>
      </ul>
    `;
  }

  // Card 4: 플레이 팁
  const card4 = document.getElementById("detail-card-4");
  card4.innerHTML = "<h3>플레이어 운용 vs AI 설정</h3>";
  if (char.id === "fraux") {
    card4.innerHTML += `
      <p><strong>메인 조작:</strong> 게이지가 충전된 '강렬한 힘' 상태에서 쿨타임이 없는 파워 플랜트를 최속 3연속 쏟아 붓는 조작이 절대적입니다.</p>
      <p style="margin-top: 8px;"><strong>AI 동료 기용:</strong> 스탠스 게이지 관리 성능이 AI 피지컬로도 훌륭하며 버프/디버프 서포팅 딜링력이 최정상급입니다.</p>
    `;
  } else if (char.id === "cagliostro") {
    card4.innerHTML += `
      <p><strong>메인 조작:</strong> 판타즈마고리아를 쿨마다 계속 유지해주면서 평타 3타 후 강공 콤보 피니시와 회피 캔슬 컬랩스를 꽂아 쿨타임을 좁힙니다.</p>
      <p style="margin-top: 8px;"><strong>AI 동료 기용:</strong> 파티 버프 및 즉발 원거리 부활(리조마타)을 빈사 시점마다 정확하게 지원해 매우 유용합니다.</p>
    `;
  } else if (char.id === "zeta") {
    card4.innerHTML += `
      <p><strong>메인 조작:</strong> 알베스 디버프 부여 후 공중에서 타이밍 점프 공격(일명 콩콩이)으로 높이 날며 콤보 루프를 잇는 컨트롤이 필요합니다.</p>
      <p style="margin-top: 8px;"><strong>AI 동료 기용:</strong> 공중 에어 루프 성공률이 거의 100%에 수렴하는 등 인간을 초월한 성능의 메인 딜러입니다.</p>
    `;
  } else if (char.id === "beatrix") {
    card4.innerHTML += `
      <p><strong>메인 조작:</strong> 마검 강화 돌입 후 어빌 ➡️ 강공격 루프를 연계하며 체력 바닥 시점에 임모탈리티 무적으로 안전을 확보합니다.</p>
      <p style="margin-top: 8px;"><strong>AI 동료 기용:</strong> 리스크 있는 체력 소모를 정확한 저스트 회피 피지컬로 커버하며 안정적인 딜량을 뿜어냅니다.</p>
    `;
  } else {
    card4.innerHTML += `
      <p><strong>메인 조작:</strong> 보스의 역할군에 맞는 포지션(딜러/탱커/버퍼)을 담당해 링크 게이지 및 오의 체인을 리드합니다.</p>
      <p style="margin-top: 8px;"><strong>AI 동료 기용:</strong> 기본 자버프 및 공격 스킬을 쿨마다 가동하며 스턴 옵션을 통해 파티의 링크 어택 기회를 벌어줍니다.</p>
    `;
  }

  // Play Tip Alert Box
  document.getElementById("modal-playtip").innerHTML = `
    <strong>💡 메인 컨트롤 팁:</strong> ${char.play_tip || "평타 공격 연타 후 특수 피니시 콤보를 꽂아 상시 데미지 상한선을 뽑아내는 안정적인 사냥 방식을 장착하십시오."}
  `;

  // Display Modal
  const modal = document.getElementById("detail-modal");
  modal.classList.add("active");
}

function closeModal() {
  const modal = document.getElementById("detail-modal");
  modal.classList.remove("active");
}
