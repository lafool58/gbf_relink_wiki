// State variables
let activeTab = "characters";
let searchQuery = "";
let selectedElement = "전체";
let selectedRole = "전체";
let checkedItems = JSON.parse(localStorage.getItem("relink_checklist") || "{}");
let activeChar = null;
let activePhaseIndex = 0;

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
    card.className = `char-card glass-panel ${char.id}`;
    card.onclick = () => openModal(char.id);

    const difficultyStars = char.difficulty || "★★★☆☆";
    const imagePath = `images/list_chara_${char.id}.png?v=3`;

    card.innerHTML = `
      <div class="char-card-img-wrapper">
        <img class="char-card-img" src="${imagePath}" alt="${char.name}" onerror="this.src='https://relink.granbluefantasy.jp/assets/images/common/common/characters/list_chara_gran.png'">
      </div>
      <div class="char-card-content">
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

  activeChar = char;
  activePhaseIndex = 0;

  document.getElementById("modal-char-name").innerText = char.name;
  document.getElementById("modal-char-title").innerText = char.title || "그랑블루 파이터";
  document.getElementById("modal-char-desc").innerText = char.desc;
  
  // Elements badge
  const elementContainer = document.getElementById("modal-badges");
  elementContainer.innerHTML = `
    <span class="char-badge">${char.element}</span>
    <span class="char-badge orange">${char.role}</span>
  `;

  // Render Phase Tabs
  const phaseTabs = document.getElementById("modal-phase-tabs");
  phaseTabs.innerHTML = "";
  
  const phaseNames = [
    "0단계: 스토리 진행 중",
    "1단계: 엔딩 직후",
    "2단계: 마니악 (Lv 100)",
    "3단계: Proud / 확장팩 진입",
    "4단계: 최종 종결 (초월 200)"
  ];

  phaseNames.forEach((name, idx) => {
    const btn = document.createElement("button");
    btn.className = `phase-tab-btn ${idx === activePhaseIndex ? "active" : ""}`;
    btn.innerText = name;
    btn.onclick = () => {
      activePhaseIndex = idx;
      document.querySelectorAll(".phase-tab-btn").forEach((b, bIdx) => {
        b.classList.toggle("active", bIdx === idx);
      });
      renderModalPhase();
    };
    phaseTabs.appendChild(btn);
  });

  // Render initial phase
  renderModalPhase();

  // Play Tip Alert Box
  document.getElementById("modal-playtip").innerHTML = `
    <strong>💡 메인 컨트롤 팁:</strong> ${char.play_tip || "평타 공격 연타 후 특수 피니시 콤보를 꽂아 상시 데미지 상한선을 뽑아내는 안정적인 사냥 방식을 장착하십시오."}
  `;

  // Display Modal
  const modal = document.getElementById("detail-modal");
  modal.classList.add("active");
}

// Render dynamic modal content based on selected phase index
function renderModalPhase() {
  if (!activeChar) return;
  const char = activeChar;
  const stepIdx = activePhaseIndex;

  // Build character specific or fallback stages
  let stageData = null;
  if (char.id === "fraux") {
    const frauxPhases = [
      {
        weapons: [
          { name: "화염의 권각 [스팅어 무기]", order: "1순위", rating: "9/10", desc: "스토리 6장 이후 대장간에서 제작 가능. 크리티컬 확률의 조기 확보에 도움을 줍니다." },
          { name: "데블 핑거 [수호 무기]", order: "2순위", rating: "8/10", desc: "기본 제공 및 쉬운 제작 난이도로, 초반 든든한 HP 체급을 늘려 보스전의 생존을 지원합니다." }
        ],
        skills: "인도미누스 (연계 강화 버프) & 올 다운 채용. 콤보 평타 공격의 기본 물리 피해와 생존을 유연하게 조율합니다.",
        sigils: [
          { name: "수호 V / IV", order: "1순위", rating: "10/10", sub: "체력 관련 가호", desc: "스토리 단계에서는 의문사 방지를 위한 체력 확보가 최우선입니다." },
          { name: "공격력 V / IV", order: "2순위", rating: "9/10", sub: "깡공 증가 진", desc: "초반 데미지 상한이 낮으므로 깡공격을 올려 잡몹전과 보스전의 클리어 타임을 단축시킵니다." },
          { name: "회피 성능 V", order: "3순위", rating: "8/10", sub: "가드 성능 V", desc: "안정적인 회피 거리 증가로 콤보 게이지 안전 충전을 보조." }
        ],
        focus: "메인 스토리 제1장 ~ 종장 클리어 단계. 캐릭터의 성장과 기본 액티브 스킬 조작 숙달에 집중합니다.",
        desc: "메인 시나리오를 밀고 있는 성장기입니다. 데미지 상한이나 전용 진의 셋팅을 전혀 신경 쓸 필요가 없으며, 체력(수호)과 공격력을 골고루 섞어 스토리 보스를 쾌적하게 클리어하는 것을 최우선 목표로 잡습니다."
      },
      {
        weapons: [
          { name: "화염의 권각 [스팅어 무기]", order: "1순위", rating: "10/10 (필수)", desc: "엔딩 직후 가장 먼저 150레벨까지 해금하여 크리티컬 발생 확률을 100%에 맞춰 평타 2타 후 강공격 콤보의 스탠스 게이지 수급 효율을 극대화합니다." },
          { name: "데블 핑거 [수호 무기]", order: "2순위", rating: "6/10 (생존용)", desc: "극초반 보스의 패턴 데미지를 버틸 피통이 부족할 때 대장간에서 즉시 임시 거치용으로 제작하여 착용합니다." }
        ],
        skills: "인도미누스 (연계 후딜 감소 자버프) & 올 다운 (방깎 디버프) 채용. 기본 콤보 딜링 상한선을 메우기 위한 보조형 어빌 세팅.",
        sigils: [
          { name: "크리티컬 확률 V", order: "1순위", rating: "10/10", sub: "가호 및 한돌 크리", desc: "스팅어 무기 기본 크리치와 융합하여 크리티컬 확률 100%를 즉시 맞춰 딜 분산을 방지." },
          { name: "데미지 상한 V", order: "2순위", rating: "9/10", sub: "깡공 혼신/폭군 진", desc: "이 구간에서는 상한 진은 1~2개(30레벨)만 가볍게 넣고, 깡공 혼신 진을 섞어 상한 딜에 안정적으로 도달하게 합니다." },
          { name: "혼신 V", order: "3순위", rating: "8/10", sub: "폭군 V / 결사 V", desc: "체력이 가득 찼을 때 피해량 보정이 가장 큰 고화력 가성비 딜진입니다." },
          { name: "포션 보유 수 V", order: "4순위", rating: "9/10", sub: "재생 V / 흡혈 V", desc: "회복 물약 개수를 2배로 증가시켜 초반 보스 패턴 미숙지로 인한 의문사를 완벽 방지." },
          { name: "수호 V", order: "5순위", rating: "7/10", sub: "방어 V / 체력 가호", desc: "체력을 최소 35,000 이상 맞추어 보스의 일격 끔살을 피하는 기본 피통 진." },
          { name: "회피 성능 V", order: "6순위", rating: "7/10", sub: "가드 성능 V", desc: "회피 연속 사용 횟수 및 무적 판정 시간을 늘려 안전한 게이지 충전을 보조." }
        ],
        focus: "VERY HARD 및 EXTREME 레벨에서 한계돌파 시스템을 개방하고, 프라우의 레벨을 100까지 차분하게 육성하며 무기 강화를 집중적으로 개시합니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapons: [
          { name: "천상무뢰 [각성 무기/어센션]", order: "1순위", rating: "9/10 (주력)", desc: "150레벨 풀강 및 대장간 10단계 풀각성 작업을 시작합니다. 깡공과 피통이 든든하게 올라 보스의 매운 대미지를 버틸 수 있게 지원합니다." },
          { name: "베가르드 권갑 [처단 무기/스턴]", order: "2순위", rating: "7/10 (기졸용)", desc: "보스의 그로기를 빠르게 유도해 아군의 링크 어택 시동을 돕는 유용한 유틸 무기." }
        ],
        skills: "파워 플랜트 (강렬한 힘 폭딜기) & 인도미누스 & 올 다운 구성. 콤보 피니시 후 R2 캔슬 컬랩스 연계로 쿨타임을 적극 회전시킵니다.",
        sigils: [
          { name: "정의의 전용 진", order: "1순위", rating: "10/10", sub: "대장간 전용 진 합성", desc: "프라우의 스탠스 충전 속도를 늘리고 어빌 쿨타임을 감소시키는 필수 시그니처 진." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "추가 대미지 V", desc: "3~4개 기용하여 데미지 상한을 45~50레벨 수준까지 끌어올립니다." },
          { name: "폭군 V", order: "3순위", rating: "9/10", sub: "혼신 V / 결사 V", desc: "피통 20% 감소의 패널티 대신, 상한선에 상시 도달하게 해주는 최고 효율의 딜진." },
          { name: "포션 보유 수 V", order: "4순위", rating: "9/10", sub: "흡혈 V", desc: "자가 회복 핵심 및 파티 세이빙 보조." },
          { name: "자동 부활 (Guts)", order: "5순위", rating: "8/10", sub: "근성 V / 수호 V", desc: "체력이 0이 되어도 버프 상실 없이 즉시 소생시켜 주는 최후의 1회용 보험." },
          { name: "스턴 V", order: "6순위", rating: "8/10", sub: "대체 진 없음", desc: "보스의 기절치를 폭증시켜 아군 링크 찬스를 앞당깁니다." }
        ],
        focus: "MANIAC 난이도 돌입 단계입니다. 화룡 및 성정수 뺑뺑이를 돌며 한계돌파 및 각성작에 필수적인 '은천의 빛'을 본격 수집합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapons: [
          { name: "데블 크로우 [최종 궁극/DLC]", order: "1순위", rating: "10/10 (최종)", desc: "대장간에서 루시퍼/벨제붑 처치 시 드롭되는 '얼티메이트 메모리'를 사용해 직접 수동 제작하는 최강의 최종 기어입니다." },
          { name: "천상무뢰 [각성 완수]", order: "2순위", rating: "8/10 (과도기)", desc: "최종 무기를 제작하고 풀강화하기 전까지 프라우드 보스전을 견인할 든든한 풀각성 무기." }
        ],
        skills: "파워 플랜트 & 인도미누스 & 데드랜즈 (오의 게이지 가속용) 구성. 보스의 폭딜 무력화 기믹 시점에 맞춰 파워 플랜트를 최속 3연타 스팸합니다.",
        sigils: [
          { name: "유리 속성 변환", order: "1순위", rating: "10/10", sub: "대체 불가", desc: "모든 보스를 역상성 약점으로 강제 찌르게 만드는 필수 사기 특수 진." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "공격력/상한 한돌", desc: "65레벨 풀셋 완성. 무기 스킬 강화로 제한을 완벽하게 풉니다." },
          { name: "추가 대미지 V", order: "3순위", rating: "9/10", sub: "혼신 / 결사 V", desc: "다단히트 콤보인 프라우의 실질 딜량을 확률적으로 20% 추가 상승시키는 최고 존엄 딜진." },
          { name: "정의의 인도+ (합성진)", order: "4순위", rating: "9/10", sub: "전용 진 V", desc: "전용 진에 고양이나 회피 성능이 2옵션으로 붙은 합성 시길을 장착합니다." },
          { name: "명경지수 V", order: "5순위", rating: "8/10", sub: "회피 성능 V", desc: "저스트 회피 시 무적 시간 부여와 동시에 오의 게이지를 즉시 대폭 채워주는 극딜 가속진." },
          { name: "근성 V (Aegis)", order: "6순위", rating: "8/10", sub: "수호 V / 방어 V", desc: "사망 데미지를 입어도 피 1을 남겨 무적 상태로 생존하게 하는 생존 시길." }
        ],
        focus: "Proud 최종 바하무트 토벌 및 루시퍼 진입 준비 기간입니다. 은천의 빛을 녹여 각성 무기 10단계 각성 완수를 최우선으로 진행합니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapons: [
          { name: "데블 크로우 [초월 200레벨]", order: "1순위", rating: "10+/10 (종결)", desc: "대장간 무기 초월 시스템을 개방해 200레벨까지 돌파 완료. 신급 스탯 보정 및 4번째 전용 합성 옵션 슬롯이 개방되는 압도적인 종결 상태." },
          { name: "궁극의 마겸 [터미너스 200]", order: "2순위", rating: "9/10 (대안)", desc: "초월이 완료된 궁극 바하무트 무기로, 세팅 유동성에 따라 데블 크로우의 좋은 대안이 됩니다." }
        ],
        skills: "파워 플랜트 & 인도미누스 & 데드랜즈 & 올 다운 고정. 링크 타임 상태 진입 시 쿨감 100%를 받아 파워 플랜트만 스팸하여 수백만 버스트 딜을 뿜어냅니다.",
        sigils: [
          { name: "종말의 진 감마 (Dark Opus)", order: "1순위", rating: "10/10", sub: "종말의 진 알파", desc: "루시퍼 처치 보상. 오의 배리어 보호막 보정과 함께 어빌리티 상한을 추가로 30% 더 확장." },
          { name: "종말의 진 베타", order: "2순위", rating: "10/10", sub: "종말의 진 감마", desc: "어빌리티 자체 피해 배율을 늘려 파워 플랜트 한 방 데미지를 극한으로 증강시킵니다." },
          { name: "추가 대미지 V+", order: "3순위", rating: "10/10", sub: "추가 대미지 V", desc: "유틸리티(포션 수/회피성능/고양)가 2옵션으로 붙은 최종 종결 진 세트." },
          { name: "유리 속성 변환", order: "4순위", rating: "10/10", sub: "대체 불가", desc: "필수 장착." },
          { name: "퀵 어빌리티 V", order: "5순위", rating: "9/10", sub: "맹렬 V", desc: "스킬의 재사용 대기시간을 강제로 0초대로 좁히는 핵심 쿨감 진." },
          { name: "명경지수 V+", order: "6순위", rating: "9/10", sub: "고양 V", desc: "저스트 회피 시 무적 연장 및 오의 게이지 충전을 보조하는 종결 진." }
        ],
        focus: "DLC Endless Ragnarok 최종 콘텐츠 정복. 무기 200렙 초월작 및 종말의 진 풀 강화를 완료하여 월드 랭커급 프라우를 완성합니다.",
        desc: "라그나로크 확장팩의 최종 루시퍼/벨제붑을 격파한 종결 상태입니다. 루시퍼가 드롭하는 종말의 진 2개를 채용해 추가 데미지 상한 30%를 더 뚫어주며, 200레벨 초월 무기의 압도적인 깡공을 기반으로 최종 스펙을 완성합니다."
      }
    ];
    stageData = frauxPhases[stepIdx];
  } else if (char.id === "cagliostro") {
    const cagliostroPhases = [
      {
        weapons: [
          { name: "베가르드 사수 [스팅어 무기]", order: "1순위", rating: "9/10", desc: "기본 크리티컬을 보조하여 초반 아군 딜러들의 크리 발생 및 딜 기여를 보충하는 징검다리 스태프." },
          { name: "우로보로스 [Ruins/동료 무기]", order: "2순위", rating: "8/10", desc: "무난한 기본 스펙을 올려주는 초반 징검다리 스태프." }
        ],
        skills: "판타즈마고리아 (공방크리 버프) 및 힐 스킬 채용. 스토리 진행 중 아군의 회복약 소모를 줄이고 생존력을 크게 올립니다.",
        sigils: [
          { name: "포션 보유 수 V", order: "1순위", rating: "10/10", sub: "재생 V / 흡혈 V", desc: "회복약 보유 개수를 늘려 안정적인 교전을 지원." },
          { name: "수호 V / IV", order: "2순위", rating: "9/10", sub: "피통 가호", desc: "힐러/버퍼로서 최우선 생존을 위한 피통 진." },
          { name: "공격력 V / IV", order: "3순위", rating: "8/10", sub: "폭군 V / 결사 V", desc: "테제베 등 기본 공격 스킬 딜 보강용." }
        ],
        focus: "메인 스토리 스토리 진행 중. 판타즈마고리아 전체 공방 버프 버스트 타이밍 익히기.",
        desc: "스토리 퀘스트 중 칼리오스트로의 역할은 든든한 아군 버퍼이자 서브 힐러입니다. 판타즈마고리아를 쿨마다 돌리고, 아군이 위험할 때 힐을 뿌려주는 기본 생존과 버프 순환을 손에 익히는 구간입니다."
      },
      {
        weapons: [
          { name: "베가르드 사수 [스팅어 무기]", order: "1순위", rating: "10/10 (필수)", desc: "초반 크리 확률 100% 세팅을 빠르게 구축하여, 아군 버프 판타즈마고리아 가동 시 딜 기여 크리 발생률을 보정하는 징검다리 스태프." },
          { name: "우로보로스 [Ruins/동료 무기]", order: "2순위", rating: "6/10 (대체용)", desc: "스팅어 제작 재료가 모자랄 때 대장간에서 임시 징검다리로 거쳐갈 때 유용한 스태프." }
        ],
        skills: "판타즈마고리아 (공방크리 30% 증가 버프) & 테제베 (광선 쿨감기) 필수 배치. 아군의 딜링 상한 안착을 돕는 보조 딜러 세팅.",
        sigils: [
          { name: "크리티컬 확률 V", order: "1순위", rating: "10/10", sub: "혼신 V / 폭군 V", desc: "스팅어 창과 연동해 100% 크리를 맞춰주고, 깡공 진을 섞어 판타즈마고리아가 켜졌을 때 상한 딜이 바로 나오게 보정합니다." },
          { name: "데미지 상한 V", order: "2순위", rating: "9/10", sub: "공격력 V", desc: "상한 1~2개(30레벨)만 가볍게 세팅하여, 초반 부족한 상한치를 미세 조정하는 데 집중합니다." },
          { name: "혼신 V", order: "3순위", rating: "8/10", sub: "폭군 V", desc: "버프와 맞물려 기본 데미지를 상한선 부근까지 도달시켜 주는 우수한 딜 진." },
          { name: "포션 보유 수 V", order: "4순위", rating: "9/10", sub: "재생 V", desc: "체력 회복 물약 보유량을 늘려 자신과 파티의 안정성을 보강합니다." },
          { name: "수호 V", order: "5순위", rating: "7/10", sub: "피통 가호", desc: "초반 보스에게 스치고 사망하는 빈사를 면할 수 있는 피통 확보." },
          { name: "가드 성능 V", order: "6순위", rating: "7/10", sub: "회피 성능 V", desc: "보스의 타격을 L1 가드로 안전하게 튕겨내며 어빌 게이지를 모으기 위한 기본 안전진." }
        ],
        focus: "초반 한계돌파 개방 직후 단계. 칼리오스트로의 평타 3타 후 강공격(ㅁㅁㅁㅅ) 회피 캔슬 리듬을 손에 익히는 연습에 치중합니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapons: [
          { name: "세이크리드 기어 [각성 무기/어센션]", order: "1순위", rating: "9/10 (각성)", desc: "150레벨 풀강 및 대장간 10단계 풀각성 개방. 버퍼로서의 안정적인 기본 피통을 제공하여 보스의 광역 패턴 시 의문사하는 빈도를 줄여줍니다." },
          { name: "무한의 열쇠 [스턴 무기]", order: "2순위", rating: "7/10 (유틸)", desc: "적 보스의 쉴드 스턴치를 빠르게 깎아내기 위한 보조 유틸용 스태프." }
        ],
        skills: "판타즈마고리아 & 테제베 & 알렉산드리아 (스턴 게이지 시동용) & 리조마타 (원거리 즉발 소생 필수 채용).",
        sigils: [
          { name: "극치의 진리", order: "1순위", rating: "10/10", sub: "대장간 전용 진 합성", desc: "피니시 적중 시 쿨타임 감소가 걸려 판타즈마고리아 공방크리 버프를 100% 상시 무한 유지하게 만드는 원동력." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "일반 딜진", desc: "데미지 상한 레벨을 45~50레벨로 맞추어 테제베의 타격당 데미지를 극대화." },
          { name: "자동 부활 (Guts)", order: "3순위", rating: "9/10", sub: "근성 / 수호 진", desc: "힐러/서포터가 급사하면 파티가 터지므로, 1순위 자가 생존용 보험 진을 장착합니다." },
          { name: "포션 보유 수 V", order: "4순위", rating: "9/10", sub: "흡혈 V", desc: "포션을 통한 아군 간접 세이빙 가속." },
          { name: "혼신 V", order: "5순위", rating: "8/10", sub: "폭군 V", desc: "체력이 상시 높은 칼리오스트로와 어울리는 강력한 딜진." },
          { name: "수호 V", order: "6순위", rating: "7/10", sub: "Aegis V", desc: "기본 피통을 든든하게 메워주는 서포터 필수 생존 시길." }
        ],
        focus: "매니악 난이도에서 MSP 마나 포인트와 은천의 빛을 파밍하여, 콤보 쿨감 전용진 제작 및 주력 파티원 성장을 견인합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapons: [
          { name: "범천 세이크리드 기어 [궁극 무기/터미너스]", order: "1순위", rating: "10/10 (최종)", desc: "프로토 바하무트 드롭. 최종 궁극 무기이며, 공격력 버프와 맞물려 칼리오스트로의 참격 딜링 포텐셜을 폭발적으로 상승시킵니다." },
          { name: "세이크리드 기어 [각성 완수]", order: "2순위", rating: "8/10 (과도기)", desc: "바하무트 궁극 무기 획득 전에 전천후로 활용할 수 있는 완성형 풀각성 무기." }
        ],
        skills: "판타즈마고리아 & 테제베 & 알렉산드리아 & 리조마타 구성. 판타즈마고리아를 계속 켜며 적 스턴치가 쌓였을 때 오의 체인을 시작합니다.",
        sigils: [
          { name: "유리 속성 변환", order: "1순위", rating: "10/10", sub: "대체 불가", desc: "서포터도 준수한 딜을 넣게 만들어주는 개사기 진. 테제베 광선과 조화가 매우 훌륭합니다." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "퀵 어빌리티 V", desc: "65레벨 풀셋팅 완성. 퀵 어빌리티 진을 추가로 섞어 전용 진과 쿨감 역시너지를 극대화합니다." },
          { name: "추가 대미지 V", order: "3순위", rating: "9/10", sub: "폭군 V", desc: "다단 히트 광선 딜의 딜 누수를 추가 타격으로 완벽 보완." },
          { name: "극치의 인도+ (합성진)", order: "4순위", rating: "9/10", sub: "전용 진 V", desc: "전용 진에 오의 게이지 상승인 고양 V가 결합된 최종급 전용 합성진." },
          { name: "명경지수 V", order: "5순위", rating: "8/10", sub: "회피 성능 V", desc: "저스트 회피를 통해 오의 게이지를 급속 충전해 아군과의 4체인 발동을 서포트." },
          { name: "근성 V", order: "6순위", rating: "8/10", sub: "자동 부활 V", desc: "치명적인 피해를 1 남기고 무적 상태로 넘기는 생존 필수템." }
        ],
        focus: "Proud 보스 토벌 및 터미너스 궁극 무기 획득을 노리는 시기입니다. 65레벨 상한을 다 맞춘 4인 덱 세팅을 정밀 설계합니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapons: [
          { name: "범천 세이크리드 기어 [초월 200레벨]", order: "1순위", rating: "10+/10 (종결)", desc: "DLC 라그나로크 최종 무기 초월 200레벨 달성. 막대한 기본 체급 보정 및 추가 슬롯이 열려 최종 버스트 유틸을 지원합니다." },
          { name: "황천무뢰 [DLC 제작 무기]", order: "2순위", rating: "9/10 (대안)", desc: "얼티메이트 메모리를 활용해 제작하는 고스탯의 DLC 특화 창." }
        ],
        skills: "판타즈마고리아 & 테제베 & 알렉산드리아 & 리조마타 고정. 아군 부활 및 상시 공방 30% 증가 버프로 전장을 안정적으로 리드합니다.",
        sigils: [
          { name: "종말의 진 알파 (Dark Opus)", order: "1순위", rating: "10/10", sub: "종말의 진 감마", desc: "루시퍼 처치 보상. 파티 버스트 가속 코드 진을 섞어, 칼리오스트로 오의 발동 시 파티원 전체 오의 게이지를 추가 가속합니다." },
          { name: "종말의 진 감마", order: "2순위", rating: "10/10", sub: "종말의 진 알파", desc: "오의 배리어 보호막 보정과 함께 어빌리티 상한을 추가로 30% 더 확장." },
          { name: "추가 대미지 V+", order: "3순위", rating: "10/10", sub: "추가 대미지 V", desc: "유틸리티(포션 수/회피성능/고양)가 2옵션으로 붙은 최종 종결 진 세트." },
          { name: "유리 속성 변환", order: "4순위", rating: "10/10", sub: "대체 불가", desc: "필수 장착." },
          { name: "퀵 어빌리티 V", order: "5순위", rating: "9/10", sub: "맹렬 V", desc: "전용 진과 융합하여 판타즈마고리아의 쿨타임을 15초 미만으로 단축시킵니다." },
          { name: "명경지수 V+", order: "6순위", rating: "9/10", sub: "수호 V / 고양 V", desc: "저스트 회피 무적 시간과 가드를 늘려 루시퍼/벨제붑의 난해한 즉사 장판 공격을 손쉽게 대처하는 유틸 완성 셋팅." }
        ],
        focus: "최종 DLC 종결 정복. 200레벨 초월작 완수 및 파티 시너지 진 도배로 아군의 클리어 타임을 분 단위로 단축시킵니다.",
        desc: "라그나로크 확장팩의 최종 루시퍼/벨제붑을 격파한 종결 상태입니다. 루시퍼가 드롭하는 종말의 진 2개를 채용해 추가 데미지 상한 30%를 더 뚫어주며, 200레벨 초월 무기의 압도적인 깡공을 기반으로 최종 스펙을 완성합니다."
      }
    ];
    stageData = cagliostroPhases[stepIdx];
  } else if (char.id === "zeta") {
    const zetaPhases = [
      {
        weapons: [
          { name: "브리오낙 [스팅어 무기]", order: "1순위", rating: "9/10", desc: "공중 참격이 치명타로 터질 확률을 늘려 빠른 고속 딜을 지원하는 초반 핵심 창." },
          { name: "황금의 삼지창 [처단 무기/스턴]", order: "2순위", rating: "8/10", desc: "보스의 기절치를 보충하여 초반 링크 어택 기회를 확대시키는 보조 창." }
        ],
        skills: "인피니트 원더즈 (알베스 표식 부여용) & 알베스의 공명 (공중 돌진기) 필수 배치. 표식 디버프 ➡️ 도약 ➡️ 공중 콤보 연계를 연습하는 단계.",
        sigils: [
          { name: "수호 V / IV", order: "1순위", rating: "10/10", sub: "체력 관련 가호", desc: "공중 피격 시의 추락 의문사 방지용 최우선 체력 진." },
          { name: "공격력 V / IV", order: "2순위", rating: "9/10", sub: "혼신 V / 폭군 V", desc: "공중 참격의 기본 피해 배율을 든든하게 메워주는 깡공 진." },
          { name: "회피 성능 V", order: "3순위", rating: "8/10", sub: "가드 성능 V", desc: "공중 연타 중 긴급 R2 회피 연계를 부드럽게 지원." }
        ],
        focus: "메인 스토리 시나리오 극초반~엔딩 직전. 공중 낙하 콤보 타이밍(번쩍일 때 타격) 적응.",
        desc: "제타의 꽃인 공중 연속 타격을 연습하는 단계입니다. 스토리 보스들은 패턴이 비교적 단순하므로, 공중으로 도약한 뒤 불빛이 번쩍이는 저스트 타이밍에 맞춰 평타 공격을 명중시켜 공중 콩콩이 연속 참격 콤보를 손에 익히는 데 집중합니다."
      },
      {
        weapons: [
          { name: "브리오낙 [스팅어 무기]", order: "1순위", rating: "10/10 (필수)", desc: "공중 체공 연속 공격(콩콩이) 콤보가 상시 크리티컬로 명중해 딜 편차를 없애기 위한 징검다리 필수 크리 창." },
          { name: "황금의 삼지창 [처단 무기/스턴]", order: "2순위", rating: "6/10 (대안)", desc: "스팅어 무기 제작 전까지 적 보스를 기절 그로기로 눕히기 위한 유용한 창." }
        ],
        skills: "인피니트 원더즈 (알베스 표식 부여용) & 알베스의 공명 (공중 돌진기) 필수 배치. 표식 디버프 ➡️ 도약 ➡️ 공중 콤보 연계를 연습하는 단계.",
        sigils: [
          { name: "크리티컬 확률 V", order: "1순위", rating: "10/10", sub: "혼신 V / 폭군 V", desc: "스팅어 창과 융합하여 체공 콤보 크리 발생률을 보장하고 깡공 진을 섞어 데미지를 상한치로 밀어 올립니다." },
          { name: "데미지 상한 V", order: "2순위", rating: "9/10", sub: "스턴 V 1개", desc: "상한 1~2개(30레벨)만 가볍게 채용하며 공중 루프 도중 보스의 그로기 타격을 유도하기 위한 스턴치를 우선 확보합니다." },
          { name: "혼신 V", order: "3순위", rating: "8/10", sub: "폭군 V / 어택커 진", desc: "피통 피해 없이 공중 참격의 위력을 상한까지 배정하는 가성비 진." },
          { name: "포션 보유 수 V", order: "4순위", rating: "9/10", sub: "체력 가호 V", desc: "물약 충전은 기본 소양. 공중 도약 실패 시 입는 피해 복구용." },
          { name: "수호 V", order: "5순위", rating: "7/10", sub: "Aegis V", desc: "피통 3만 선을 확보하여 끔살 패턴을 방지합니다." },
          { name: "회피 성능 V", order: "6순위", rating: "7/10", sub: "명경지수 V", desc: "공중으로 뛰기 전 지상 장판 공격을 손쉽게 대처하는 유동 회피 보조." }
        ],
        focus: "초반 공중 콤보 리듬 획득 단계. 인피니트 빔 ➡️ 공명 돌진 ➡️ 타이밍 점프 공격 버튼 연타의 손맛과 피지컬을 조절하는 시기입니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapons: [
          { name: "알베스의 창 [각성 무기/어센션]", order: "1순위", rating: "9/10 (주력)", desc: "150레벨 풀강 및 대장간 10단계 풀각성 달성. 제타의 깡공을 수직 상승시켜 공중 콤보 단발당 상한 도달률을 대폭 끌어올려 줍니다." },
          { name: "투기용 창 [동료 무기]", order: "2순위", rating: "7/10 (대체)", desc: "각성 재료 은천의 빛 파밍이 고달플 때 대장간에서 높은 수치로 거쳐갈 수 있는 무기." }
        ],
        skills: "인피니트 원더즈 & 알베스의 공명 & 렐름스 마제스티 (적 광역 패턴 튕겨내기 반격기) & 시그노 드라이브 (공격력 증가).",
        sigils: [
          { name: "홍련의 날개 (전용 진)", order: "1순위", rating: "10/10", sub: "스턴 V 2개", desc: "피니시 적중 시 공격/크리 대폭 상승 전용진 장착. 스턴 V를 본격 2개 이상 배치해 보스의 기절치를 급속 충전합니다." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "연계 공격 V", desc: "상한 3~4개 장착하여 45~50레벨 상한을 확보, 콩콩이 딜 누수를 방지합니다." },
          { name: "스턴 V", order: "3순위", rating: "9/10", sub: "고양 V", desc: "제타의 스턴치 누적 능력을 배가시켜 보스를 끊임없이 그로기로 눞힙니다." },
          { name: "포션 보유 수 V", order: "4순위", rating: "9/10", sub: "흡혈 V", desc: "회복량 서포트." },
          { name: "자동 부활", order: "5순위", rating: "8/10", sub: "근성 V", desc: "낙사나 보스의 폭발에 쓸려 사망하는 위기를 1회 소생시키는 안전 진." },
          { name: "혼신 V", order: "6순위", rating: "8/10", sub: "폭군 V", desc: "체공 시 피격이 적은 제타 특성상 항시 높은 딜 보정을 받는 최고 옵션." }
        ],
        focus: "매니악 파밍 단계. 스턴 수치를 극한으로 세팅하여, AI 동료로 세웠을 때 보스가 일어서지 못하도록 눕히는 링크 머신으로 육성합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapons: [
          { name: "게이볼그 [궁극 무기/터미너스]", order: "1순위", rating: "10/10 (최종)", desc: "프로토 바하무트 드롭. 제타의 최종 종결 궁극 무기이며, 공중 루프 한 발당 화력을 사기적인 영역까지 끌어올립니다." },
          { name: "알베스의 창 [각성 완수]", order: "2순위", rating: "8/10 (대안)", desc: "바하무트 창 획득 전에 제타의 모든 콤보 화력을 온전히 투사해주는 풀각성 무기." }
        ],
        skills: "인피니트 원더즈 & 알베스의 공명 & 렐름스 마제스티 & 시그노 드라이브 구성. 보스가 날리는 광역기를 카운터 렐름스로 씹으며 맞공격을 날립니다.",
        sigils: [
          { name: "유리 속성 변환", order: "1순위", rating: "10/10", sub: "대체 불가", desc: "상성 무관 약점 딜 보정. 추가 대미지 V 3개 조합과 결합하여 공중 콩콩이 참격 한 발 한 발을 우주급으로 강화시킵니다." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "한계돌파 크리 20%", desc: "65레벨 풀셋팅 필수 도달. 한돌로 크리를 당겨와 남은 진 슬롯에 배수/포션/자동부활을 든든하게 다집니다." },
          { name: "추가 대미지 V", order: "3순위", rating: "9/10", sub: "결사 V", desc: "마검 저스트 평강공 한 타 한 타마다 20%의 추가 딜을 폭발시킵니다." },
          { name: "홍련의 인도+ (합성진)", order: "4순위", rating: "9/10", sub: "전용 진 V", desc: "전용 진에 오의 게이지 상승인 고양 V가 결합된 최종급 전용 합성진." },
          { name: "명경지수 V", order: "5순위", rating: "8/10", sub: "회피 성능 V", desc: "회피/렐름스 반격 저스트 성공 시 무적 부여 및 쿨타임을 급속 충전하는 코어 진." },
          { name: "근성 V", order: "6순위", rating: "8/10", sub: "자동 부활 V", desc: "의문사를 막아줄 최종 생존 진." }
        ],
        focus: "Proud 난이도 프로토 바하무트 토벌작 개시. 각성 무기 10단계 완수를 거쳐 최종 바하무트 무기를 획득하는 데 집중합니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapons: [
          { name: "게이볼그 [초월 200레벨]", order: "1순위", rating: "10+/10 (종결)", desc: "DLC 라그나로크 최종 무기 초월 200레벨 달성. 공중 에어 콤보의 물리 타격 데미지를 무지막지하게 보정하며 최종 옵션 슬롯을 확보합니다." },
          { name: "천상창 [DLC 제작 무기]", order: "2순위", rating: "9/10 (대안)", desc: "얼티메이트 메모리를 활용해 제작하는 고스탯의 DLC 특화 창." }
        ],
        skills: "인피니트 원더즈 & 알베스의 공명 & 렐름스 마제스티 & 시그노 드라이브 고정. 루시퍼의 공중 패턴을 함께 날아오르며 요격합니다.",
        sigils: [
          { name: "종말의 진 알파 (Dark Opus)", order: "1순위", rating: "10/10", sub: "종말의 진 감마", desc: "루시퍼 처치 보상. 에어 콤보 어빌리티 상한을 추가 돌파하고, 오의 발동 시 파티 시너지를 극대화하는 최종 종결 셋팅." },
          { name: "종말의 진 감마", order: "2순위", rating: "10/10", sub: "종말의 진 알파", desc: "오의 베리어 실드 부여 옵션을 탑재하여 공중 생존와 오의 딜 상한을 동시에 보정." },
          { name: "추가 대미지 V+", order: "3순위", rating: "10/10", sub: "추가 대미지 V", desc: "유틸리티(포션 수/회피성능/고양)가 2옵션으로 붙은 최종 종결 진 세트." },
          { name: "유리 속성 변환", order: "4순위", rating: "10/10", sub: "대체 불가", desc: "필수 장착." },
          { name: "명경지수 V+", order: "5순위", rating: "9/10", sub: "수호 V / 고양 V", desc: "공중 카운터 및 지상 저스트 회피 시 쿨다운과 무적 시간을 대폭 연장시켜 안전성과 극딜 순환율을 100% 채워줍니다." },
          { name: "퀵 어빌리티 V", order: "6순위", rating: "9/10", sub: "맹렬 V", desc: "지상/공중 콤보 피니시 쿨타임 단축과 함께 시너지를 내는 최상급 쿨감 시길." }
        ],
        focus: "DLC 라그나로크 최종 정복. 200레벨 무기 초월작 및 루시퍼 종말의 진 풀강을 달성하여 최강 제타 육성을 완성합니다.",
        desc: "라그나로크 확장팩의 최종 루시퍼/벨제붑을 격파한 종결 상태입니다. 루시퍼가 드롭하는 종말의 진 2개를 채용해 추가 데미지 상한 30%를 더 뚫어주며, 200레벨 초월 무기의 압도적인 깡공을 기반으로 최종 스펙을 완성합니다."
      }
    ];
    stageData = zetaPhases[stepIdx];
  } else if (char.id === "beatrix") {
    const beatrixPhases = [
      {
        weapons: [
          { name: "엠블럭스의 검 [스팅어 무기]", order: "1순위", rating: "9/10", desc: "저스트 타이밍 피니시의 치명타 확률을 올려 초반 교전 속도를 크게 단축시키는 크리티컬 특화 대검." },
          { name: "다크 액스 [처단 무기/스턴]", order: "2순위", rating: "8/10", desc: "제작이 쉽고 무난하게 스펙을 깡으로 올려주는 초반 징검다리 무기." }
        ],
        skills: "임모탈리티 (자가 무적기) 필수 채용. 피를 깎아 맞딜을 하는 베아트리스의 급사 리스크를 최우선 차단합니다.",
        sigils: [
          { name: "포션 보유 수 V", order: "1순위", rating: "10/10", sub: "대체 불가", desc: "자가 체력 소모량이 극심한 베아트리스에게 절대적으로 필요한 1순위 생존 시길." },
          { name: "수호 V / IV", order: "2순위", rating: "9/10", sub: "체력 관련 가호", desc: "배수 셋팅이 완비되기 전, 기본 안전 체력 한도를 확보하기 위한 HP 진." },
          { name: "공격력 V / IV", order: "3순위", rating: "8/10", sub: "혼신 V / 폭군 V", desc: "저스트 콤보 공격 한 타 한 타의 공격 배율 체급을 올립니다." }
        ],
        focus: "메인 스토리 진행 중. 저스트 타이밍 평타 강공격 피니시 연계 조작 숙련.",
        desc: "체력 소모와 저스트 입력을 동시에 챙겨야 하는 중급자용 캐릭터입니다. 스토리 구간에서는 피통이 늘 요동치므로, 위험할 때 임모탈리티 무적을 즉시 켜고 평타 저스트 타이밍에 맞춰 ㅅ 버튼을 꽂아 마검 강화 콤보를 연습합니다."
      },
      {
        weapons: [
          { name: "엠블럭스의 검 [스팅어 무기]", order: "1순위", rating: "10/10 (필수)", desc: "마검 저스트 공격 시 치명타 발생률을 확보하기 위한 크리티컬 특화 징검다리 대검. 초반 마스터리 해금 전 필수 장비." },
          { name: "다크 액스 [처단 무기/스턴]", order: "2순위", rating: "6/10 (대체용)", desc: "스팅어 대검이 만들어지기 전 거치용 대장간 검." }
        ],
        skills: "제피로스 (마검 게이지 즉시 충전 난무) & 임모탈리티 (자가 무적기) 배치. 자가 체력 소모를 제피로스 충전 후 강공 저스트 공격으로 빠르게 극복하는 연습기.",
        sigils: [
          { name: "크리티컬 확률 V", order: "1순위", rating: "10/10", sub: "배수 V / 포션 보유 V", desc: "크리 100% 셋팅 및 자가 체력 리스크 방지를 위한 포션 보유 수 장착. 피가 깎였을 때 폭딜을 내는 배수 V 1개 채용." },
          { name: "데미지 상한 V", order: "2순위", rating: "9/10", sub: "체력 V", desc: "상한 진 1개만 임시 기용. 초반 낮은 피통 리스크를 보완하기 위한 가성비 위주 세팅." },
          { name: "배수 V (Enmity)", order: "3순위", rating: "8/10", sub: "결사 V", desc: "피가 자주 깎이는 베아트리스 전용 최고 등급 딜 보조진." },
          { name: "포션 보유 수 V", order: "4순위", rating: "9/10", sub: "흡혈 V", desc: "마검 폭딜 도중 소모되는 체력을 즉시 100% 복구할 코어 포션 진." },
          { name: "수호 V", order: "5순위", rating: "7/10", sub: "피통 가호", desc: "체력이 1로 버텨도 기본 피통 한계선이 높아야 급사하지 않습니다." },
          { name: "회피 성능 V", order: "6순위", rating: "7/10", sub: "가드 성능 V", desc: "저스트 공격 리듬 중 위험 패턴 긴급 회피 무적 보조." }
        ],
        focus: "초반 마검 저스트 타이밍 습득 단계. 제피로스로 게이지를 채운 뒤, 어빌 가동 후 정확한 저스트 ㅅ 공격 손맛을 습득하는 구간입니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapons: [
          { name: "에라스티아 [각성 무기/어센션]", order: "1순위", rating: "9/10 (주력)", desc: "150레벨 풀강 및 대장간 10단계 풀각성 달성. 마검 폭딜 수치와 함께 자가 피소모 리스크를 견딜 든든한 깡체력을 대폭 늘려주는 주력 검." },
          { name: "불멸의 수호검 [수호 무기/체력]", order: "2순위", rating: "6/10 (방어용)", desc: "각성 무기가 개방되기 전 피통 위주의 안정적 성장을 돕는 방어용 무기." }
        ],
        skills: "제피로스 & 임모탈리티 & 재밍 (이동 및 회피 무적 시간 버프) & 다크 익스플로전 (방깎 광역 폭발).",
        sigils: [
          { name: "불멸의 신념", order: "1순위", rating: "10/10", sub: "대장간 전용 진 합성", desc: "콤보 공격 시 게이지 소모를 줄이는 전용 진 장착. 피통 상태에 상관없이 균일하게 상한을 치도록 배수와 혼신을 결합해 깡딜을 뻥튀기합니다." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "연계 공격 V", desc: "3~4개 기용하여 데미지 상한 레벨 45를 구축, 마검 참격의 최대 피해량을 해방." },
          { name: "배수 V", order: "3순위", rating: "9/10", sub: "폭군 V", desc: "낮은 체력일수록 공격력을 증폭하여 자가 소모 리스크를 하이리턴으로 메웁니다." },
          { name: "포션 보유 수 V", order: "4순위", rating: "9/10", sub: "흡혈 V", desc: "베아트리스의 제1 생명줄. 포션 수 V를 장착해 수시로 안전 피통 범위를 수동 복구합니다." },
          { name: "자동 부활 V", order: "5순위", rating: "8/10", sub: "근성 V", desc: "마검 자폭 피해 및 의사 사망 시 즉시 소생 시켜주는 핵심 생존 보험." },
          { name: "수호 V", order: "6순위", rating: "7/10", sub: "Aegis V", desc: "체력 4만 선 돌파용 코어 시길." }
        ],
        focus: "매니악 난이도 구간입니다. 한계돌파 개방 및 은천의 빛을 모아 에라스티아 각성 10단계를 빠르게 끝마치는 데 집중합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapons: [
          { name: "플로렌시아 [궁극 무기/터미너스]", order: "1순위", rating: "10/10 (최종)", desc: "프로토 바하무트 드롭 최종 대검. 베아트리스의 마검 강화 상태 저스트 참격 딜링을 리링크 한계 데미지 상한선까지 수직 상승시킵니다." },
          { name: "에라스티아 [각성 완수]", order: "2순위", rating: "8/10 (대안)", desc: "최종 무기를 제작하고 파밍하는 단계에서 보스 카운터 딜을 충분히 메워줄 풀각성 장비." }
        ],
        skills: "제피로스 & 임모탈리티 & 재밍 & 다크 익스플로전 구성. 적의 맹공 기믹 때 임모탈리티 무적을 키고 맞공격 대칭 딜을 전개합니다.",
        sigils: [
          { name: "유리 속성 변환", order: "1순위", rating: "10/10", sub: "대체 불가", desc: "상성 우위 강제 속성 변환. 추가 대미지 V 3개와 결합해 저스트 타이밍 참격 한 방 한 방의 폭발력을 전 딜러 중 최강급으로 메웁니다." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "한계돌파 크리 20%", desc: "65레벨 풀셋팅 도달. 한돌로 크리를 당겨와 남은 진 슬롯에 배수/포션/자동부활을 든든하게 다집니다." },
          { name: "추가 대미지 V", order: "3순위", rating: "9/10", sub: "결사 V", desc: "마검 저스트 평강공 한 타 한 타마다 20%의 추가 딜을 폭발시킵니다." },
          { name: "불멸의 인도+ (합성진)", order: "4순위", rating: "9/10", sub: "전용 진 V", desc: "전용 진과 함께 오의 게이지 수급(고양 V)이 합쳐진 최고의 합성진 기용." },
          { name: "명경지수 V", order: "5순위", rating: "8/10", sub: "회피 성능 V", desc: "저스트 회피 시 무적 부여 및 전체 쿨타임을 회복하는 코어 유틸 진." },
          { name: "근성 V", order: "6순위", rating: "8/10", sub: "자동 부활 V", desc: "사망 직전 피 1 무적 소생을 돕는 필수 생존 진." }
        ],
        focus: "Proud 최종 단계 및 루시퍼 진입 장벽 돌파. 각성 무기 10단계 완수 후 최종 바하무트 터미너스 무기 획득을 최우선 목표로 잡습니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapons: [
          { name: "플로렌시아 [초월 200레벨]", order: "1순위", rating: "10+/10 (종결)", desc: "DLC 라그나로크 최종 무기 초월 200레벨 해금. 마검 강화 저스트 공격력의 물리 캡 수치를 초월 급으로 상향 조정하며 최종 합성 슬롯을 제공." },
          { name: "칠흑의 무뢰검 [DLC 제작 대검]", order: "2순위", rating: "9/10 (대안)", desc: "루시퍼의 얼티메이트 메모리 재료로 수동 제작하는 확장팩 최적화 속성 대검." }
        ],
        skills: "제피로스 & 임모탈리티 & 재밍 & 다크 익스플로전 고정. 임모탈리티 무적의 딜증가 버프를 연계해 보스를 한순간에 녹여냅니다.",
        sigils: [
          { name: "종말의 진 베타 (Dark Opus)", order: "1순위", rating: "10/10", sub: "종말의 진 감마", desc: "루시퍼 처치 보상. 베아트리스의 저스트 강공 막타 물리 딜을 극한으로 돌파시키고 오의 가속을 돕는 최종 종결 진 세팅." },
          { name: "종말의 진 감마", order: "2순위", rating: "10/10", sub: "종말의 진 베타", desc: "오의 사용 시 실드 베리어를 제공하고 궁극 오의 딜링 한계를 추가 뚫어주는 사기 진." },
          { name: "추가 대미지 V+", order: "3순위", rating: "10/10", sub: "추가 대미지 V", desc: "유틸리티(포션 수/회피성능/고양)가 2옵션으로 붙은 최종 종결 진 세트." },
          { name: "유리 속성 변환", order: "4순위", rating: "10/10", sub: "대체 불가", desc: "필수 장착." },
          { name: "명경지수 V+", order: "5순위", rating: "9/10", sub: "퀵 어빌리티 V / 맹렬 V", desc: "저스트 회피 시 무적과 쿨감 가속을 극대화하여, 제피로스 및 임모탈리티 무적 쿨을 빠르게 돌려 생존과 버스트 루프를 상시 유지하는 스펙." },
          { name: "배수 V+", order: "6순위", rating: "9/10", sub: "결사 V+", desc: "체력이 깎인 상태에서 딜을 극한으로 뿜기 위한 유틸 합성형 배수 최종 진." }
        ],
        focus: "최종 DLC 콘텐츠 정복 단계. 200레벨 무기 초월 및 종말의 진 풀강 완수로 전장 1티어 퓨어 물리 광전사 베아트리스를 완성합니다.",
        desc: "라그나로크 확장팩의 최종 루시퍼/벨제붑을 격파한 종결 상태입니다. 루시퍼가 드롭하는 종말의 진 2개를 채용해 추가 데미지 상한 30%를 더 뚫어주며, 200레벨 초월 무기의 압도적인 깡공을 기반으로 최종 스펙을 완성합니다."
      }
    ];
    stageData = beatrixPhases[stepIdx];
  } else {
    // Fallback default stages for other 22 characters
    const defaultPhases = [
      {
        weapons: [
          { name: "스팅어 무기 (크리티컬 확률)", order: "1순위", rating: "9/10", desc: "스토리 중 획득하기 쉽고 기본 크리율을 보정해 딜링 기여를 높이는 핵심 스팅어 무기." },
          { name: "수호 무기 (체력 특화)", order: "2순위", rating: "8/10", desc: "초반 든든한 HP 통을 늘려 물약 사용 빈도를 크게 억제해 주는 생존 특화 무기." }
        ],
        skills: "자신 및 아군 지원 버프 스킬, 그리고 가장 쿨타임이 짧은 주력 딜링기 채용.",
        sigils: [
          { name: "수호 V / IV", order: "1순위", rating: "10/10", sub: "체력 관련 가호", desc: "의문사를 막고 안정적으로 퀘스트 스토리를 클리어하기 위한 필수 체력 진." },
          { name: "공격력 V / IV", order: "2순위", rating: "9/10", sub: "깡공 증가 진", desc: "깡공격을 올려 전투 속도를 가속하고 보스전 클리어를 단축하는 데 기여." },
          { name: "포션 보유 수 V / IV", order: "3순위", rating: "8/10", sub: "재생 V / 흡혈 V", desc: "자가 포션 개수를 추가 확보해 사냥 안정성을 크게 보완." }
        ],
        focus: "메인 스토리 전 장 완료 전 단계. 캐릭터 특수 공격 콤보 메커니즘 적응.",
        desc: "메인 캐릭터 레벨과 마스터리를 올리며 스토리를 미는 시기입니다. 셋팅의 강제성은 전혀 없으며, 대장간에서 재료가 모이는 대로 무기를 조금씩 강화하고 수호/공격력 진 위주로 장착하여 보스를 쾌적하게 클리어하는 것을 목적으로 합니다."
      },
      {
        weapons: [
          { name: "스팅어 무기 (크리티컬 확률)", order: "1순위", rating: "10/10 (필수)", desc: "스토리 완료 후 크리 확률 100% 세팅을 빠르게 구축하기 위한 필수 징검다리 무기." },
          { name: "수호 무기 (체력 특화)", order: "2순위", rating: "6/10 (생존용)", desc: "초반 HP 통을 든든하게 메워 의문사를 예방하기 위한 보조 무기." }
        ],
        skills: "캐릭터 핵심 딜링 및 생존 자버프 어빌리티 채용. 연계 공격을 연습하는 시기.",
        sigils: [
          { name: "크리티컬 확률 V", order: "1순위", rating: "10/10", sub: "혼신 V / 폭군 V", desc: "스팅어와 연동해 100% 크리를 맞춰 딜 분산을 방지." },
          { name: "데미지 상한 V", order: "2순위", rating: "9/10", sub: "공격력 V", desc: "상한 1~2개(30레벨)만 가볍게 세팅하여, 초반 부족한 상한치를 미세 조정하는 데 집중." },
          { name: "혼신 V", order: "3순위", rating: "8/10", sub: "공격력 증가 V", desc: "깡공 수치를 늘려 데미지 상한에 닿게 만드는 필수 딜진." },
          { name: "포션 보유 수 V", order: "4순위", rating: "9/10", sub: "재생 V", desc: "초반 물약 개수 확보를 통한 가성비 생존 보충." },
          { name: "수호 V", order: "5순위", rating: "7/10", sub: "방어 V", desc: "체력 35,000 수준을 맞추는 초보 기본 가이드." },
          { name: "회피 성능 V", order: "6순위", rating: "7/10", sub: "가드 성능 V", desc: "회피 무적 프레임을 추가 확보하여 보스 기믹을 회피." }
        ],
        focus: "스토리 클리어 직후 단계. 캐릭터 기본 평타와 어빌리티 콤보 리듬을 습득하는 데 치중합니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapons: [
          { name: "각성 무기 (어센션)", order: "1순위", rating: "9/10 (주력)", desc: "150레벨 풀강 및 대장간 각성 10단계 달성. 피통과 깡딜을 든든하게 다져 의문사하는 빈도를 대폭 줄여줍니다." },
          { name: "스턴 무기 (기절 특화)", order: "2순위", rating: "7/10 (유틸)", desc: "기절 그로기를 빨리 뽑아 연계 콤보 스타트를 보조하기 위한 무기." }
        ],
        skills: "핵심 주력 딜링기 및 파티 방깎/생존 디버프 스킬 세팅.",
        sigils: [
          { name: "캐릭터 전용 진 V", order: "1순위", rating: "10/10", sub: "포션 보유 수 V", desc: "대장간에서 전용 진을 1순위로 제작. 캐릭터의 전용 고유 성능을 개방합니다." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "딜 보정 가호", desc: "데미지 상한 45레벨 수준을 목표로 차분히 강화 시길을 추가해 갑니다." },
          { name: "자동 부활", order: "3순위", rating: "9/10", sub: "근성 / 수호 진", desc: "1순위 자가 생존용 보험 진을 장착하여 매끄러운 퀘스트 클리어를 도모." },
          { name: "폭군 V", order: "4순위", rating: "8/10", sub: "혼신 V", desc: "공격력을 크게 상승시켜 마스터리 완료에 따른 상한 딜 도달 보조." },
          { name: "수호 V", order: "5순위", rating: "7/10", sub: "Aegis V", desc: "체력을 40,000 수준으로 든든하게 다지는 셋팅." },
          { name: "스턴 V", order: "6순위", rating: "7/10", sub: "고양 V", desc: "보스 기절치 누적 가속을 통한 딜 타임 창출." }
        ],
        focus: "매니악 난이도 구간입니다. 한계돌파 개방 및 은천의 빛을 본격 수집합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapons: [
          { name: "궁극 무기 (터미너스)", order: "1순위", rating: "10/10 (최종)", desc: "프로토 바하무트 드롭 최강 장비. 공격력 기본 스탯을 극단적으로 뻥튀기해 줍니다." },
          { name: "각성 무기 [각성 완수]", order: "2순위", rating: "8/10 (과도기)", desc: "궁극 무기 파밍이 완료되기 전까지 프라우드 최종 보스 사냥을 견인하는 무기." }
        ],
        skills: "보스의 폭딜 카운터 셋팅 및 생존기 적극 기용.",
        sigils: [
          { name: "유리 속성 변환", order: "1순위", rating: "10/10", sub: "대체 불가", desc: "약점 딜 보정 사기 진. 추가 대미지 V와 결합하여 딜링을 극대화합니다." },
          { name: "데미지 상한 V", order: "2순위", rating: "10/10", sub: "한계돌파 크리 20%", desc: "65레벨 풀셋팅 완료. 깡딜 상한을 모두 확보합니다." },
          { name: "추가 대미지 V", order: "3순위", rating: "9/10", sub: "혼신 V / 폭군 V", desc: "공격 시 확률적으로 20%의 추가 딜 레이어를 얹어 전체 화력을 상승시킴." },
          { name: "전용 합성진 V+", order: "4순위", rating: "9/10", sub: "전용 진 V", desc: "전용 진과 함께 고양 또는 명경지수가 결합된 상위 진." },
          { name: "명경지수 V", order: "5순위", rating: "8/10", sub: "회피 성능 V", desc: "회피 저스트 성공 시 무적 부여와 쿨감을 가져오는 최상급 유틸 진." },
          { name: "근성 V", order: "6순위", rating: "8/10", sub: "자동 부활 V", desc: "사망 직전 생존을 확보하는 최종 보험." }
        ],
        focus: "Proud 최종 단계 돌입 및 프로토 바하무트에서 터미너스 무기를 획득하는 데 집중합니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapons: [
          { name: "궁극 무기 또는 DLC 최종 무기 [초월 200레벨]", order: "1순위", rating: "10+/10 (종결)", desc: "무기 초월 200레벨 달성. 막대한 기본 체급 보정 및 추가 슬롯을 획득합니다." },
          { name: "최종 DLC 특화 무기", order: "2순위", rating: "9/10 (대안)", desc: "확장팩 던전 보상으로 제작하는 200레벨 성능의 보조 무기." }
        ],
        skills: "오의 체인 가속화 및 링크 타임 버스트 극대화 셋팅.",
        sigils: [
          { name: "종말의 진 (Dark Opus)", order: "1순위", rating: "10/10", sub: "종말의 진 (보조)", desc: "루시퍼 처치 보상. 어빌리티 대미지 상한을 추가 돌파하고, 오의 발동 시 파티 시너지를 극대화하는 최종 종결 셋팅." },
          { name: "종말의 진 보조 코드", order: "2순위", rating: "10/10", sub: "일반 합성진", desc: "게이지 충전 혹은 오의 후 데미지 상한을 추가 뚫어주는 확장팩 핵심 시길." },
          { name: "추가 대미지 V+", order: "3순위", rating: "10/10", sub: "추가 대미지 V", desc: "유틸리티(포션 수/회피성능/고양)가 2옵션으로 붙은 최종 종결 진 세트." },
          { name: "유리 속성 변환", order: "4순위", rating: "10/10", sub: "대체 불가", desc: "필수 채용." },
          { name: "명경지수 V+", order: "5순위", rating: "9/10", sub: "퀵 어빌리티 V / 맹렬 V", desc: "저스트 회피 시 쿨다운과 무적 시간을 대폭 연장시켜 안전성과 극딜 순환율을 채워줍니다." },
          { name: "퀵 어빌리티 V", order: "6순위", rating: "9/10", sub: "맹렬 V", desc: "어빌 쿨을 극도로 축소하여 딜 순환 효율을 종결시킵니다." }
        ],
        focus: "최종 DLC 종결 콘텐츠 정복. 초월작 완수 및 종말의 진 장착 완료 상태.",
        desc: "라그나로크 확장팩의 최종 루시퍼/벨제붑을 격파한 종결 상태입니다. 루시퍼가 드롭하는 종말의 진 2개를 채용해 추가 데미지 상한 30%를 더 뚫어주며, 200레벨 초월 무기의 압도적인 깡공을 기반으로 최종 스펙을 완성합니다."
      }
    ];
    stageData = defaultPhases[stepIdx];
  }

  // Draw Card 1: 어빌리티 구성 (Abilities Selection)
  const card1 = document.getElementById("detail-card-1");
  card1.innerHTML = `
    <h3>어빌리티 추천 세팅</h3>
    <div class="weapon-box" style="background: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; color: inherit;">
      <p style="font-weight: bold; color: var(--accent-color); margin-bottom: 5px;">추천 어빌리티:</p>
      <p style="font-size: 13.5px; font-weight: 600; line-height: 1.4; color: var(--text-color);">${stageData.skills}</p>
      <div style="margin-top: 12px; border-top: 1px dashed var(--glass-border); padding-top: 10px;">
        <span style="font-size: 11px; color: var(--text-secondary); font-weight: bold; display: block; margin-bottom: 3px;">전체 스킬 목록 참고:</span>
        <ul style="list-style: square; padding-left: 15px; font-size: 12.5px; color: var(--text-secondary);">
          ${char.skills ? char.skills.map(sk => `<li><strong>${sk.name}</strong>: ${sk.desc}</li>`).join('') : '<li>스킬 데이터는 오리지널 메인 4인 공략집에 상세 안내되어 있습니다. 본 캐릭터는 기본 액티브 스킬 4종을 기용하여 운용하십시오.</li>'}
        </ul>
      </div>
    </div>
  `;

  // Draw Card 2: 권장 무기 세팅
  const card2 = document.getElementById("detail-card-2");
  card2.innerHTML = "<h3>권장 무기 & 대체 무기</h3>";
  stageData.weapons.forEach(w => {
    const parsed = parseWeapon(w, char.id);
    card2.innerHTML += `
      <div class="weapon-box">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 2px;">
          <span style="color: var(--accent-color);">${w.order} - ${parsed.name}</span>
          <span style="color: #e28743; font-size: 11.5px;">추천도: ${w.rating}</span>
        </div>
        ${parsed.sub ? `<div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 5px; font-weight: 600;">계열: ${parsed.sub}</div>` : ''}
        <p style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px; line-height: 1.45;">${w.desc}</p>
      </div>
    `;
  });

  // Draw Card 3: 추천 진 세팅 및 대체 진 가이드
  const card3 = document.getElementById("detail-card-3");
  card3.innerHTML = "<h3>추천 진 및 대체재 목록</h3>";
  const ul = document.createElement("ul");
  stageData.sigils.forEach(sig => {
    ul.innerHTML += `
      <li style="margin-bottom: 10px; border-bottom: 1px dashed rgba(226,232,240,0.1); padding-bottom: 8px;">
        <div style="font-weight: 600; font-size: 13px; display: flex; justify-content: space-between; margin-bottom: 2px; align-items: center;">
          <span style="color: var(--accent-color);">${sig.order} - ${sig.name}</span>
          <span style="font-size: 11.5px; color: #e28743;">추천도: ${sig.rating}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
          <span>대체 진: ${sig.sub}</span>
        </div>
        <span style="font-size: 12px; color: var(--text-secondary); display: block; margin-top: 3px; line-height: 1.4;">${sig.desc}</span>
      </li>
    `;
  });
  card3.appendChild(ul);

  // Draw Card 4: 단계별 집중 파밍 목표 & 성장 가이드
  const card4 = document.getElementById("detail-card-4");
  card4.innerHTML = `
    <h3>이 단계의 집중 파밍 목표</h3>
    <p style="font-size: 13.5px; line-height: 1.5; color: var(--text-color); font-weight: 500; margin-bottom: 10px;">${stageData.focus}</p>
    <div style="background: var(--badge-bg); padding: 10px 12px; border-radius: 6px; border-left: 3px solid var(--accent-color);">
      <span style="font-size: 11px; font-weight: bold; color: var(--accent-color); display: block; margin-bottom: 3px;">성장 시점 요약 가이드:</span>
      <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.45;">${stageData.desc}</p>
    </div>
  `;

  // Draw Card 5: 실전 추천 콤보 가이드
  const comboGuides = {
    fraux: [
      { name: "기본 스태프 게이지 충전 콤보", seq: "□ ➡️ □ ➡️ △ (피니시 후 R2 회피로 후딜 캔슬)", desc: "기본 2연타 후 강공격 스탠스를 발동시켜 게이지를 수급하고 회피로 빈틈을 없앱니다." },
      { name: "올 다운 방깎 연계 콤보", seq: "올 다운 (L1 + □) ➡️ R2 회피 ➡️ □ ➡️ □ ➡️ △", desc: "보스 방어력을 감소시킨 후 딜레이를 캔슬하고 곧바로 평타 연계로 폭딜 시동을 거는 콤보입니다." },
      { name: "인도미누스 폭딜 버스트 루프", seq: "인도미누스 (L1 + △) ➡️ 파워 플랜트 (L1 + ○) ➡️ □ ➡️ □ ➡️ △ (반복 스팸)", desc: "자버프를 가동한 뒤 파워 플랜트의 난무 타격으로 딜링 상한 한계를 뚫어 버리는 핵심 폭딜 루프입니다." },
      { name: "SBA 오의 체인 피니시", seq: "○ + ✕ (SBA 활성화) ➡️ 링크 어택 (○) 연계", desc: "파티 풀체인의 시동을 걸거나 아군 오의에 체인을 잇기 위한 마무리 연계입니다." }
    ],
    cagliostro: [
      { name: "극치의 진리 전용진 쿨감 콤보", seq: "□ ➡️ □ ➡️ □ ➡️ △ (콤보 모션 끝날 때 R2 회피)", desc: "피니시 적중 시 전체 어빌리티 쿨타임을 회복하는 전용진 메커니즘을 극대화하는 기본 사이클입니다." },
      { name: "판타즈마고리아 극딜 콤보", seq: "판타즈마고리아 (L1 + □) ➡️ 알렉산드리아 (L1 + △) ➡️ 테제베 (L1 + ○ 차징 유지)", desc: "공방 버프를 자신에게 얹은 후 테제베 차징 레이저를 다단 히트시켜 데미지를 누적시킵니다." },
      { name: "원거리 즉발 소생 콤보", seq: "리조마타 (L1 + ✕) (원거리 즉발 소생) ➡️ □ ➡️ □ ➡️ □ ➡️ △", desc: "쓰러진 아군을 살려낸 뒤 곧바로 쿨감 루프를 가동하여 다시 즉발 소생 쿨타임을 당기는 콤보입니다." },
      { name: "아군 링크 캔슬 피니시", seq: "링크 어택 (○) ➡️ 즉시 △ ➡️ R2 회피 ➡️ □ ➡️ □ ➡️ □ ➡️ △", desc: "링크 어택 그로기 딜타임 도중 콤보 피니시와 쿨감 리듬을 연이어 투사합니다." }
    ],
    zeta: [
      { name: "알베스 루프 체공 콤보 (콩콩이)", seq: "인피니트 원더즈 (L1 + □) ➡️ 알베스의 공명 (L1 + △) ➡️ (체공 후) □ ➡️ □ ➡️ □ ➡️ 타이밍 맞춰 △ (루프)", desc: "공중 도약 후 표식이 찍힌 적에게 돌진하여 루프 참격을 가하는 제타의 알파이자 오메가인 체공 콤보입니다." },
      { name: "렐름스 카운터 지상 카운터", seq: "렐름스 마제스티 (L1 + ○) (패링 성공 시) ➡️ △ (공중 도약) ➡️ □ ➡️ □ ➡️ □ ➡️ △", desc: "보스의 광역기나 포효를 패링 무적으로 맞받아친 다음 즉시 공중 콩콩이 루프로 전환하는 카운터 콤보입니다." },
      { name: "시그노 드라이브 폭딜 피니시", seq: "시그노 드라이브 (L1 + ✕) (공격 버프) ➡️ □ ➡️ □ ➡️ □ ➡️ △", desc: "공격 버프를 켠 후 지상에서 보스의 쉴드 스턴치를 급격하게 깎아내기 위한 지상 피니시 콤보입니다." },
      { name: "에어 오의 체인 발동", seq: "체공 도약 ➡️ 공중에서 ○ + ✕ (SBA 발동)", desc: "공중 콤보를 끝내기 전 안전하게 오의 4체인을 격발시키는 공중 오의 연계 콤보입니다." }
    ],
    beatrix: [
      { name: "마검 저스트 타이밍 평강 콤보", seq: "제피로스 (L1 + □) ➡️ □ ➡️ △ (저스트 입력) ➡️ □ ➡️ △ (저스트 입력)", desc: "강공격 입력 시 정확한 불빛 타이밍에 맞춰 버튼을 누름으로써 공속과 딜을 폭증시키는 콤보입니다." },
      { name: "불사신 무적 폭딜 콤보", seq: "임모탈리티 (L1 + △) (무적 가동) ➡️ 재밍 (L1 + ○) ➡️ □ ➡️ △ (저스트) 연속 스팸", desc: "체력이 소모되는 마검 난사 상태를 임모탈리티 무적으로 버티며 딜을 밀어 넣는 보스 극딜용 콤보입니다." },
      { name: "다크 익스플로전 디버프 연계", seq: "다크 익스플로전 (L1 + ✕) (방깎) ➡️ 제피로스 (L1 + □) ➡️ □ ➡️ △ (저스트)", desc: "방어력 감소 디버프를 광역 폭발로 가한 뒤 곧바로 마검 저스트 연타를 꽂는 정석 연계입니다." },
      { name: "SBA 오의 폭발 피니시", seq: "임모탈리티 발동 ➡️ 저스트 콤보 ➡️ ○ + ✕ (오의)", desc: "무적 버프 상태에서 극딜 후 마지막 오의 피니시를 터트리는 안정적인 종결 콤보입니다." }
    ]
  };

  const defaultCombos = [
    { name: "기본 평타 피니시 콤보", seq: "□ ➡️ □ ➡️ □ ➡️ △ (특수 피니시) ➡️ 액티브 어빌리티 사용", desc: "평타 연타 후 강공 피니시로 이어지는 가장 정석적이고 범용적인 캐릭터 기본 딜링 순환 구조입니다." },
    { name: "어빌리티 캔슬 링크 콤보", seq: "어빌리티 스킬 시전 ➡️ 즉시 링크 어택 (○) ➡️ △ (피니시)", desc: "어빌리티의 후딜레이를 링크 어택으로 캔슬하고 강력한 연계 공격을 가하는 링크 게이지 충전용 콤보입니다." },
    { name: "패드 가드 패링 콤보", seq: "L1 (가드 유지) ➡️ 적 타격 순간 R2 (저스트 회피) ➡️ □ ➡️ △", desc: "가드로 생존력을 확보한 상태에서 저스트 회피를 성공시켜 딜 타임과 무적 시간을 확보하는 생존형 콤보입니다." },
    { name: "오의 SBA 4체인 발동", seq: "링크 어택 (○) ➡️ ○ + ✕ (SBA 발동) ➡️ 오의 연계 체인 대기", desc: "보스 그로기 시점에 파티원과 오의를 공유하여 강한 체인 버스트 대미지를 유도하는 콤보입니다." }
  ];

  const characterComboList = comboGuides[char.id] || defaultCombos;

  const comboCard = document.getElementById("modal-combos");
  comboCard.innerHTML = `
    <h3>${char.name} 추천 실전 콤보 가이드</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">
      ${characterComboList.map((cb, idx) => `
        <div class="weapon-box" style="margin-bottom: 0 !important; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 6px;">
              <span style="color: var(--accent-color);">${idx + 1}. ${cb.name}</span>
            </div>
            <p style="font-size: 13px; font-weight: 700; color: var(--text-color); background: rgba(226,232,240,0.08); padding: 8px 10px; border-radius: 6px; border-left: 3px solid var(--accent-color); line-height: 1.4; margin-bottom: 8px; font-family: monospace; letter-spacing: 0.5px;">
              ${cb.seq}
            </p>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.45; margin-top: 4px;">${cb.desc}</p>
        </div>
      `).join('')}
    </div>
  `;

  // Draw Card 6: 추천 AI 동료 리스트 (Player 주캐 기용 시)
  const aiRecommendations = {
    fraux: [
      { rank: "1위", name: "칼리오스트로", rating: "10.0/10", role: "서포터 / 힐러", reason: "전용진 버프로 프라우의 스탠스 공격 대미지 상한 한계를 극한까지 끌어올리며, 위험 시 원거리 즉발 부활을 백업합니다." },
      { rank: "2위", name: "오이겐", rating: "9.8/10", role: "원거리 유틸 / 딜러", reason: "AI 딜량 1위의 정밀 저격 성능과 보스를 묶어주는 마비(Paralysis) 디버프로 프라우의 프리딜 기회를 무한 제공합니다." },
      { rank: "3위", name: "지크프리트", rating: "9.2/10", role: "딜포터 / 버퍼", reason: "아군 전체 방어력 상승 및 피격 경직을 면제하는 슈퍼아머를 켜주어 프라우의 기나긴 스탠스 콤보 중단을 막아줍니다." },
      { rank: "4위", name: "로제타", rating: "8.9/10", role: "버퍼 / 서포터", reason: "보스 위치에 고정되는 공격/방어 버프 및 지속 도트 힐 결계로 프라우의 지상 교전 끈기를 극대화합니다." },
      { rank: "5위", name: "베인", rating: "8.5/10", role: "탱커 / 보호막", reason: "구형 무적 장막을 제공해 프라우가 적의 광역 전멸기나 회피하기 난해한 타격 중에도 끊김 없이 맞딜을 꽂게 케어합니다." },
      { rank: "6위", name: "샤를로테", rating: "8.2/10", role: "근접 폭딜러", reason: "AI 중 근접 타격 빈도가 매우 높아 프라우와 함께 보스의 브레이크 및 스턴치를 급격하게 깎아냅니다." },
      { rank: "7위", name: "페르시발", rating: "7.8/10", role: "딜포터", reason: "동일한 화속성으로 공명 효율을 높이고, 공격력 상승 버프와 적 방깎 디버프 순환으로 딜 한계를 뚫어줍니다." },
      { rank: "8위", name: "란슬롯", rating: "7.5/10", role: "유틸 딜러", reason: "보스를 완전 행동 불능으로 얼려버리는 빙결 디버프를 공급해 프라우가 여유롭게 콤보 피니시를 넣도록 돕습니다." },
      { rank: "9위", name: "그랑", rating: "7.0/10", role: "올라운더", reason: "힐과 공격 버프, 상태이상 해제를 고루 가동하며 메인 딜러의 안정성을 든든하게 백업하는 밸런스형 AI입니다." },
      { rank: "10위", name: "지타", rating: "7.0/10", role: "올라운더", reason: "그랑과 동일하게 세팅되어 위기 상황 시 힐링 및 배리어를 활용하여 생존 부담을 효과적으로 덜어줍니다." }
    ],
    cagliostro: [
      { rank: "1위", name: "제타", rating: "10.0/10", role: "공중 폭딜러", reason: "칼리오스트로가 크리 및 공격 버프를 가동하는 도중 AI 제타가 공중에서 상한 딜을 가장 완벽히 꽂아줍니다." },
      { rank: "2위", name: "오이겐", rating: "9.8/10", role: "원거리 유틸 / 딜러", reason: "원거리 마비 상태이상과 포격을 통해 칼리오스트로의 연금술 차지 스킬 안전성을 확실하게 보좌합니다." },
      { rank: "3위", name: "샤를로테", rating: "9.3/10", role: "근접 폭딜러", reason: "지상 딜링 빈도가 우수하여 서포터 중심인 칼리오스트로의 메인 화력 공백을 가장 든든히 채워주는 딜러입니다." },
      { rank: "4위", name: "지크프리트", rating: "9.0/10", role: "딜포터 / 버퍼", reason: "방어 버프와 슈퍼아머로 칼리오스트로가 장시간의 차징이나 힐링 캐스팅 도중 피격당해도 캔슬되지 않게 차단합니다." },
      { rank: "5위", name: "로제타", rating: "8.7/10", role: "버퍼 / 서포터", reason: "칼리오스트로의 공방 버프와 로제타의 장미 결계 버프가 완벽히 중첩되어 전체 파티 화력을 상한선까지 증폭합니다." },
      { rank: "6위", name: "베인", rating: "8.4/10", role: "탱커 / 보호막", reason: "적의 광역 패턴을 무적 실드로 차단하여 칼리오스트로가 안전하게 즉발 부활이나 파티 힐링을 집중하도록 돕습니다." },
      { rank: "7위", name: "란슬롯", rating: "8.0/10", role: "유틸 딜러", reason: "빙결 상태이상을 적에게 걸어주며 빠른 링크 어택 축적을 지원해 전투 템포를 칼리오스트로에게 맞춰줍니다." },
      { rank: "8위", name: "페르시발", rating: "7.7/10", role: "딜포터", reason: "공격 버프 및 적의 방어력 감소 디버프를 순환시켜 칼리오스트로의 콤보 어빌 딜 계수를 상향시켜 줍니다." },
      { rank: "9위", name: "베아트리스", rating: "7.2/10", role: "배수 딜러", reason: "자가 피소모로 폭딜을 가하는 배수 딜러로, 칼리오스트로의 힐 및 부활 케어가 있다면 최고의 딜을 유지합니다." },
      { rank: "10위", name: "프라우", rating: "7.2/10", role: "스탠스 딜러", reason: "크리티컬 버프 시너지를 완벽히 소화하여 지상에서 꾸준히 누적 딜을 쌓아주는 하이브리드 파트너입니다." }
    ],
    zeta: [
      { rank: "1위", name: "칼리오스트로", rating: "10.0/10", role: "서포터 / 힐러", reason: "제타가 공중에서 집중 딜을 꽂는 동안 지상에서 공방/크리 버프와 위험 시 원거리 소생을 완벽하게 백업합니다." },
      { rank: "2위", name: "베인", rating: "9.8/10", role: "탱커 / 보호막", reason: "보스가 공중 타격기를 시전할 때 무적 장막을 설치하여 제타의 체공 높이 스릴링 안정성을 극대화해 줍니다." },
      { rank: "3위", name: "오이겐", rating: "9.4/10", role: "원거리 유틸 / 딜러", reason: "마비 및 다운 유틸로 보스를 장시간 바닥에 메쳐두어, 제타가 공중 연속 돌진을 실수 없이 연속 투사하게 돕습니다." },
      { rank: "4위", name: "로제타", rating: "9.0/10", role: "버퍼 / 서포터", reason: "공격 증폭 결계를 가동해 제타의 공중 콩콩이 연격 타격당 딜링 상한선을 지속적으로 보완해 줍니다." },
      { rank: "5위", name: "지크프리트", rating: "8.8/10", role: "딜포터 / 버퍼", reason: "전체 방버프와 넉백 방지로 제타가 가끔 지상으로 내려오거나 꼬였을 때 대미지 감소 및 진형 복귀를 지원합니다." },
      { rank: "6위", name: "샤를로테", rating: "8.4/10", role: "근접 폭딜러", reason: "보스 그로기 상태 시 제타와 나란히 최고 속도의 딜을 집중시켜 오의 게이지를 극한까지 몰아붙입니다." },
      { rank: "7위", name: "란슬롯", rating: "8.0/10", role: "유틸 딜러", reason: "보스의 행동 반경을 막는 빙결 디버프를 적시 투사해 제타의 낙하 타격 조작을 매우 수월하게 보좌합니다." },
      { rank: "8위", name: "페르시발", rating: "7.6/10", role: "딜포터", reason: "적 방깎 디버프 순환으로 제타의 콩콩이 피니시 및 에어 어빌리티 데미지 배율을 배로 올려줍니다." },
      { rank: "9위", name: "프라우", rating: "7.3/10", role: "스탠스 딜러", reason: "지상 스탠스 딜을 흔들림 없이 가동하여 제타의 체공 딜링과 훌륭한 더블 딜 시너지를 완성합니다." },
      { rank: "10위", name: "베아트리스", rating: "7.3/10", role: "배수 딜러", reason: "제타의 빠른 오의 가속 타이밍에 맞춰 지상에서 폭발적인 데미지 지원으로 고속 토벌을 유도합니다." }
    ],
    beatrix: [
      { rank: "1위", name: "칼리오스트로", rating: "10.0/10", role: "서포터 / 힐러", reason: "마검 자가 피소모 리스크로 인해 급사율이 가장 높은 베아트리스에게 즉시 부활과 크리 버프를 지원합니다." },
      { rank: "2위", name: "오이겐", rating: "9.8/10", role: "원거리 유틸 / 딜러", reason: "확실한 마비 타이밍을 벌어주어 베아트리스가 정확한 저스트 타이밍 강공 피니시 콤보를 안전하게 누적시킵니다." },
      { rank: "3위", name: "베인", rating: "9.5/10", role: "탱커 / 보호막", reason: "피가 낮아야 딜이 강해지는 배수 셋팅 특성상 실전 딸피를 유지하는 베아트리스를 결계 무적으로 보살핍니다." },
      { rank: "4위", name: "지크프리트", rating: "9.0/10", role: "딜포터 / 버퍼", reason: "방어력 상승 버프와 경직 방지 슈퍼아머로 저스트 타이밍 입력 중 피격되어 콤보가 리셋되는 사고를 차단합니다." },
      { rank: "5위", name: "로제타", rating: "8.6/10", role: "버퍼 / 서포터", reason: "장미 결계를 통해 공격 버프와 약한 힐을 제공해 배수 세팅의 적정 생명력 선을 아슬아슬하게 유지시켜 줍니다." },
      { rank: "6위", name: "샤를로테", rating: "8.2/10", role: "근접 폭딜러", reason: "보스 근접 어그로를 최대로 분산시켜 베아트리스가 마검 게이지 수급 및 저스트 딜에만 온전히 집중하게 돕습니다." },
      { rank: "7위", name: "란슬롯", rating: "7.8/10", role: "유틸 딜러", reason: "빙결 상태이상을 제공하여 보스의 지랄맞은 광폭 패턴을 스킵시키고 안전한 마검 극딜 찬스를 부여합니다." },
      { rank: "8위", name: "페르시발", rating: "7.5/10", role: "딜포터", reason: "공버프와 적 방깎으로 베아트리스가 임모탈리티 무적 상태에서 극한의 상한 딜을 투사할 발판을 만듭니다." },
      { rank: "9위", name: "프라우", rating: "7.1/10", role: "스탠스 딜러", reason: "위기 시 적 버프 디스펠과 화속 극딜을 보충하여 교전 안정성과 서포팅 화력을 지원합니다." },
      { rank: "10위", name: "그랑", rating: "7.0/10", role: "올라운더", reason: "힐과 디스펠 정화, 그리고 링크 피니시 서포트를 고르게 조율해 배수 셋팅이 상태이상으로 꼬이는 것을 방지합니다." }
    ]
  };

  const defaultAiCompanions = [
    { rank: "1위", name: "칼리오스트로", rating: "10.0/10", role: "서포터 / 힐러", reason: "공방/크리티컬 버프 및 즉발 소생 유틸을 가진 AI 0티어 부동의 최고 존엄 파티원입니다." },
    { rank: "2위", name: "오이겐", rating: "9.8/10", role: "원거리 유틸 / 딜러", reason: "AI 조종 시 원거리 저격 딜 손실이 거의 없으며, 마비와 다운 유틸로 완벽한 프리딜 타임을 제공합니다." },
    { rank: "3위", name: "로제타", rating: "9.5/10", role: "버퍼 / 서포터", reason: "공방 버프 결계와 도트 힐 결계를 스마트하게 가동하여 아군의 교전 및 파밍 안전성을 최고조로 올립니다." },
    { rank: "4위", name: "지크프리트", rating: "9.1/10", role: "딜포터 / 버퍼", reason: "든든한 아군 전체 방어력 상승 버프 및 슈퍼아머를 끊김 없이 정확하게 순환시켜 주는 명품 AI입니다." },
    { rank: "5위", name: "베인", rating: "8.7/10", role: "탱커 / 보호막", reason: "보스의 전멸기 패턴 차단용 무적 보호막과 도발 성능으로 플레이어의 프리딜 환경을 가장 잘 가꿔줍니다." },
    { rank: "6위", name: "샤를로테", rating: "8.4/10", role: "근접 폭딜러", reason: "AI 기용 시 우수한 무적기 활용 성능으로 딜로스가 적으며, 빠른 연타로 브레이크 깎이에 뛰어납니다." },
    { rank: "7위", name: "란슬롯", rating: "8.0/10", role: "유틸 딜러", reason: "광폭화 보스의 행동을 묶는 빙결 디버프 유무가 중요한 최후반 보스전에서 압도적인 가치를 발휘합니다." },
    { rank: "8위", name: "페르시발", rating: "7.6/10", role: "딜포터", reason: "아군 전체 공버프와 적 방어력 깎기를 동시 순환해 파티 전체의 데미지 폭발력에 기여합니다." },
    { rank: "9위", name: "그랑", rating: "7.2/10", role: "올라운더", reason: "힐과 디스펠 정화를 통한 보스 상태이상 억제 및 파티 유틸리티 보강을 매끄럽게 책임집니다." },
    { rank: "10위", name: "지타", rating: "7.2/10", role: "올라운더", reason: "그랑과 비슷하게 힐, 데미지 컷 배리어 및 링크 게이지 수급에 특화되어 어느 파티나 무난하게 투입 가능합니다." }
  ];

  const characterAiList = aiRecommendations[char.id] || defaultAiCompanions;

  const aiCard = document.getElementById("modal-ai-companions");
  aiCard.innerHTML = `
    <h3>${char.name} 주캐 운용 시 추천 AI 동료 파티원 (Top 10)</h3>
    <div class="ai-table-wrapper">
      <table class="ai-table">
        <thead>
          <tr>
            <th style="width: 70px;">순위</th>
            <th style="width: 100px;">동료 이름</th>
            <th style="width: 80px;">추천도</th>
            <th style="width: 120px;">시너지 역할</th>
            <th>시너지 이유 및 AI 성능 분석</th>
          </tr>
        </thead>
        <tbody>
          ${characterAiList.map(ai => `
            <tr>
              <td><span class="ai-rank-badge">${ai.rank}</span></td>
              <td style="font-weight: 700; color: var(--text-color);">${ai.name}</td>
              <td><span class="ai-rating">${ai.rating}</span></td>
              <td style="font-size: 12.5px; font-weight: 600; color: var(--text-secondary);">${ai.role}</td>
              <td style="line-height: 1.45; color: var(--text-color);">${ai.reason}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function closeModal() {
  const modal = document.getElementById("detail-modal");
  modal.classList.remove("active");
}

function getWeaponDetails(charId, genericName) {
  const weaponsDb = {
    gran: {
      stinger: "클레이브 (Claidheamh Soluis)",
      defender: "알론다이트 (Alondite)",
      ascension: "듀랜달 (Durandal)",
      stun: "트레저드 (Treasure Sword)",
      terminus: "세븐즈 디클레어 (Seven-Star Sword)",
      dlc: "소울 이터 (Soul Eater)"
    },
    djeeta: {
      stinger: "클레이브 (Claidheamh Soluis)",
      defender: "알론다이트 (Alondite)",
      ascension: "듀랜달 (Durandal)",
      stun: "트레저드 (Treasure Sword)",
      terminus: "세븐즈 디클레어 (Seven-Star Sword)",
      dlc: "소울 이터 (Soul Eater)"
    },
    katalina: {
      stinger: "루미에르 블레이드",
      defender: "나이트 래피어",
      ascension: "클라우 솔라스",
      stun: "플람베르크",
      terminus: "뫼비우스",
      dlc: "소울 블레이드"
    },
    rackam: {
      stinger: "베네디아",
      defender: "휠록",
      ascension: "티아마트 볼트",
      stun: "해적 권총",
      terminus: "프라메크",
      dlc: "루이너스 샷"
    },
    io: {
      stinger: "감람석의 지팡이",
      defender: "정령의 지팡이",
      ascension: "황금의 영지 (감반테인)",
      stun: "콜러서스 카인",
      terminus: "카드케우스",
      dlc: "천체의 지팡이"
    },
    eugen: {
      stinger: "카노프스",
      defender: "군용 라이플",
      ascension: "아카샤 총",
      stun: "머스킷",
      terminus: "데트릭스",
      dlc: "발컨 로켓"
    },
    rosetta: {
      stinger: "러브 이터 (러브 이터널)",
      defender: "장미의 가시",
      ascension: "코트 데 브란슈",
      stun: "장미의 가시 윕",
      terminus: "다마스쿠스 나이프",
      dlc: "에테리얼 윕"
    },
    lancelot: {
      stinger: "베인글레이브",
      defender: "호프누스",
      ascension: "나이트 디거",
      stun: "루 가르",
      terminus: "다마스쿠스 소드",
      dlc: "백룡의 쌍검"
    },
    vane: {
      stinger: "우콘바사라",
      defender: "골드 액스",
      ascension: "성목의 도끼",
      stun: "스파르타 바르디슈",
      terminus: "묠니르 (아이무르)",
      dlc: "황금용의 전투 도끼"
    },
    percival: {
      stinger: "조이세르",
      defender: "플람베르크",
      ascension: "로엔그린",
      stun: "발뭉",
      terminus: "갓프리",
      dlc: "염제의 염참도"
    },
    siegfried: {
      stinger: "아스칼론",
      defender: "클레이모어",
      ascension: "흐로팅",
      stun: "밤붕",
      terminus: "발뭉",
      dlc: "용해의 중검"
    },
    charlotta: {
      stinger: "위고",
      defender: "클레이브",
      ascension: "세이크리드 칼리버",
      stun: "나이트 소드",
      terminus: "클라우 솔라스",
      dlc: "성기사의 영광검"
    },
    yodarha: {
      stinger: "아수라",
      defender: "닌자도",
      ascension: "후도쿠니",
      stun: "하네오토",
      terminus: "아메노하바키리",
      dlc: "검호의 쌍도"
    },
    narmaya: {
      stinger: "형천",
      defender: "코테츠",
      ascension: "아수라",
      stun: "요도 무라마사",
      terminus: "아메노하바키리",
      dlc: "도법의 극의검"
    },
    vaseraga: {
      stinger: "그레이트 사이스",
      defender: "헤비 액스",
      ascension: "가로우",
      stun: "블러디 사이스",
      terminus: "에레쉬키갈",
      dlc: "사신의 처단 낫"
    },
    ferry: {
      stinger: "로젠 윕",
      defender: "체인 윕",
      ascension: "백장미의 채찍",
      stun: "고스트 윕",
      terminus: "에테리얼 윕",
      dlc: "영혼의 조련 채찍"
    },
    ghandagoza: {
      stinger: "고대의 권각",
      defender: "강철 권각",
      ascension: "황금의 철권",
      stun: "배틀 건틀릿",
      terminus: "야마",
      dlc: "파천의 강권"
    },
    id: {
      stinger: "아바타 소드",
      defender: "그레이트 소드",
      ascension: "소울 이터",
      stun: "드래곤 슬레이어",
      terminus: "알카디아",
      dlc: "종말의 종검"
    },
    seofon: {
      stinger: "검신 크리티컬 소드",
      defender: "검신 수호 디펜더",
      ascension: "영령의 신검",
      stun: "검신 스턴 소드",
      terminus: "검신 세븐즈 디클레어",
      dlc: "영검 얼티메이트"
    },
    tweyen: {
      stinger: "마탄 크리티컬 보우",
      defender: "마탄 수호 디펜더",
      ascension: "영궁 아르테미스",
      stun: "마탄 스턴 보우",
      terminus: "천궁 보우오브데비에이션",
      dlc: "성궁 아폴론"
    },
    sandalphon: {
      stinger: "천사 크리티컬 소드",
      defender: "천사 수호 디펜더",
      ascension: "로스트 에덴",
      stun: "천사 스턴 소드",
      terminus: "아인 소프 오르",
      dlc: "정의의 깃털칼"
    },
    fediel: {
      stinger: "죽음 크리티컬 소드",
      defender: "죽음 수호 디펜더",
      ascension: "페디엘 스파인",
      stun: "죽음 스턴 소드",
      terminus: "소울 이터",
      dlc: "흑룡의 사령검"
    }
  };

  const charDb = weaponsDb[charId];
  if (!charDb) return { name: genericName, sub: "" };

  const lower = genericName.toLowerCase();
  if (lower.includes("스팅어")) {
    return { name: charDb.stinger, sub: "스팅어 무기 (크리티컬 확률)" };
  } else if (lower.includes("수호")) {
    return { name: charDb.defender, sub: "수호 무기 (체력 특화)" };
  } else if (lower.includes("각성") || lower.includes("어센션")) {
    return { name: charDb.ascension, sub: "각성 무기 (어센션)" };
  } else if (lower.includes("스턴") || lower.includes("처단")) {
    return { name: charDb.stun, sub: "처단 무기 (스턴 특화)" };
  } else if (lower.includes("궁극") || lower.includes("터미너스")) {
    return { name: charDb.terminus, sub: "궁극 무기 (터미너스)" };
  } else if (lower.includes("dlc") || lower.includes("최종")) {
    return { name: charDb.dlc, sub: "DLC 최종 무기 (초월 200레벨)" };
  }

  return { name: genericName, sub: "" };
}

function parseWeapon(w, charId) {
  let name = w.name;
  let sub = w.type || "";
  
  if (name.includes("[") && name.includes("]")) {
    const parts = name.split("[");
    name = parts[0].trim();
    let typeStr = parts[1].replace("]", "").trim();
    if (typeStr.includes("스팅어")) {
      sub = "스팅어 무기 (크리티컬 확률)";
    } else if (typeStr.includes("수호")) {
      sub = "수호 무기 (체력 특화)";
    } else if (typeStr.includes("각성") || typeStr.includes("어센션")) {
      sub = "각성 무기 (어센션)";
    } else if (typeStr.includes("스턴") || typeStr.includes("처단")) {
      sub = "처단 무기 (스턴 특화)";
    } else if (typeStr.includes("궁극") || typeStr.includes("터미너스")) {
      sub = "궁극 무기 (터미너스)";
    } else if (typeStr.includes("dlc") || typeStr.includes("최종")) {
      sub = "DLC 최종 무기 (초월 200레벨)";
    } else {
      sub = typeStr;
    }
  }
  
  const lower = name.toLowerCase();
  if (lower === "스팅어 무기 (크리티컬 확률)" || lower === "수호 무기 (체력 특화)" || lower === "각성 무기 (어센션)" || lower === "스턴 무기 (기절 특화)" || lower === "궁극 무기 (터미너스)" || lower === "궁극 무기 또는 dlc 최종 무기 [초월 200레벨]" || lower === "최종 dlc 특화 무기" || lower === "각성 무기 [각성 완수]" || lower === "최종 dlc 제작 대검" || lower === "각성 완수") {
    const mapped = getWeaponDetails(charId, name);
    name = mapped.name;
    sub = mapped.sub;
  }
  
  return { name, sub };
}
