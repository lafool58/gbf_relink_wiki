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
        weapon: { name: "화염의 권각 [스팅어 무기]", rating: "★★★★☆ (9/10)", desc: "엔딩 직후 가장 먼저 150레벨까지 해금하여 크리티컬 발생 확률을 100%에 맞춰 평타 2타 후 강공격 콤보의 스탠스 게이지 수급 효율을 극대화합니다." },
        skills: "인도미누스 (연계 후딜 감소 자버프) & 올 다운 (방깎 디버프) 채용. 기본 콤보 딜링 상한선을 메우기 위한 보조형 어빌 세팅.",
        sigils: [
          { name: "크리티컬 확률 V", sub: "대체: 가호 및 한돌 크리", desc: "스팅어 무기 기본 크리치와 융합하여 크리티컬 확률 100%를 즉시 맞춰 딜 분산을 방지." },
          { name: "데미지 상한 V", sub: "대체: 깡공 혼신/폭군 진", desc: "이 구간에서는 상한 진은 1~2개(30레벨)만 가볍게 넣고, 깡공 혼신 진을 섞어 상한 딜에 안정적으로 도달하게 합니다." }
        ],
        focus: "VERY HARD 및 EXTREME 레벨에서 한계돌파 시스템을 개방하고, 프라우의 레벨을 100까지 차분하게 육성하며 무기 강화를 집중적으로 개시합니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapon: { name: "천상무뢰 [각성 무기/어센션]", rating: "★★★★☆ (8/10)", desc: "150레벨 풀강 및 대장간 10단계 풀각성 작업을 시작합니다. 깡공과 피통이 든든하게 올라 보스의 매운 대미지를 버틸 수 있게 지원합니다." },
        skills: "파워 플랜트 (강렬한 힘 폭딜기) & 인도미누스 & 올 다운 구성. 콤보 피니시 후 R2 캔슬 컬랩스 연계로 쿨타임을 적극 회전시킵니다.",
        sigils: [
          { name: "데미지 상한 V", sub: "대체: 추가 대미지 V", desc: "3~4개 채용하여 상한을 45~50레벨 이상 확보하고, 캐릭터 전용 진을 대장간에서 만들어 프라우의 스탠스 쿨다운 성능을 촉발시킵니다." },
          { name: "포션 보유 수 V", sub: "대체: 자동 부활 / 근성", desc: "보스전 빈사 시 파티원 전원의 생명을 살릴 핵심 생명줄. 무조건 V레벨 풀셋 장착." }
        ],
        focus: "MANIAC 난이도 돌입 단계입니다. 화룡 및 성정수 뺑뺑이를 돌며 한계돌파 및 각성작에 필수적인 '은천의 빛'을 본격 수집합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapon: { name: "데블 크로우 [최종 궁극/DLC]", rating: "★★★★★ (10/10)", desc: "프로토 바하무트 드롭이 아닌, 대장간에서 루시퍼/벨제붑 처치 시 드롭되는 '얼티메이트 메모리'를 사용해 직접 수동 제작하는 최강의 최종 기어입니다." },
        skills: "파워 플랜트 & 인도미누스 & 데드랜즈 (오의 게이지 가속용) 구성. 보스의 폭딜 무력화 기믹 시점에 맞춰 파워 플랜트를 최속 3연타 스팸합니다.",
        sigils: [
          { name: "유리 속성 변환", sub: "대체: 추가 대미지 V 3개", desc: "모든 보스를 역상성 약점으로 강제 찌르게 만드는 사기 진. 추가 대미지 V 3개와 결합해 딜 포텐셜을 약 40% 이상 폭증시킵니다." },
          { name: "데미지 상한 V", sub: "대체: 공격력/상한 한돌", desc: "65레벨 풀셋 완성 단계. 한계돌파로 크리 20% 및 기본 어빌리티 뎀상한 20%를 맞춰 딜을 한계까지 우겨넣습니다." }
        ],
        focus: "Proud 최종 바하무트 토벌 및 루시퍼 진입 준비 기간입니다. 은천의 빛을 녹여 각성 무기 10단계 각성 완수를 최우선으로 진행합니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapon: { name: "데블 크로우 [초월 200레벨]", rating: "★★★★★ (10+/10)", desc: "대장간 무기 초월 시스템을 개방해 200레벨까지 돌파 완료. 신급 스탯 보정 및 4번째 전용 합성 옵션 슬롯이 개방되는 압도적인 종결 상태." },
        skills: "파워 플랜트 & 인도미누스 & 데드랜즈 & 올 다운 고정. 링크 타임 상태 진입 시 쿨감 100%를 받아 파워 플랜트만 스팸하여 수백만 버스트 딜을 뿜어냅니다.",
        sigils: [
          { name: "종말의 진 감마", sub: "대체: 추가 대미지 V+", desc: "루시퍼 처치 보상인 종말의 진 2종 기용. 어빌리티 대미지 상한을 추가로 돌파시켜 최종 종결 스펙에 도달합니다." },
          { name: "명경지수 / 퀵 어빌 V", sub: "대체: 맹렬 V / 고양 V", desc: "저스트 회피 시 오의 수급 및 스킬 쿨다운을 0으로 좁히는 완벽한 유틸 합성 진으로 슬롯을 도배합니다." }
        ],
        focus: "DLC Endless Ragnarok 최종 콘텐츠 정복. 무기 200렙 초월작 및 종말의 진 풀 강화를 완료하여 월드 랭커급 프라우를 완성합니다.",
        desc: "라그나로크 확장팩의 최종 루시퍼/벨제붑을 격파한 종결 상태입니다. 루시퍼가 드롭하는 종말의 진 2개를 채용해 추가 데미지 상한 30%를 더 뚫어주며, 200레벨 초월 무기의 압도적인 깡공을 기반으로 최종 스펙을 완성합니다."
      }
    ];
    stageData = frauxPhases[stepIdx];
  } else if (char.id === "cagliostro") {
    const cagliostroPhases = [
      {
        weapon: { name: "베가르드 사수 [스팅어 무기]", rating: "★★★★☆ (9/10)", desc: "초반 크리 확률 100% 세팅을 빠르게 구축하여, 아군 버프 판타즈마고리아 가동 시 딜 기여 크리 발생률을 보정하는 징검다리 스태프." },
        skills: "판타즈마고리아 (공방크리 30% 증가 버프) & 테제베 (광선 쿨감기) 필수 배치. 아군의 딜링 상한 안착을 돕는 보조 딜러 세팅.",
        sigils: [
          { name: "크리티컬 확률 V", sub: "대체: 혼신 V / 폭군 V", desc: "스팅어 창과 연동해 100% 크리를 맞춰주고, 깡공 진을 섞어 판타즈마고리아가 켜졌을 때 상한 딜이 바로 나오게 보정합니다." },
          { name: "데미지 상한 V", sub: "대체: 공격력 V", desc: "상한 1~2개(30레벨)만 가볍게 세팅하여, 초반 부족한 상한치를 미세 조정하는 데 집중합니다." }
        ],
        focus: "초반 한계돌파 개방 직후 단계. 칼리오스트로의 평타 3타 후 강공격(ㅁㅁㅁㅅ) 회피 캔슬 리듬을 손에 익히는 연습에 치중합니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapon: { name: "세이크리드 기어 [각성 무기/어센션]", rating: "★★★★☆ (8/10)", desc: "150레벨 풀강 및 대장간 10단계 풀각성 개방. 버퍼로서의 안정적인 기본 피통을 제공하여 보스의 광역 패턴 시 의문사하는 빈도를 줄여줍니다." },
        skills: "판타즈마고리아 & 테제베 & 알렉산드리아 (스턴 게이지 시동용) & 리조마타 (원거리 즉발 소생 필수 채용).",
        sigils: [
          { name: "극치의 진리 (전용 진)", sub: "대체: 포션 보유 수 V", desc: "대장간에서 전용 진을 1순위로 제작. 콤보 피니시 성공 시 전체 어빌 쿨이 줄어 판타즈마고리아를 사실상 무한대로 유지시킵니다." },
          { name: "자동 부활 (Guts)", sub: "대체: 근성 / 수호 진", desc: "힐러/서포터가 급사하면 파티가 터지므로, 1순위 자가 생존용 보험 진을 장착합니다." }
        ],
        focus: "매니악 난이도에서 MSP 마나 포인트와 은천의 빛을 파밍하여, 콤보 쿨감 전용진 제작 및 주력 파티원 성장을 견인합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapon: { name: "범천 세이크리드 기어 [궁극 무기/터미너스]", rating: "★★★★★ (10/10)", desc: "프로토 바하무트 드롭. 최종 궁극 무기이며, 공격력 버프와 맞물려 칼리오스트로의 참격 딜링 포텐셜을 폭발적으로 상승시킵니다." },
        skills: "판타즈마고리아 & 테제베 & 알렉산드리아 & 리조마타 구성. 판타즈마고리아를 계속 켜며 적 스턴치가 쌓였을 때 오의 체인을 시작합니다.",
        sigils: [
          { name: "유리 속성 변환", sub: "대체: 추가 대미지 V 2개", desc: "서포터도 준수한 딜을 넣게 만들어주는 개사기 진. 테제베 광선과 조화가 매우 훌륭합니다." },
          { name: "데미지 상한 V", sub: "대체: 퀵 어빌리티 V", desc: "65레벨 풀셋팅 완성. 퀵 어빌리티 진을 추가로 섞어 전용 진과 쿨감 역시너지를 극대화합니다." }
        ],
        focus: "Proud 보스 토벌 및 터미너스 궁극 무기 획득을 노리는 시기입니다. 65레벨 상한을 다 맞춘 4인 덱 세팅을 정밀 설계합니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapon: { name: "범천 세이크리드 기어 [초월 200레벨]", rating: "★★★★★ (10+/10)", desc: "DLC 라그나로크 최종 무기 초월 200레벨 달성. 막대한 기본 체급 보정 및 추가 슬롯이 열려 최종 버스트 유틸을 지원합니다." },
        skills: "판타즈마고리아 & 테제베 & 알렉산드리아 & 리조마타 고정. 아군 부활 및 상시 공방 30% 증가 버프로 전장을 안정적으로 리드합니다.",
        sigils: [
          { name: "종말의 진 알파", sub: "대체: 추가 대미지 V+", desc: "루시퍼 처치 보상. 파티 버스트 가속 코드 진을 섞어, 칼리오스트로 오의 발동 시 파티원 전체 오의 게이지를 추가 가속합니다." },
          { name: "명경지수 V+", sub: "대체: 수호 V / 고양 V", desc: "저스트 회피 무적 시간과 가드를 늘려 루시퍼/벨제붑의 난해한 즉사 장판 공격을 손쉽게 대처하는 유틸 완성 셋팅." }
        ],
        focus: "최종 DLC 종결 정복. 200레벨 초월작 완수 및 파티 시너지 진 도배로 아군의 클리어 타임을 분 단위로 단축시킵니다.",
        desc: "라그나로크 확장팩의 최종 루시퍼/벨제붑을 격파한 종결 상태입니다. 루시퍼가 드롭하는 종말의 진 2개를 채용해 추가 데미지 상한 30%를 더 뚫어주며, 200레벨 초월 무기의 압도적인 깡공을 기반으로 최종 스펙을 완성합니다."
      }
    ];
    stageData = cagliostroPhases[stepIdx];
  } else if (char.id === "zeta") {
    const zetaPhases = [
      {
        weapon: { name: "브리오낙 [스팅어 무기]", rating: "★★★★☆ (9/10)", desc: "공중 체공 연속 공격(콩콩이) 콤보가 상시 크리티컬로 명중해 딜 편차를 없애기 위한 징검다리 필수 크리 창." },
        skills: "인피니트 원더즈 (알베스 표식 부여용) & 알베스의 공명 (공중 돌진기) 필수 배치. 표식 디버프 ➡️ 도약 ➡️ 공중 콤보 연계를 연습하는 단계.",
        sigils: [
          { name: "크리티컬 확률 V", sub: "대체: 혼신 V / 폭군 V", desc: "스팅어 창과 융합하여 체공 콤보 크리 발생률을 보장하고 깡공 진을 섞어 데미지를 상한치로 밀어 올립니다." },
          { name: "데미지 상한 V", sub: "대체: 스턴 V 1개", desc: "상한 1~2개(30레벨)만 가볍게 채용하며 공중 루프 도중 보스의 그로기 타격을 유도하기 위한 스턴치를 우선 확보합니다." }
        ],
        focus: "초반 공중 콤보 리듬 획득 단계. 인피니트 빔 ➡️ 공명 돌진 ➡️ 타이밍 점프 공격 버튼 연타의 손맛과 피지컬을 조절하는 시기입니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapon: { name: "알베스의 창 [각성 무기/어센션]", rating: "★★★★☆ (8/10)", desc: "150레벨 풀강 및 대장간 10단계 풀각성 달성. 제타의 깡공을 수직 상승시켜 공중 콤보 단발당 상한 도달률을 대폭 끌어올려 줍니다." },
        skills: "인피니트 원더즈 & 알베스의 공명 & 렐름스 마제스티 (적 광역 패턴 튕겨내기 반격기) & 시그노 드라이브 (공격력 증가).",
        sigils: [
          { name: "홍련의 날개 (전용 진)", sub: "대체: 스턴 V 2개", desc: "피니시 적중 시 공격/크리 대폭 상승 전용진 장착. 스턴 V를 본격 2개 이상 배치해 보스의 기절치를 급속 충전합니다." },
          { name: "포션 보유 수 V", sub: "대체: 데미지 상한 V 3개", desc: "안정적인 콤보를 위한 HP 복구용 포션 풀셋팅 및 상한을 45레벨 수준으로 맞춥니다." }
        ],
        focus: "매니악 파밍 단계. 스턴 수치를 극한으로 세팅하여, AI 동료로 세웠을 때 보스가 일어서지 못하도록 눕히는 링크 머신으로 육성합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapon: { name: "게이볼그 [궁극 무기/터미너스]", rating: "★★★★★ (10/10)", desc: "프로토 바하무트 드롭. 제타의 최종 종결 궁극 무기이며, 공중 루프 한 발당 화력을 사기적인 영역까지 끌어올립니다." },
        skills: "인피니트 원더즈 & 알베스의 공명 & 렐름스 마제스티 & 시그노 드라이브 구성. 보스가 날리는 광역기를 카운터 렐름스로 씹으며 맞공격을 날립니다.",
        sigils: [
          { name: "유리 속성 변환", sub: "대체: 추가 대미지 V 3개", desc: "상성 무관 약점 딜 보정. 추가 대미지 V 3개 조합과 결합하여 공중 콩콩이 참격 한 발 한 발을 우주급으로 강화시킵니다." },
          { name: "데미지 상한 V", sub: "대체: 한계돌파 크리 20%", desc: "65레벨 풀셋팅 필수 도달. 한돌로 크리를 당겨와 남은 진 슬롯에 배수/포션/자동부활을 든든하게 다집니다." }
        ],
        focus: "Proud 난이도 프로토 바하무트 토벌작 개시. 각성 무기 10단계 완수를 거쳐 최종 바하무트 무기를 획득하는 데 집중합니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapon: { name: "게이볼그 [초월 200레벨]", rating: "★★★★★ (10+/10)", desc: "DLC 라그나로크 최종 무기 초월 200레벨 달성. 공중 에어 콤보의 물리 타격 데미지를 무지막지하게 보정하며 최종 옵션 슬롯을 확보합니다." },
        skills: "인피니트 원더즈 & 알베스의 공명 & 렐름스 마제스티 & 시그노 드라이브 고정. 루시퍼의 공중 패턴을 함께 날아오르며 요격합니다.",
        sigils: [
          { name: "종말의 진 알파", sub: "대체: 추가 대미지 V+", desc: "루시퍼 처치 보상. 에어 콤보 어빌리티 상한을 추가 돌파하고, 오의 발동 시 파티 시너지를 극대화하는 최종 종결 셋팅." },
          { name: "명경지수 V+", sub: "대체: 수호 V / 고양 V", desc: "공중 카운터 및 지상 저스트 회피 시 쿨다운과 무적 시간을 대폭 연장시켜 안전성과 극딜 순환율을 100% 채워줍니다." }
        ],
        focus: "DLC 라그나로크 최종 정복. 200레벨 무기 초월작 및 루시퍼 종말의 진 풀강을 달성하여 최강 제타 육성을 완성합니다.",
        desc: "라그나로크 확장팩의 최종 루시퍼/벨제붑을 격파한 종결 상태입니다. 루시퍼가 드롭하는 종말의 진 2개를 채용해 추가 데미지 상한 30%를 더 뚫어주며, 200레벨 초월 무기의 압도적인 깡공을 기반으로 최종 스펙을 완성합니다."
      }
    ];
    stageData = zetaPhases[stepIdx];
  } else if (char.id === "beatrix") {
    const beatrixPhases = [
      {
        weapon: { name: "엠블럭스의 검 [스팅어 무기]", rating: "★★★☆☆ (8/10)", desc: "마검 저스트 공격 시 치명타 발생률을 확보하기 위한 크리티컬 특화 징검다리 대검. 초반 마스터리 해금 전 필수 장비." },
        skills: "제피로스 (마검 게이지 즉시 충전 난무) & 임모탈리티 (자가 무적기) 배치. 자가 체력 소모를 제피로스 충전 후 강공 저스트 공격으로 빠르게 극복하는 연습기.",
        sigils: [
          { name: "크리티컬 확률 V", sub: "대체: 배수 V / 포션 보유 V", desc: "크리 100% 셋팅 및 자가 체력 리스크 방지를 위한 포션 보유 수 장착. 피가 깎였을 때 폭딜을 내는 배수 V 1개 채용." },
          { name: "데미지 상한 V", sub: "대체: 체력 V", desc: "상한 진 1개만 임시 기용. 초반 낮은 피통 리스크를 보완하기 위한 가성비 위주 세팅." }
        ],
        focus: "초반 마검 저스트 타이밍 습득 단계. 제피로스로 게이지를 채운 뒤, 어빌 가동 후 정확한 저스트 ㅅ 공격 손맛을 습득하는 구간입니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapon: { name: "에라스티아 [각성 무기/어센션]", rating: "★★★★☆ (8/10)", desc: "150레벨 풀강 및 대장간 10단계 풀각성 달성. 마검 폭딜 수치와 함께 자가 피소모 리스크를 견딜 든든한 깡체력을 대폭 늘려주는 주력 검." },
        skills: "제피로스 & 임모탈리티 & 재밍 (이동 및 회피 무적 시간 버프) & 다크 익스플로전 (방깎 광역 폭발).",
        sigils: [
          { name: "불멸의 신념 (전용 진)", sub: "대체: 배수 V 2개 / 혼신 V", desc: "콤보 공격 시 게이지 소모를 줄이는 전용 진 장착. 피통 상태에 상관없이 균일하게 상한을 치도록 배수와 혼신을 결합해 깡딜을 뻥튀기합니다." },
          { name: "포션 보유 수 V", sub: "대체: 자동 부활 V", desc: "베아트리스의 제1 생명줄. 포션 수 V를 장착해 수시로 안전 피통 범위를 수동 복구합니다." }
        ],
        focus: "매니악 난이도 구간입니다. 한계돌파 개방 및 은천의 빛을 모아 에라스티아 각성 10단계를 빠르게 끝마치는 데 집중합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapon: { name: "플로렌시아 [궁극 무기/터미너스]", rating: "★★★★★ (10/10)", desc: "프로토 바하무트 드롭 최종 대검. 베아트리스의 마검 강화 상태 저스트 참격 딜링을 리링크 한계 데미지 상한선까지 수직 상승시킵니다." },
        skills: "제피로스 & 임모탈리티 & 재밍 & 다크 익스플로전 구성. 적의 맹공 기믹 때 임모탈리티 무적을 키고 맞공격 대칭 딜을 전개합니다.",
        sigils: [
          { name: "유리 속성 변환", sub: "대체: 추가 대미지 V 3개", desc: "상성 우위 강제 속성 변환. 추가 대미지 V 3개와 결합해 저스트 타이밍 참격 한 방 한 방의 폭발력을 전 딜러 중 최강급으로 메웁니다." },
          { name: "데미지 상한 V", sub: "대체: 한계돌파 크리 20%", desc: "65레벨 풀셋팅 도달. 한돌로 크리를 당겨와 남은 진 슬롯에 배수/포션/자동부활을 든든하게 다집니다." }
        ],
        focus: "Proud 최종 단계 및 루시퍼 진입 장벽 돌파. 각성 무기 10단계 완수 후 최종 바하무트 터미너스 무기 획득을 최우선 목표로 잡습니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapon: { name: "플로렌시아 [초월 200레벨]", rating: "★★★★★ (10+/10)", desc: "DLC 라그나로크 최종 무기 초월 200레벨 해금. 마검 강화 저스트 공격력의 물리 캡 수치를 초월 급으로 상향 조정하며 최종 합성 슬롯을 제공." },
        skills: "제피로스 & 임모탈리티 & 재밍 & 다크 익스플로전 고정. 임모탈리티 무적의 딜증가 버프를 연계해 보스를 한순간에 녹여냅니다.",
        sigils: [
          { name: "종말의 진 베타", sub: "대체: 추가 대미지 V+", desc: "루시퍼 처치 보상. 베아트리스의 저스트 강공 막타 물리 딜을 극한으로 돌파시키고 오의 가속을 돕는 최종 종결 진 세팅." },
          { name: "명경지수 V+", sub: "대체: 퀵 어빌리티 V / 맹렬 V", desc: "저스트 회피 시 무적과 쿨감 가속을 극대화하여, 제피로스 및 임모탈리티 무적 쿨을 빠르게 돌려 생존과 버스트 루프를 상시 유지하는 스펙." }
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
        weapon: { name: "스팅어 무기 (크리티컬)", rating: "★★★★☆ (9/10)", desc: "스토리 엔딩 직후 100~150레벨 최우선 강화. 캐릭터 크리티컬 발생 확률 100% 달성을 위한 필수 징검다리 무기." },
        skills: "캐릭터 핵심 딜링 및 생존 자버프 어빌리티 채용. 연계 공격을 연습하는 시기.",
        sigils: [
          { name: "크리티컬 확률 V", sub: "대체: 혼신 V / 폭군 V", desc: "스팅어와 연동해 100% 크리를 맞춰 딜 분산을 방지." },
          { name: "데미지 상한 V", sub: "대체: 공격력 V", desc: "상한 1~2개(30레벨)만 가볍게 세팅하여, 초반 부족한 상한치를 미세 조정하는 데 집중." }
        ],
        focus: "스토리 클리어 직후 단계. 캐릭터 기본 평타와 어빌리티 콤보 리듬을 습득하는 데 치중합니다.",
        desc: "스토리 엔딩을 막 보신 상태입니다. 이 시기에는 데미지 상한선이 낮으므로 무리하게 상한 진을 도배하기보다는 스팅어 무기를 강화하여 크리티컬 확률 100%를 달성하고, 깡공(혼신/폭군) 진을 1~2개 섞어 데미지를 상한선에 안착시키는 것을 목표로 삼습니다."
      },
      {
        weapon: { name: "각성 무기 (어센션)", rating: "★★★★☆ (8/10)", desc: "150레벨 풀강 및 대장간 각성 10단계 달성. 피통과 깡딜을 든든하게 다져 의문사하는 빈도를 대폭 줄여줍니다." },
        skills: "핵심 주력 딜링기 및 파티 방깎/생존 디버프 스킬 세팅.",
        sigils: [
          { name: "캐릭터 전용 진 V", sub: "대체: 포션 보유 수 V", desc: "대장간에서 전용 진을 1순위로 제작. 캐릭터의 전용 고유 성능을 개방합니다." },
          { name: "자동 부활", sub: "대체: 근성 / 수호 진", desc: "1순위 자가 생존용 보험 진을 장착하여 매끄러운 퀘스트 클리어를 도모." }
        ],
        focus: "매니악 난이도 구간입니다. 한계돌파 개방 및 은천의 빛을 본격 수집합니다.",
        desc: "100레벨을 달성하고 마스터리 노드를 끝마치는 구간입니다. 각성 무기를 제작해 피통과 공격력을 탄탄히 확보하고, 대장간에서 전용 진을 합성하여 캐릭터의 고유 기믹 성능을 극대화합니다."
      },
      {
        weapon: { name: "궁극 무기 (터미너스)", rating: "★★★★★ (10/10)", desc: "프로토 바하무트 드롭 최강 장비. 공격력 기본 스탯을 극단적으로 뻥튀기해 줍니다." },
        skills: "보스의 폭딜 카운터 셋팅 및 생존기 적극 기용.",
        sigils: [
          { name: "유리 속성 변환", sub: "대체: 추가 대미지 V 3개", desc: "약점 딜 보정 사기 진. 추가 대미지 V와 결합하여 딜링을 극대화합니다." },
          { name: "데미지 상한 V", sub: "대체: 한계돌파 크리 20%", desc: "65레벨 풀셋팅 완료. 깡딜 상한을 모두 확보합니다." }
        ],
        focus: "Proud 최종 단계 돌입 및 프로토 바하무트에서 터미너스 무기를 획득하는 데 집중합니다.",
        desc: "프라우드 난이도를 뚫고 프로토 바하무트에서 궁극 무기를 파밍하는 시기입니다. 데미지 상한을 65레벨 풀로 채워야 하며, 모든 속성 공격을 약점으로 찌르게 해주는 유리 속성 변환 V를 획득하여 장착하는 것이 핵심입니다."
      },
      {
        weapon: { name: "궁극 무기 또는 DLC 최종 무기 [초월 200레벨]", rating: "★★★★★ (10+/10)", desc: "무기 초월 200레벨 달성. 막대한 기본 체급 보정 및 추가 슬롯을 획득합니다." },
        skills: "오의 체인 가속화 및 링크 타임 버스트 극대화 셋팅.",
        sigils: [
          { name: "종말의 진 (Dark Opus)", sub: "대체: 추가 대미지 V+ 유틸합성", desc: "루시퍼 처치 보상. 어빌리티 대미지 상한을 추가 돌파하고, 오의 발동 시 파티 시너지를 극대화하는 최종 종결 셋팅." },
          { name: "명경지수 V+", sub: "대체: 퀵 어빌리티 V / 맹렬 V", desc: "저스트 회피 시 쿨다운과 무적 시간을 대폭 연장시켜 안전성과 극딜 순환율을 채워줍니다." }
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
          ${char.skills.map(sk => `<li><strong>${sk.name}</strong>: ${sk.desc}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  // Draw Card 2: 권장 무기 세팅
  const card2 = document.getElementById("detail-card-2");
  card2.innerHTML = `
    <h3>권장 무기 및 강화 레벨</h3>
    <div class="weapon-box">
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11.5px; margin-bottom: 3px;">
        <span style="color: var(--accent-color);">${stageData.weapon.name}</span>
        <span style="color: #e28743;">추천도: ${stageData.weapon.rating}</span>
      </div>
      <p style="font-size: 12.5px; color: var(--text-secondary); margin-top: 4px; line-height: 1.45;">${stageData.weapon.desc}</p>
    </div>
  `;

  // Draw Card 3: 추천 진 세팅 및 대체 진 가이드
  const card3 = document.getElementById("detail-card-3");
  card3.innerHTML = "<h3>추천 진 및 대체재 목록</h3>";
  const ul = document.createElement("ul");
  stageData.sigils.forEach(sig => {
    ul.innerHTML += `
      <li style="margin-bottom: 10px; border-bottom: 1px dashed rgba(226,232,240,0.1); padding-bottom: 8px;">
        <div style="font-weight: 600; font-size: 13px; display: flex; justify-content: space-between; margin-bottom: 2px; align-items: center;">
          <span style="color: var(--accent-color);">${sig.name}</span>
          <span style="font-size: 10.5px; background: var(--badge-bg); color: var(--badge-text); padding: 1px 6px; border-radius: 4px;">추천/대체: ${sig.sub}</span>
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
}

function closeModal() {
  const modal = document.getElementById("detail-modal");
  modal.classList.remove("active");
}
