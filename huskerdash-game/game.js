/* Husker Dash: A Semester at UNL
 * A Diner Dash-style game. Plain JavaScript + <canvas>, no libraries.
 */
(() => {
'use strict';

const W = 960, H = 560;
const canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');

/* ============================================================
 * DATA: customer types, shelves, levels, upgrades
 * ============================================================ */
const TYPES = {
  freshman: { name: 'Freshman',      color: '#7FB3D5', decay: 0.10, eat: 1.25, tip: 1.0, sizes: [1, 2], acc: 'lanyard',
              desc: 'Patient, but slow.' },
  athlete:  { name: 'Athlete',       color: '#F5B041', decay: 0.16, eat: 0.6,  tip: 1.3, sizes: [1, 2], acc: 'band',
              desc: 'Finishes fast, tips well.' },
  grad:     { name: 'Grad Student',  color: '#8E7CC3', decay: 0.25, eat: 1.0,  tip: 1.7, sizes: [1],    acc: 'glasses',
              desc: 'Very impatient. Very generous.' },
  group:    { name: 'Study Group',   color: '#58D68D', decay: 0.13, eat: 1.1,  tip: 1.1, sizes: [3, 4], acc: 'none',
              desc: 'Needs a 4-seat table.' },
  fans:     { name: 'Game Day Fans', color: '#E03C31', decay: 0.18, eat: 0.8,  tip: 1.25, sizes: [3, 4], acc: 'paint',
              desc: 'Loud, hungry, kickoff is soon!' },
};

const SHELVES = [
  { id: 'red',   hex: '#C0392B', label: 'A–F' },
  { id: 'blue',  hex: '#2E86C1', label: 'G–M' },
  { id: 'green', hex: '#239B56', label: 'N–S' },
  { id: 'gold',  hex: '#D4AC0D', label: 'T–Z' },
];
const shelfHex = id => (SHELVES.find(s => s.id === id) || SHELVES[0]).hex;
const shelfLabel = id => (SHELVES.find(s => s.id === id) || SHELVES[0]).label;

const TABLE_SPOTS = [
  { x: 280, y: 120 }, { x: 470, y: 120 }, { x: 660, y: 120 },
  { x: 280, y: 292 }, { x: 470, y: 292 }, { x: 660, y: 292 },
  { x: 280, y: 464 }, { x: 470, y: 464 }, { x: 660, y: 464 },  // bottom row: for tables you buy
];
const EXTRA_SPOT_ORDER = [7, 6, 8, 1, 4, 3, 5, 0, 2];

const DN = 'https://www.dailynebraskan.com';
const LEVELS = [
  {
    name: 'Shift 1: Breakfast', place: 'Cather Dining Center', week: 'Week 1',
    mode: 'dining', theme: 'dining', tutorial: true,
    blurb: 'Your first shift! Seat students, take orders to the kitchen, serve food, collect tips and clear tables.',
    tables: [{ spot: 0, seats: 2 }, { spot: 1, seats: 2 }, { spot: 4, seats: 4 }],
    customers: 8, spawn: [7, 10], cook: [3, 4.5], pace: 0.9,
    mix: { freshman: 5, athlete: 3, group: 1 },
    goal: 120, expert: 200,
    story: {
      title: 'Food frenzy: a battle of the UNL dining halls',
      url: DN + '/culture/food-frenzy-a-battle-of-the-unl-dining-halls/article_51472e3a-28c7-439d-8ed0-50dd4ee03110.html',
      date: 'Fall 2026',
      summary: 'About two months into the fall semester, the Daily Nebraskan asked UNL students to name their favorite places to eat on campus. Harper\'s unique menu and Cather\'s welcoming atmosphere both made the list.',
    },
    flash: { text: 'Word is out: students love Cather\'s welcoming vibe. Happy diners tip 50% more for 15 seconds!', effect: 'tips' },
    quiz: { q: 'In "Food frenzy," what did the Daily Nebraskan ask students to share?', options: ['Their favorite places to eat on campus', 'Their least favorite classes', 'How many meal swipes they have left', 'Their favorite study spots'], answer: 0 },
  },
  {
    name: 'Shift 2: Late Night', place: 'Harper Dining Hall', week: 'Week 3',
    mode: 'dining', theme: 'dining',
    blurb: 'It\'s the late-night shift at Harper, and everyone skipped dinner to study. Grad students start showing up, and they hate waiting.',
    tables: [{ spot: 0, seats: 2 }, { spot: 1, seats: 2 }, { spot: 3, seats: 4 }, { spot: 4, seats: 2 }],
    customers: 12, spawn: [5, 7.5], cook: [3.5, 5], pace: 1.0,
    mix: { freshman: 3, athlete: 3, group: 2, grad: 2 },
    goal: 220, expert: 330,
    story: {
      title: 'Dig in to Harper Dining Hall\'s late night menu',
      url: DN + '/culture/dig-in-to-harper-dining-hall-s-late-night-menu/article_61da9724-ca41-444b-a14f-21089fa32954.html',
      date: 'Fall 2026',
      summary: 'The Daily Nebraskan reviewed Harper\'s late-night options for students who skip dinner to study. Harper Smokehouse and Varsity Pizza stay open from 8:30 to 10:30 p.m., and the classic Harper smashburger is the star.',
    },
    flash: { text: 'Smashburger craving! A late-night rush is heading to Harper. Students arrive faster for a bit!', effect: 'rush' },
    quiz: { q: 'Which two late-night spots at Harper did the Daily Nebraskan review?', options: ['Runza and Chick-fil-A', 'Harper Smokehouse and Varsity Pizza', 'Valentino\'s and Imperial Palace', 'Husker Heroes and Sossy'], answer: 1 },
  },
  {
    name: 'Shift 3: Midterm Fuel', place: 'Nebraska Union', week: 'Midterms',
    mode: 'dining', theme: 'union',
    blurb: 'Midterms are here. Half the Union is still behind construction walls, so everyone is squeezing into what\'s open.',
    tables: [{ spot: 0, seats: 2 }, { spot: 1, seats: 2 }, { spot: 2, seats: 2 }, { spot: 3, seats: 4 }, { spot: 4, seats: 4 }],
    customers: 14, spawn: [4.2, 6.2], cook: [3.5, 5], pace: 1.1,
    mix: { grad: 4, freshman: 3, athlete: 2, group: 3 },
    goal: 260, expert: 400,
    story: {
      title: 'Nebraska Union to open new dining options in spring 2027 after delays',
      url: DN + '/news/nebraska-union-to-open-new-dining-options-in-spring-2027-after-delays/article_1f908b50-961d-4838-ba8b-e999b6fed244.html',
      date: 'Nov. 2026',
      summary: 'Construction delays pushed back the Union\'s five renovated restaurants, which were supposed to be done this fall. University Dining Services now plans to open them in stages starting in January 2027.',
    },
    flash: { text: 'Construction delays mean fewer places to eat, so everyone is crowding the Union. Students arrive faster for a bit!', effect: 'rush' },
    quiz: { q: 'According to the Daily Nebraskan, when will the Union\'s new restaurants start opening?', options: ['Next week', 'Fall 2026, on schedule', 'January 2027, after construction delays', 'They were canceled'], answer: 2 },
  },
  {
    name: 'Shift 4: Game Day', place: 'Nebraska Union', week: 'Game Day',
    mode: 'dining', theme: 'gameday',
    blurb: 'It\'s Saturday and the whole state is in town wearing red. Big groups, short patience. Go Big Red!',
    tables: [{ spot: 0, seats: 2 }, { spot: 1, seats: 4 }, { spot: 2, seats: 2 }, { spot: 3, seats: 4 }, { spot: 4, seats: 4 }, { spot: 5, seats: 2 }],
    customers: 18, spawn: [3.6, 5.4], cook: [3, 4.5], pace: 1.05,
    mix: { fans: 5, athlete: 2, freshman: 2, grad: 1 },
    goal: 340, expert: 540,
    story: {
      title: 'RODRIGUEZ: Nebraska football dominates Bowling Green, but wants more',
      url: DN + '/sports/rodriguez-nebraska-football-dominates-bowling-green-but-wants-more/article_5e85701c-7638-4de1-98f8-7fde0194cf88.html',
      date: 'Sept. 2026',
      summary: 'Nebraska beat Bowling Green 56-7 on Sept. 12, 2026, in front of 86,193 fans at Memorial Stadium, a night game with the season\'s first light show.',
    },
    flash: { text: 'The game just ended and 86,193 fans are pouring out of Memorial Stadium. Sea of red incoming!', effect: 'rush' },
    quiz: { q: 'How many fans watched Nebraska beat Bowling Green 56-7?', options: ['27,188', '86,193', '92,003', '18,000'], answer: 1 },
  },
  {
    name: 'Shift 5: Finals Week', place: 'Love Library Help Desk', week: 'Finals Week',
    mode: 'library', theme: 'library', tutorial: true,
    blurb: 'New job! Seat students at study tables, find out which book they need, grab it from the right shelf by call number, then reshelve it when they\'re done.',
    tables: [{ spot: 0, seats: 2 }, { spot: 1, seats: 2 }, { spot: 2, seats: 2 }, { spot: 3, seats: 4 }, { spot: 4, seats: 4 }, { spot: 5, seats: 2 }],
    customers: 16, spawn: [3.8, 5.6], pace: 1.15,
    mix: { grad: 4, freshman: 3, athlete: 2, group: 3 },
    goal: 300, expert: 460,
    story: {
      title: 'University of Nebraska-Lincoln to replace Love Library Dunkin\' in 2027',
      url: DN + '/news/university-of-nebraska-lincoln-to-replace-love-library-dunkin-in-2027/article_ee302f47-dc6b-4009-bfb8-052fabcb7621.html',
      date: 'Nov. 10, 2026',
      summary: 'Campus\'s last Dunkin\', in Love Library\'s Adele Hall Learning Commons since 2016, is on its way out. Starting in early 2027, a cafe run by University Dining Services will replace it, and students will be able to use their meal plans there.',
    },
    flash: { text: 'Word is out that Dunkin\' is leaving Love Library, so everyone is stopping by for one last coffee and a study table. Students arrive faster for a bit!', effect: 'rush' },
    quiz: { q: 'What will replace the Dunkin\' in Love Library in early 2027?', options: ['A Starbucks', 'A university-run cafe that takes meal plans', 'A Runza', 'More study rooms, no food'], answer: 1 },
  },
];

// Extra Daily Nebraskan reporting used in the menus
const DN_EXTRA = {
  wages: { title: 'What does UNL want in its next chancellor?', url: DN + '/news/what-does-unl-want-in-its-next-chancellor/article_fd5c754c-73d8-4974-bf69-dcf300d0a030.html', date: 'Nov. 16, 2026' },
  library: { title: 'University of Nebraska-Lincoln to open off-campus library', url: DN + '/news/university-of-nebraska-lincoln-to-open-off-campus-library/article_52f778cf-0fd4-499e-98bf-503dfbb85335.html', date: 'Nov. 2, 2026' },
  finale: { title: 'UNL event planning class to host casino style event during Big Red Finale', url: DN + '/culture/student_arts/unl-event-planning-class-to-host-casino-style-event-during-big-red-finale/article_bb3aa755-4a90-4aad-ad61-121909e59d0d.html', date: 'Nov. 2026' },
};

const UPGRADES = [
  { id: 'shoes',   icon: '👟', name: 'Running Shoes',  costs: [120, 220, 360], desc: n => `Move ${15 * n}% faster across the floor.` },
  { id: 'coffee',  icon: '☕', name: 'Free Coffee',     costs: [200, 380],      desc: n => `Customers lose patience ${12 * n}% slower.` },
  { id: 'tray',    icon: '🍽️', name: 'Bigger Tray',    costs: [320, 650],      desc: n => `Carry ${2 + n} items at once.` },
  { id: 'tipjar',  icon: '🫙', name: 'Tip Jar',         costs: [150, 300, 480], desc: n => `Every tip is ${10 * n}% bigger.` },
  { id: 'kitchen', icon: '🔥', name: 'Express Kitchen', costs: [180, 340],      desc: n => `Food cooks ${20 * n}% faster (dining shifts).` },
  { id: 'menus',   icon: '📋', name: 'Faster Menus',    costs: [140],           desc: n => `Students decide ${40 * n}% faster after sitting down.` },
  { id: 'mat',     icon: '🚪', name: 'Welcome Mat',     costs: [160],           desc: n => `Students waiting in line stay patient ${30 * n}% longer.` },
  { id: 'lanyard', icon: '🍀', name: 'Lucky Lanyard',   costs: [260],           desc: n => `Chain bonuses are worth ${n + 1}x as much.` },
  { id: 'tables',  icon: '🪑', name: 'Extra Table',     costs: [250, 450, 700], desc: n => `${n} extra 2-seat table${n > 1 ? 's' : ''} on the floor every shift.` },
  { id: 'bigtables', icon: '🛋️', name: 'Big Tables',   costs: [200, 400],      desc: n => `${n} small table${n > 1 ? 's' : ''} upgraded to seat 4 every shift.` },
];
const lvl = id => Math.min(Number(save.upgrades[id] || 0), (UPGRADES.find(u => u.id === id) || { costs: [] }).costs.length);
const totalUpgrades = () => UPGRADES.reduce((a, u) => a + lvl(u.id), 0);
const RANKS = [[0, 'Trainee'], [2, 'Crew Member'], [5, 'Shift Lead'], [9, 'Assistant Manager'], [14, 'Manager']];
function rankName() { let r = RANKS[0][1]; for (const [n, name] of RANKS) if (totalUpgrades() >= n) r = name; return r; }

// Locker: things to change your worker's look
const LOOKS = {
  shirt: [
    { id: 'scarlet', name: 'Classic Scarlet', cost: 0,   color: '#D00000' },
    { id: 'cream',   name: 'Cream',           cost: 0,   color: '#EFE6D2' },
    { id: 'black',   name: 'Blackout Tee',    cost: 150, color: '#222222' },
    { id: 'stripes', name: 'Game Day Stripes',cost: 200, color: 'stripes' },
    { id: 'denim',   name: 'Denim Jacket',    cost: 120, color: '#4A6FA5' },
  ],
  hat: [
    { id: 'cap',     name: 'Red Cap',      cost: 0 },
    { id: 'none',    name: 'No Hat',       cost: 0 },
    { id: 'beanie',  name: 'Beanie',       cost: 80 },
    { id: 'chef',    name: 'Chef Hat',     cost: 140 },
    { id: 'corn',    name: 'Corn Hat',     cost: 250 },
    { id: 'phones',  name: 'Headphones',   cost: 100 },
  ],
  extra: [
    { id: 'none',    name: 'Nothing',      cost: 0 },
    { id: 'shades',  name: 'Sunglasses',   cost: 60 },
    { id: 'glasses', name: 'Study Glasses',cost: 40 },
    { id: 'name',    name: 'Name Tag',     cost: 30 },
  ],
  skin: ['#FFDBAC', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3A1E'],
  hair: ['#1A1A1A', '#5A3825', '#A0522D', '#E5C07B', '#B83A1B', '#8E8E8E'],
};
function look() {
  save.look = Object.assign({ shirt: 'scarlet', hat: 'cap', extra: 'none', skin: '#E0AC69', hair: '#5A3825', name: '' }, save.look || {});
  save.owned = save.owned || {};
  return save.look;
}
function ownsLook(slot, id) { const it = LOOKS[slot].find(x => x.id === id); return it && (it.cost === 0 || (save.owned || {})[slot + ':' + id]); }
function workerName() { return (look().name || '').trim() || 'Student worker'; }


const SKINS = ['#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#FFDBAC', '#D2A07A'];
const HAIRS = ['#2C1B10', '#5A3825', '#A0522D', '#E5C07B', '#1A1A1A', '#7B3F00'];
const FOODS = ['#E67E22', '#C0392B', '#F4D03F', '#27AE60', '#A04000', '#E59866'];

/* ============================================================
 * SAVE DATA (localStorage, wrapped so it never breaks the game)
 * ============================================================ */
const SAVE_KEY = 'huskerdash-save-v1';
function freshSave() { return { unlocked: 0, bank: 0, stars: [0, 0, 0, 0, 0], upgrades: {} }; }
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s.unlocked === 'number') return Object.assign(freshSave(), s);
  } catch (e) {}
  return freshSave();
}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
let save = loadSave();

/* ============================================================
 * SOUND (tiny WebAudio beeps)
 * ============================================================ */
let audio = null, muted = false;
try { muted = localStorage.getItem('huskerdash-muted') === '1'; } catch (e) {}
function beep(freq, dur = 0.08, type = 'sine', vol = 0.12, delay = 0) {
  if (muted) return;
  try {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime + delay;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(audio.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch (e) {}
}
const SFX = {
  door:   () => { beep(880, 0.08); beep(660, 0.12, 'sine', 0.1, 0.09); },
  seat:   () => beep(520, 0.07, 'triangle'),
  ready:  () => beep(990, 0.06, 'square', 0.05),
  order:  () => beep(620, 0.07, 'triangle'),
  serve:  () => { beep(700, 0.06, 'triangle'); beep(940, 0.08, 'triangle', 0.1, 0.06); },
  cash:   () => { beep(1200, 0.06, 'square', 0.06); beep(1600, 0.1, 'square', 0.06, 0.07); },
  bus:    () => beep(300, 0.07, 'triangle'),
  drop:   () => beep(420, 0.05, 'triangle'),
  error:  () => beep(160, 0.15, 'sawtooth', 0.06),
  angry:  () => { beep(220, 0.15, 'sawtooth', 0.07); beep(150, 0.2, 'sawtooth', 0.07, 0.14); },
  win:    () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.14, 'triangle', 0.12, i * 0.12)),
  lose:   () => [392, 330, 262].forEach((f, i) => beep(f, 0.2, 'triangle', 0.12, i * 0.16)),
};

/* ============================================================
 * HELPERS
 * ============================================================ */
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function weighted(mix) {
  let tot = 0; for (const k in mix) tot += mix[k];
  let r = Math.random() * tot;
  for (const k in mix) { r -= mix[k]; if (r <= 0) return k; }
  return Object.keys(mix)[0];
}
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function inRect(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
function text(str, x, y, size = 14, color = '#2B2B2B', align = 'center', weight = '700') {
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/* ============================================================
 * STATIONS (positions depend on mode)
 * ============================================================ */
const DINING_ST = {
  kitchen: { x: 790, y: 24,  w: 150, h: 120, stand: { x: 765, y: 90 } },
  pickup:  { x: 790, y: 168, w: 150, h: 190, stand: { x: 765, y: 262 } },
  dish:    { x: 790, y: 430, w: 150, h: 100, stand: { x: 765, y: 480 } },
};
const LIB_ST = {
  shelves: SHELVES.map((s, i) => ({ id: s.id, x: 800, y: 16 + i * 100, w: 140, h: 86, stand: { x: 775, y: 59 + i * 100 } })),
  cart: { x: 800, y: 432, w: 140, h: 100, stand: { x: 775, y: 482 } },
};
function plateSlotPos(i) {
  const st = DINING_ST.pickup;
  return { x: st.x + 42 + (i % 2) * 66, y: st.y + 52 + Math.floor(i / 2) * 52 };
}
const LINE_SLOT = i => ({ x: 14, y: 30 + i * 122, w: 168, h: 112 });
const MAX_LINE = 4;

/* ============================================================
 * GAME STATE
 * ============================================================ */
let S = null;              // current level state
let screen = 'title';      // title | intro | play | paused | results | shop | final | how
let selected = null;       // group selected in line
let drag = null;           // { g, x, y, sx, sy, moved }
let hover = null;

function maxHands() { return 2 + lvl('tray'); }
function speed() { return 230 * (1 + 0.15 * lvl('shoes')); }
function decayMult() { return (1 - 0.12 * lvl('coffee')) * S.L.pace; }

function startLevel(idx) {
  const L = LEVELS[idx];
  S = {
    idx, L, mode: L.mode, t: 0, money: 0, chain: 0, lastAct: null,
    spawned: 0, spawnT: 1.0, line: [],
    tables: buildTables(L),
    tickets: [], cooking: [], plates: [],
    player: { x: 470, y: 200, hands: [], queue: [], busy: 0, face: 1, walk: 0 },
    floats: [], served: 0, walkouts: 0, ended: false, endT: 0, nextId: 1,
    maxSeats: Math.max(...L.tables.map(t => t.seats)),
    extraTables: lvl('tables'),
    seenHint: {}, flashed: false, boost: null,
  };
  selected = null; drag = null;
  updateHud();
}

// Level tables + any tables bought in the shop
function buildTables(L) {
  const layout = L.tables.map(d => ({ spot: d.spot, seats: d.seats }));
  const used = new Set(layout.map(d => d.spot));
  const free = EXTRA_SPOT_ORDER.filter(i => !used.has(i));
  for (let i = 0; i < lvl('tables') && free.length; i++) layout.push({ spot: free.shift(), seats: 2, bought: true });
  let big = lvl('bigtables');
  for (const d of layout) if (big > 0 && d.seats === 2) { d.seats = 4; d.upsized = true; big--; }
  layout.sort((a, b) => a.spot - b.spot);
  return layout.map((d, i) => ({ n: i + 1, x: TABLE_SPOTS[d.spot].x, y: TABLE_SPOTS[d.spot].y, seats: d.seats, bought: !!d.bought, group: null, dirty: false, dirtyColor: null }));
}

function spawnGroup() {
  const type = weighted(S.L.mix);
  const T = TYPES[type];
  const size = Math.min(pick(T.sizes), S.maxSeats);
  const members = [];
  for (let i = 0; i < size; i++) members.push({ skin: pick(SKINS), hair: pick(HAIRS) });
  const g = { id: S.nextId++, type, size, hearts: 5, state: 'line', timer: 0, table: null, need: null, served: false, members, food: pick(FOODS), bob: Math.random() * 6 };
  S.line.push(g);
  S.spawned++;
  SFX.door();
}

function addFloat(x, y, str, color = '#1E8449', size = 16) {
  S.floats.push({ x, y, str, color, size, t: 0 });
}

let toastTimer = 0;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  toastTimer = 1.4;
  SFX.error();
}

let flashTimer = null;
function showFlash(msg) {
  const el = document.getElementById('flash');
  el.innerHTML = `<span class="flash-tag">DN NEWS FLASH</span> ${msg}`;
  el.classList.add('show');
  beep(880, 0.1, 'square', 0.06); beep(1175, 0.15, 'square', 0.06, 0.12);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove('show'), 5000);
}

/* Scoring: doing the same kind of action back-to-back builds a chain bonus. */
function act(type, base, x, y) {
  if (S.lastAct === type) S.chain++; else { S.chain = 1; S.lastAct = type; }
  const bonus = S.chain >= 2 ? Math.min(25, (S.chain - 1) * 3) * (1 + lvl('lanyard')) : 0;
  S.money += base + bonus;
  if (base > 0) addFloat(x, y, '+$' + base);
  if (bonus) addFloat(x, y - 20, `Chain x${S.chain}! +$${bonus}`, '#D00000', 14);
  updateHud();
}

/* ---------- seating ---------- */
function canSeat(g, t) { return !t.group && !t.dirty && t.seats >= g.size; }
function trySeat(g, t) {
  if (!g || g.state !== 'line') return false;
  if (t.group) { toast('That table is taken!'); return false; }
  if (t.dirty) { toast('Clear that table first!'); return false; }
  if (t.seats < g.size) { toast(`Party of ${g.size} needs a bigger table!`); return false; }
  S.line.splice(S.line.indexOf(g), 1);
  g.state = 'reading'; g.timer = rand(2.5, 4) * (1 - 0.4 * lvl('menus')); g.table = t; t.group = g;
  g.hearts = Math.min(5, g.hearts + 0.5);
  act('seat', 2 * g.size, t.x, t.y - 30);
  SFX.seat();
  return true;
}

function walkout(g) {
  if (g.state === 'line') {
    S.line.splice(S.line.indexOf(g), 1);
    addFloat(100, LINE_SLOT(0).y + 40, 'Left the line!', '#C0392B');
  } else {
    const t = g.table;
    t.group = null;
    if (g.served) { t.dirty = true; t.dirtyColor = g.need; }
    addFloat(t.x, t.y - 30, 'Walked out!', '#C0392B');
  }
  g.state = 'gone';
  S.tickets = S.tickets.filter(k => k.groupId !== g.id);
  S.walkouts++;
  S.chain = 0; S.lastAct = null;
  SFX.angry();
}

function groupById(id) {
  for (const t of S.tables) if (t.group && t.group.id === id) return t.group;
  return null;
}

/* ---------- player actions ---------- */
function enqueue(q) {
  const p = S.player;
  if (p.queue.length >= 8) { toast('Too many things queued!'); return; }
  p.queue.push(q);
}

function targetPos(q) {
  switch (q.kind) {
    case 'table':   return { x: q.t.x, y: q.t.y + 66 };
    case 'kitchen': return DINING_ST.kitchen.stand;
    case 'pickup':  return DINING_ST.pickup.stand;
    case 'dish':    return DINING_ST.dish.stand;
    case 'shelf':   return LIB_ST.shelves.find(s => s.id === q.color).stand;
    case 'cart':    return LIB_ST.cart.stand;
  }
  return { x: S.player.x, y: S.player.y };
}

function arrive(q) {
  const p = S.player;
  const full = p.hands.length >= maxHands();
  switch (q.kind) {
    case 'table': {
      const t = q.t, g = t.group;
      if (g) {
        if (g.state === 'ready') {
          g.state = 'waiting';
          g.hearts = Math.min(5, g.hearts + 0.5);
          if (S.mode === 'dining') {
            S.tickets.push({ groupId: g.id, table: t.n });
          } else {
            g.need = pick(SHELVES).id;
          }
          act('order', 3, t.x, t.y - 30); SFX.order();
        } else if (g.state === 'waiting') {
          const i = p.hands.findIndex(h => S.mode === 'dining'
            ? (h.kind === 'food' && h.groupId === g.id)
            : (h.kind === 'book' && h.color === g.need));
          if (i >= 0) {
            p.hands.splice(i, 1);
            g.state = 'eating'; g.served = true;
            g.timer = rand(5, 7) * TYPES[g.type].eat; g.total = g.timer;
            g.hearts = Math.min(5, g.hearts + 1);
            act('serve', 4, t.x, t.y - 30); SFX.serve();
          } else if (S.mode === 'dining') {
            const ticketed = S.tickets.some(k => k.groupId === g.id);
            toast(ticketed ? 'Take their order to the kitchen first!' : 'Their food isn\'t in your hands yet!');
          } else {
            toast(`They need a ${g.need.toUpperCase()} book (${shelfLabel(g.need)})!`);
          }
        } else if (g.state === 'paying') {
          const T = TYPES[g.type];
          const tip = Math.round(g.size * 7 * (0.3 + 0.7 * g.hearts / 5) * T.tip * (1 + 0.1 * lvl('tipjar')) * (S.boost && S.boost.type === 'tips' ? 1.5 : 1));
          t.group = null; t.dirty = true; t.dirtyColor = g.need; g.state = 'gone';
          S.served++;
          act('collect', tip, t.x, t.y - 30); SFX.cash();
        }
      } else if (t.dirty) {
        if (full) { toast('Your hands are full!'); break; }
        p.hands.push(S.mode === 'dining' ? { kind: 'dishes' } : { kind: 'return', color: t.dirtyColor || 'red' });
        t.dirty = false; t.dirtyColor = null;
        act('bus', 2, t.x, t.y - 30); SFX.bus();
      }
      break;
    }
    case 'kitchen': {
      if (!S.tickets.length) { toast('No orders to drop off.'); break; }
      for (const k of S.tickets) {
        const total = rand(S.L.cook[0], S.L.cook[1]) * (1 - 0.2 * lvl('kitchen'));
        S.cooking.push({ groupId: k.groupId, table: k.table, t: total, total });
      }
      act('drop', S.tickets.length, DINING_ST.kitchen.stand.x, DINING_ST.kitchen.stand.y - 30);
      S.tickets = [];
      SFX.drop();
      break;
    }
    case 'pickup': {
      if (!S.plates.length) { toast('No food is ready yet.'); break; }
      if (full) { toast('Your hands are full!'); break; }
      let i = S.plates.findIndex(pl => pl.id === q.plateId);
      if (i < 0) i = 0;
      const pl = S.plates.splice(i, 1)[0];
      p.hands.push({ kind: 'food', groupId: pl.groupId, table: pl.table, color: pl.color });
      SFX.drop();
      break;
    }
    case 'dish': {
      const keep = [], drop = [];
      for (const h of p.hands) {
        const stale = h.kind === 'food' && !groupById(h.groupId);
        (h.kind === 'dishes' || stale ? drop : keep).push(h);
      }
      if (!drop.length) { toast('Nothing to drop off here.'); break; }
      p.hands = keep;
      act('drop', drop.length, DINING_ST.dish.stand.x, DINING_ST.dish.stand.y - 30);
      SFX.drop();
      break;
    }
    case 'shelf': {
      const i = p.hands.findIndex(h => h.kind === 'book' && h.color === q.color);
      if (!full) { p.hands.push({ kind: 'book', color: q.color }); SFX.drop(); }
      else if (i >= 0) { p.hands.splice(i, 1); addFloat(p.x, p.y - 40, 'Put it back', '#555', 13); }
      else toast('Your hands are full!');
      break;
    }
    case 'cart': {
      const n = p.hands.filter(h => h.kind === 'return').length;
      if (!n) { toast('No books to reshelve.'); break; }
      p.hands = p.hands.filter(h => h.kind !== 'return');
      act('drop', n * 2, LIB_ST.cart.stand.x, LIB_ST.cart.stand.y - 30);
      SFX.drop();
      break;
    }
  }
}

/* ============================================================
 * UPDATE
 * ============================================================ */
const DECAY_STATE = { line: 0.7, ready: 1.0, waiting: 0.75, paying: 0.9 };

function update(dt) {
  if (!S || screen !== 'play') return;
  S.t += dt;

  // arrivals
  if (S.spawned < S.L.customers) {
    S.spawnT -= dt;
    if (S.spawnT <= 0 && S.line.length < MAX_LINE) {
      spawnGroup();
      S.spawnT = rand(S.L.spawn[0], S.L.spawn[1]) * (S.boost && S.boost.type === 'rush' ? 0.6 : 1);
    }
  }

  // Daily Nebraskan news flash, about a third of the way through the shift
  if (!S.flashed && S.L.flash && S.spawned >= Math.ceil(S.L.customers * 0.35)) {
    S.flashed = true;
    S.boost = { type: S.L.flash.effect, t: S.L.flash.effect === 'rush' ? 12 : 15 };
    if (S.boost.type === 'rush') S.spawnT = Math.min(S.spawnT, 0.8);
    showFlash(S.L.flash.text);
  }
  if (S.boost) { S.boost.t -= dt; if (S.boost.t <= 0) S.boost = null; }

  // customers
  const all = [...S.line, ...S.tables.filter(t => t.group).map(t => t.group)];
  for (const g of all) {
    g.bob += dt;
    const m = DECAY_STATE[g.state] * (g.state === 'line' ? 1 - 0.3 * lvl('mat') : 1);
    if (m) g.hearts -= TYPES[g.type].decay * m * decayMult() * dt;
    if (g.state === 'reading') {
      g.timer -= dt;
      if (g.timer <= 0) { g.state = 'ready'; SFX.ready(); }
    } else if (g.state === 'eating') {
      g.timer -= dt;
      if (g.timer <= 0) { g.state = 'paying'; SFX.ready(); }
    }
    if (g.hearts <= 0 && g.state !== 'gone') walkout(g);
  }

  // kitchen
  for (const c of S.cooking) c.t -= dt;
  for (let i = 0; i < S.cooking.length; i++) {
    const c = S.cooking[i];
    if (c.t <= 0 && S.plates.length < 6) {
      const g = groupById(c.groupId);
      S.plates.push({ id: S.nextId++, groupId: c.groupId, table: c.table, color: g ? g.food : pick(FOODS) });
      S.cooking.splice(i, 1); i--;
      beep(1320, 0.05, 'triangle', 0.08);
    }
  }
  // stale plates for customers who left get tossed automatically after a while
  S.plates = S.plates.filter(pl => {
    if (groupById(pl.groupId)) { pl.stale = 0; return true; }
    pl.stale = (pl.stale || 0) + dt;
    return pl.stale < 6;
  });

  // player
  const p = S.player;
  if (p.busy > 0) p.busy -= dt;
  else if (p.queue.length) {
    const q = p.queue[0];
    const pos = targetPos(q);
    const dx = pos.x - p.x, dy = pos.y - p.y, d = Math.hypot(dx, dy);
    const step = speed() * dt;
    if (d <= step) {
      p.x = pos.x; p.y = pos.y;
      p.queue.shift();
      arrive(q);
      p.busy = 0.18;
    } else {
      p.x += dx / d * step; p.y += dy / d * step;
      if (Math.abs(dx) > 2) p.face = dx < 0 ? -1 : 1;
      p.walk += dt;
    }
  }

  // floating text
  for (const f of S.floats) f.t += dt;
  S.floats = S.floats.filter(f => f.t < 1.3);

  // toast
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) document.getElementById('toast').classList.remove('show'); }

  // end of shift?
  const busyTables = S.tables.some(t => t.group);
  if (S.spawned >= S.L.customers && !S.line.length && !busyTables) {
    S.endT += dt;
    if (S.endT > 1.2) endLevel();
  }

  updateHint();
  updateHudLive();
}

/* ============================================================
 * DRAW
 * ============================================================ */
function drawFloor() {
  const th = S.L.theme;
  if (th === 'library') {
    ctx.fillStyle = '#C9A57A'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(90,60,30,.25)'; ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 28) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      const off = (y / 28) % 2 ? 0 : 60;
      for (let x = off; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 28); ctx.stroke(); }
    }
    ctx.fillStyle = '#7B2D26'; rr(200, 30, 560, 500, 18); ctx.fill();
    ctx.strokeStyle = '#E8C77A'; ctx.lineWidth = 3; rr(210, 40, 540, 480, 14); ctx.stroke();
    return;
  }
  const pal = {
    dining:  ['#F3EBDD', '#E9DDC8'],
    union:   ['#E6EBEF', '#D6DEE4'],
    gameday: ['#F5F1E7', '#F1D6D2'],
  }[th] || ['#F3EBDD', '#E9DDC8'];
  const s = 40;
  for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
    ctx.fillStyle = ((x + y) / s) % 2 ? pal[0] : pal[1];
    ctx.fillRect(x, y, s, s);
  }
  if (th === 'gameday') {
    // pennant bunting
    for (let x = 200; x < 770; x += 30) {
      ctx.fillStyle = (x / 30) % 2 ? '#D00000' : '#F5F1E7';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 28, 0); ctx.lineTo(x + 14, 22); ctx.closePath(); ctx.fill();
    }
    text('GO BIG RED!', 475, 264, 34, 'rgba(208,0,0,.10)', 'center', '900');
  }
  if (th === 'union') text('THE UNION', 475, 264, 34, 'rgba(0,0,0,.06)', 'center', '900');
}

function drawLineArea() {
  ctx.fillStyle = 'rgba(208,0,0,.08)'; rr(8, 8, 180, 544, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(208,0,0,.35)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; rr(8, 8, 180, 544, 14); ctx.stroke(); ctx.setLineDash([]);
  text(S.mode === 'library' ? 'ENTRANCE' : 'LINE', 98, 20, 12, 'rgba(208,0,0,.7)', 'center', '800');
  for (let i = 0; i < MAX_LINE; i++) {
    const sl = LINE_SLOT(i);
    const g = S.line[i];
    if (!g) continue;
    if (drag && drag.g === g && drag.moved) { ctx.globalAlpha = 0.3; }
    const isSel = selected === g;
    ctx.fillStyle = isSel ? '#FFF6C9' : 'rgba(255,255,255,.8)';
    rr(sl.x, sl.y, sl.w, sl.h, 12); ctx.fill();
    ctx.strokeStyle = isSel ? '#E8B923' : 'rgba(0,0,0,.08)'; ctx.lineWidth = isSel ? 3 : 1; ctx.stroke();
    drawHearts(sl.x + sl.w / 2, sl.y + 10, g.hearts);
    drawGroupMembers(g, sl.x + sl.w / 2, sl.y + 62, 1.05);
    text(`${TYPES[g.type].name}${g.size > 1 ? ' ×' + g.size : ''}`, sl.x + sl.w / 2, sl.y + sl.h - 12, 12, '#444');
    ctx.globalAlpha = 1;
  }
}

function drawGroupMembers(g, cx, cy, scale = 1) {
  const sp = 30 * scale;
  const start = cx - (g.size - 1) * sp / 2;
  for (let i = 0; i < g.size; i++) {
    const bob = Math.sin(g.bob * 3 + i) * 1.2;
    drawPerson(start + i * sp, cy + bob, g.members[i], TYPES[g.type].color, TYPES[g.type].acc, scale);
  }
}

function drawPerson(x, y, m, shirt, acc, scale = 1, flip = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale * flip, scale);
  // body
  ctx.fillStyle = shirt; rr(-11, -2, 22, 22, 8); ctx.fill();
  if (acc === 'apron') { ctx.fillStyle = '#F5F1E7'; rr(-7, 3, 14, 16, 3); ctx.fill(); }
  // head
  ctx.fillStyle = m.skin; circle(0, -12, 9.5); ctx.fill();
  ctx.fillStyle = m.hair; ctx.beginPath(); ctx.arc(0, -14, 9.5, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#222'; circle(-3.3, -11, 1.4); ctx.fill(); circle(3.3, -11, 1.4); ctx.fill();
  ctx.strokeStyle = '#7a4a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -8, 3, 0.2, Math.PI - 0.2); ctx.stroke();
  switch (acc) {
    case 'band': ctx.fillStyle = '#fff'; ctx.fillRect(-9.5, -18, 19, 3.5); ctx.fillStyle = '#D00000'; ctx.fillRect(-9.5, -17, 19, 1.4); break;
    case 'glasses': ctx.strokeStyle = '#222'; ctx.lineWidth = 1.3; ctx.strokeRect(-7, -13.5, 5.5, 4.5); ctx.strokeRect(1.5, -13.5, 5.5, 4.5); break;
    case 'lanyard':
      ctx.strokeStyle = '#D00000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(0, 8); ctx.lineTo(5, -2); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-3.5, 7, 7, 6); break;
    case 'paint': ctx.fillStyle = '#D00000'; ctx.fillRect(-7.5, -10, 3, 3); ctx.fillRect(4.5, -10, 3, 3); break;
    case 'cap': ctx.fillStyle = '#D00000'; ctx.beginPath(); ctx.arc(0, -15, 9.5, Math.PI, 0); ctx.fill(); ctx.fillRect(0, -16, 13, 3); break;
  }
  ctx.restore();
}

function drawHearts(cx, y, h) {
  const n = Math.ceil(clamp(h, 0, 5));
  const low = h < 1.6;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < n ? (low ? '#FF5A5A' : '#E0245E') : 'rgba(0,0,0,.15)';
    const x = cx - 26 + i * 13;
    const pulse = low && i < n ? Math.sin(performance.now() / 120) * 0.8 : 0;
    heart(x, y - pulse, 10 + pulse);
  }
}
function heart(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  ctx.fill();
}

function seatPositions(t) {
  if (t.seats === 2) return [{ x: t.x - 66, y: t.y }, { x: t.x + 66, y: t.y }];
  return [{ x: t.x - 25, y: t.y - 44 }, { x: t.x + 25, y: t.y - 44 }, { x: t.x - 66, y: t.y }, { x: t.x + 66, y: t.y }];
}

function drawTable(t) {
  const lib = S.mode === 'library';
  const seats = seatPositions(t);
  const g = t.group;
  // highlight valid drop targets while seating
  const seating = selected || (drag && drag.g);
  if (seating) {
    const ok = canSeat(seating, t);
    ctx.fillStyle = ok ? 'rgba(39,174,96,.18)' : 'rgba(0,0,0,0)';
    rr(t.x - 88, t.y - 66, 176, 112, 16); ctx.fill();
    if (ok) { ctx.strokeStyle = '#27AE60'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]); rr(t.x - 88, t.y - 66, 176, 112, 16); ctx.stroke(); ctx.setLineDash([]); }
  }
  // chairs
  for (const s of seats) { ctx.fillStyle = lib ? '#5D4037' : '#B03A2E'; rr(s.x - 13, s.y - 4, 26, 24, 6); ctx.fill(); }
  // people seated (behind table for top seats)
  if (g) seats.slice(0, g.size).forEach((s, i) => {
    if (t.seats === 4 && i < 2) drawPerson(s.x, s.y, g.members[i], TYPES[g.type].color, TYPES[g.type].acc);
  });
  // tabletop
  ctx.fillStyle = 'rgba(0,0,0,.12)'; rr(t.x - 50, t.y - 24, 100, 58, 10); ctx.fill();
  ctx.fillStyle = lib ? '#8D6E63' : '#D7B98E'; rr(t.x - 50, t.y - 28, 100, 56, 10); ctx.fill();
  ctx.strokeStyle = lib ? '#5D4037' : '#A67C52'; ctx.lineWidth = 2; ctx.stroke();
  text(String(t.n), t.x - 38, t.y - 16, 11, 'rgba(0,0,0,.45)');
  if (t.bought) text('NEW', t.x + 32, t.y - 16, 9, '#1E8449', 'center', '900');
  if (g) seats.slice(0, g.size).forEach((s, i) => {
    if (!(t.seats === 4 && i < 2)) drawPerson(s.x, s.y, g.members[i], TYPES[g.type].color, TYPES[g.type].acc, 1, s.x < t.x ? 1 : -1);
  });
  // stuff on table
  if (t.dirty) {
    if (lib) { drawBook(t.x - 8, t.y - 10, t.dirtyColor || 'red', 1.1); drawBook(t.x + 10, t.y - 6, t.dirtyColor || 'red', 1.0, 0.4); }
    else { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ddd'; circle(t.x - 20 + i * 20, t.y + (i % 2) * 6 - 4, 10); ctx.fill(); ctx.fillStyle = '#a89580'; circle(t.x - 20 + i * 20, t.y + (i % 2) * 6 - 4, 4); ctx.fill(); } }
    bubble(t.x + 50, t.y - 62, 'dirty', g);
  }
  if (g) {
    if (g.state === 'eating') {
      if (lib) { drawOpenBook(t.x, t.y - 4, shelfHex(g.need)); }
      else for (let i = 0; i < g.size; i++) {
        const px = t.x - (g.size - 1) * 12 + i * 24;
        ctx.fillStyle = '#fff'; circle(px, t.y, 10); ctx.fill();
        ctx.fillStyle = g.food; circle(px, t.y, 6 * Math.max(0.2, g.timer / g.total)); ctx.fill();
      }
    }
    if (g.state === 'reading' && !lib) { ctx.fillStyle = '#C0392B'; rr(t.x - 12, t.y - 12, 24, 18, 3); ctx.fill(); text('MENU', t.x, t.y - 3, 7, '#fff'); }
    drawHearts(t.x - 12, t.y - 84, g.hearts);
    bubble(t.x + 50, t.y - 62, g.state, g);
  }
}

function bubble(x, y, state, g) {
  const lib = S.mode === 'library';
  const bounce = (state === 'ready' || state === 'paying' || state === 'dirty') ? Math.abs(Math.sin(performance.now() / 220)) * -4 : 0;
  y += bounce;
  if (!['reading', 'ready', 'waiting', 'eating', 'paying', 'dirty'].includes(state)) return;
  ctx.fillStyle = '#fff'; circle(x, y, 16); ctx.fill();
  ctx.strokeStyle = state === 'ready' || state === 'paying' ? '#D00000' : '#999'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 8, y + 12); ctx.lineTo(x - 16, y + 22); ctx.lineTo(x - 2, y + 15); ctx.fillStyle = '#fff'; ctx.fill();
  switch (state) {
    case 'reading': text('…', x, y - 3, 20, '#555'); break;
    case 'ready': text(lib ? '?' : '!', x, y + 1, 22, '#D00000', 'center', '900'); break;
    case 'waiting':
      if (lib) drawBook(x, y, g.need, 1.1);
      else { ctx.fillStyle = '#eee'; circle(x, y, 9); ctx.fill(); ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = g.food; circle(x, y, 4.5); ctx.fill(); }
      break;
    case 'eating': {
      const pr = 1 - g.timer / g.total;
      ctx.strokeStyle = '#27AE60'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 12, -Math.PI / 2, -Math.PI / 2 + pr * Math.PI * 2); ctx.stroke();
      text(lib ? '✎' : '♨', x, y + 1, 13, '#27AE60');
      break;
    }
    case 'paying': text('$', x, y + 1, 22, '#1E8449', 'center', '900'); break;
    case 'dirty': text('✦', x, y + 1, 16, '#8E8E8E'); break;
  }
}

function drawBook(x, y, color, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = shelfHex(color); rr(-6, -8, 12, 16, 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-6, -8, 2.5, 16);
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(-1, -4, 5, 2);
  ctx.restore();
}
function drawOpenBook(x, y, hex) {
  ctx.fillStyle = hex; rr(x - 22, y - 12, 44, 26, 3); ctx.fill();
  ctx.fillStyle = '#fff'; rr(x - 20, y - 11, 19, 22, 2); ctx.fill(); rr(x + 1, y - 11, 19, 22, 2); ctx.fill();
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 17, y - 6 + i * 5); ctx.lineTo(x - 4, y - 6 + i * 5); ctx.moveTo(x + 4, y - 6 + i * 5); ctx.lineTo(x + 17, y - 6 + i * 5); ctx.stroke(); }
}

function drawDiningStations() {
  const k = DINING_ST.kitchen, pu = DINING_ST.pickup, d = DINING_ST.dish;
  // kitchen window
  ctx.fillStyle = '#5D6D7E'; rr(k.x, k.y, k.w, k.h, 12); ctx.fill();
  ctx.fillStyle = '#ABB2B9'; rr(k.x + 8, k.y + 26, k.w - 16, k.h - 34, 8); ctx.fill();
  text('KITCHEN', k.x + k.w / 2, k.y + 14, 13, '#fff', 'center', '900');
  // cooking orders
  S.cooking.slice(0, 6).forEach((c, i) => {
    const cx = k.x + 16 + (i % 3) * 42, cy = k.y + 36 + Math.floor(i / 3) * 40;
    ctx.fillStyle = '#fff'; rr(cx, cy, 36, 32, 4); ctx.fill();
    text('T' + c.table, cx + 18, cy + 10, 11, '#333');
    ctx.fillStyle = '#ddd'; ctx.fillRect(cx + 4, cy + 22, 28, 5);
    ctx.fillStyle = '#E67E22'; ctx.fillRect(cx + 4, cy + 22, 28 * clamp(1 - c.t / c.total, 0, 1), 5);
  });
  if (S.tickets.length) {
    ctx.fillStyle = '#FFF59D'; rr(k.x - 30, k.y + 6, 26, 30, 4); ctx.fill();
    text(String(S.tickets.length), k.x - 17, k.y + 22, 14, '#333', 'center', '900');
  }
  // pickup counter
  ctx.fillStyle = '#B0BEC5'; rr(pu.x, pu.y, pu.w, pu.h, 12); ctx.fill();
  ctx.fillStyle = '#CFD8DC'; rr(pu.x + 6, pu.y + 24, pu.w - 12, pu.h - 30, 8); ctx.fill();
  text('FOOD PICKUP', pu.x + pu.w / 2, pu.y + 13, 12, '#37474F', 'center', '900');
  S.plates.forEach((pl, i) => {
    const pos = plateSlotPos(i);
    ctx.globalAlpha = groupById(pl.groupId) ? 1 : 0.4;
    ctx.fillStyle = '#fff'; circle(pos.x, pos.y, 18); ctx.fill();
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = pl.color; circle(pos.x, pos.y, 10); ctx.fill();
    ctx.fillStyle = '#D00000'; rr(pos.x + 8, pos.y - 22, 22, 15, 4); ctx.fill();
    text(String(pl.table), pos.x + 19, pos.y - 14, 10, '#fff');
    ctx.globalAlpha = 1;
  });
  // dish return
  ctx.fillStyle = '#78909C'; rr(d.x, d.y, d.w, d.h, 12); ctx.fill();
  ctx.fillStyle = '#546E7A'; rr(d.x + 14, d.y + 30, d.w - 28, d.h - 40, 8); ctx.fill();
  text('DISH RETURN', d.x + d.w / 2, d.y + 15, 12, '#fff', 'center', '900');
}

function drawLibraryStations() {
  for (const sh of LIB_ST.shelves) {
    const hex = shelfHex(sh.id);
    ctx.fillStyle = '#4E342E'; rr(sh.x, sh.y, sh.w, sh.h, 8); ctx.fill();
    for (let row = 0; row < 2; row++) {
      for (let b = 0; b < 11; b++) {
        const h = 22 + ((b * 7 + row * 3) % 6);
        ctx.fillStyle = b % 3 === 0 ? hex : (b % 3 === 1 ? shadeHex(hex, -25) : shadeHex(hex, 25));
        ctx.fillRect(sh.x + 8 + b * 11.5, sh.y + 10 + row * 36 + (28 - h), 10, h);
      }
      ctx.fillStyle = '#3E2723'; ctx.fillRect(sh.x + 4, sh.y + 38 + row * 36, sh.w - 8, 4);
    }
    ctx.fillStyle = '#fff'; rr(sh.x - 36, sh.y + sh.h / 2 - 13, 40, 26, 6); ctx.fill();
    ctx.strokeStyle = hex; ctx.lineWidth = 2.5; ctx.stroke();
    text(sh.id === 'gold' ? 'T–Z' : shelfLabel(sh.id), sh.x - 16, sh.y + sh.h / 2, 11, hex, 'center', '900');
  }
  const c = LIB_ST.cart;
  ctx.fillStyle = '#90A4AE'; rr(c.x, c.y, c.w, c.h - 18, 10); ctx.fill();
  ctx.fillStyle = '#37474F'; circle(c.x + 20, c.y + c.h - 10, 9); ctx.fill(); circle(c.x + c.w - 20, c.y + c.h - 10, 9); ctx.fill();
  text('BOOK RETURNS', c.x + c.w / 2, c.y + 16, 12, '#fff', 'center', '900');
  text('reshelve here', c.x + c.w / 2, c.y + 40, 11, '#ECEFF1', 'center', '600');
}
function shadeHex(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
}

function drawWorker(x, y, scale, face, lk) {
  const sh = LOOKS.shirt.find(i => i.id === lk.shirt) || LOOKS.shirt[0];
  const m = { skin: lk.skin, hair: lk.hair };
  drawPerson(x, y, m, sh.color === 'stripes' ? '#D00000' : sh.color, 'apron', scale, face);
  ctx.save(); ctx.translate(x, y); ctx.scale(scale * face, scale);
  if (sh.color === 'stripes') { ctx.fillStyle = '#fff'; ctx.fillRect(-11, 2, 22, 3); ctx.fillRect(-11, 10, 22, 3); ctx.fillStyle = '#F5F1E7'; rr(-7, 3, 14, 16, 3); ctx.fill(); }
  switch (lk.extra) {
    case 'shades': ctx.fillStyle = '#111'; rr(-8, -14, 7, 5, 2); ctx.fill(); rr(1, -14, 7, 5, 2); ctx.fill(); ctx.fillRect(-1, -13, 2, 1.5); break;
    case 'glasses': ctx.strokeStyle = '#333'; ctx.lineWidth = 1.3; ctx.strokeRect(-7, -13.5, 5.5, 4.5); ctx.strokeRect(1.5, -13.5, 5.5, 4.5); break;
    case 'name': ctx.fillStyle = '#fff'; ctx.fillRect(-10, 0, 9, 6); ctx.fillStyle = '#D00000'; ctx.fillRect(-10, 0, 9, 2); break;
  }
  switch (lk.hat) {
    case 'cap': ctx.fillStyle = '#D00000'; ctx.beginPath(); ctx.arc(0, -15, 9.8, Math.PI, 0); ctx.fill(); ctx.fillRect(0, -16, 13, 3); break;
    case 'beanie': ctx.fillStyle = '#D00000'; ctx.beginPath(); ctx.arc(0, -15, 10, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#F5F1E7'; ctx.fillRect(-10, -16, 20, 3.5); circle(0, -26, 3); ctx.fill(); break;
    case 'chef': ctx.fillStyle = '#fff'; ctx.fillRect(-8, -24, 16, 9); circle(-5, -26, 5); ctx.fill(); circle(5, -26, 5); ctx.fill(); circle(0, -29, 5.5); ctx.fill(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.strokeRect(-8, -18, 16, 3); break;
    case 'corn':
      ctx.fillStyle = '#F4D03F'; ctx.beginPath(); ctx.ellipse(0, -27, 7, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#D4AC0D'; for (let r = 0; r < 5; r++) for (let c = -1; c <= 1; c++) { circle(c * 3.3, -35 + r * 4, 1.3); ctx.fill(); }
      ctx.fillStyle = '#58A55C'; ctx.beginPath(); ctx.moveTo(-9, -16); ctx.quadraticCurveTo(-12, -30, -3, -38); ctx.quadraticCurveTo(-6, -26, -1, -16); ctx.fill();
      ctx.beginPath(); ctx.moveTo(9, -16); ctx.quadraticCurveTo(12, -30, 3, -38); ctx.quadraticCurveTo(6, -26, 1, -16); ctx.fill(); break;
    case 'phones': ctx.strokeStyle = '#222'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -13, 11, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.fillStyle = '#D00000'; rr(-13, -15, 5, 8, 2); ctx.fill(); rr(8, -15, 5, 8, 2); ctx.fill(); break;
  }
  ctx.restore();
}
function drawPlayer() {
  const p = S.player;
  const moving = p.queue.length && p.busy <= 0;
  const bob = moving ? Math.abs(Math.sin(p.walk * 12)) * -3 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 26, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
  const lk = look();
  drawWorker(p.x, p.y + bob, 1.3, p.face, lk);
  if (lk.extra === 'name' && lk.name) {
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    const w = ctx.measureText(lk.name).width + 10;
    ctx.fillStyle = 'rgba(255,255,255,.9)'; rr(p.x - w / 2, p.y + 30, w, 15, 7); ctx.fill();
    text(lk.name, p.x, p.y + 38, 11, '#D00000', 'center', '800');
  }
  // carried items
  p.hands.forEach((h, i) => {
    const hx = p.x + (i - (p.hands.length - 1) / 2) * 24, hy = p.y - 46 + bob;
    if (h.kind === 'food') {
      ctx.fillStyle = '#fff'; circle(hx, hy, 11); ctx.fill(); ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = h.color; circle(hx, hy, 6); ctx.fill();
      text(String(h.table), hx + 10, hy - 10, 10, '#D00000', 'center', '900');
    } else if (h.kind === 'dishes') {
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#bbb' : '#ddd'; ctx.beginPath(); ctx.ellipse(hx, hy + 4 - k * 4, 11, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (h.kind === 'book') {
      drawBook(hx, hy, h.color, 1.3);
    } else if (h.kind === 'return') {
      drawBook(hx, hy, h.color, 1.3, 0.3);
      text('↺', hx + 11, hy - 10, 12, '#555');
    }
  });
  if (S.tickets.length) {
    ctx.fillStyle = '#FFF59D'; rr(p.x + 18, p.y - 18, 18, 20, 3); ctx.fill();
    text(String(S.tickets.length), p.x + 27, p.y - 8, 11, '#333', 'center', '900');
  }
}

function drawQueueMarkers() {
  S.player.queue.forEach((q, i) => {
    const pos = targetPos(q);
    ctx.fillStyle = 'rgba(208,0,0,.85)'; circle(pos.x + (i % 2) * 6, pos.y + 14, 9); ctx.fill();
    text(String(i + 1), pos.x + (i % 2) * 6, pos.y + 14, 11, '#fff', 'center', '900');
  });
}

function drawFloats() {
  for (const f of S.floats) {
    ctx.globalAlpha = 1 - f.t / 1.3;
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff';
    ctx.font = `900 ${f.size}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center';
    ctx.strokeText(f.str, f.x, f.y - f.t * 30);
    text(f.str, f.x, f.y - f.t * 30, f.size, f.color, 'center', '900');
  }
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (!S) { ctx.fillStyle = '#F5F1E7'; ctx.fillRect(0, 0, W, H); return; }
  drawFloor();
  if (S.mode === 'dining') drawDiningStations(); else drawLibraryStations();
  // hover outline on clickable things
  if (hover && screen === 'play') {
    ctx.strokeStyle = 'rgba(208,0,0,.5)'; ctx.lineWidth = 3;
    rr(hover.x, hover.y, hover.w, hover.h, 12); ctx.stroke();
  }
  // tables (top row first so bottom row overlaps correctly)
  [...S.tables].sort((a, b) => a.y - b.y).forEach(drawTable);
  drawLineArea();
  drawQueueMarkers();
  drawPlayer();
  drawFloats();
  if (S.boost) {
    const lbl = S.boost.type === 'tips' ? `💰 TIPS x1.5 — ${Math.ceil(S.boost.t)}s` : `🏃 RUSH! — ${Math.ceil(S.boost.t)}s`;
    ctx.fillStyle = S.boost.type === 'tips' ? '#1E8449' : '#D00000';
    rr(16, 516, 164, 30, 15); ctx.fill();
    text(lbl, 98, 531, 13, '#fff', 'center', '900');
  }
  if (drag && drag.moved) {
    ctx.globalAlpha = 0.85;
    drawGroupMembers(drag.g, drag.x, drag.y, 1);
    ctx.globalAlpha = 1;
  }
}

/* ============================================================
 * INPUT
 * ============================================================ */
function toGame(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
function tableRect(t) { return { x: t.x - 88, y: t.y - 86, w: 176, h: 170 }; }

function hitTest(pt) {
  for (let i = 0; i < S.line.length; i++) if (inRect(pt, LINE_SLOT(i))) return { kind: 'group', g: S.line[i], rect: LINE_SLOT(i) };
  for (const t of S.tables) if (inRect(pt, tableRect(t))) return { kind: 'table', t, rect: tableRect(t) };
  if (S.mode === 'dining') {
    const st = DINING_ST;
    if (inRect(pt, st.pickup)) {
      let plateId = null;
      S.plates.forEach((pl, i) => { const pos = plateSlotPos(i); if (Math.hypot(pt.x - pos.x, pt.y - pos.y) < 26) plateId = pl.id; });
      return { kind: 'pickup', plateId, rect: st.pickup };
    }
    if (inRect(pt, { x: st.kitchen.x - 34, y: st.kitchen.y, w: st.kitchen.w + 34, h: st.kitchen.h })) return { kind: 'kitchen', rect: st.kitchen };
    if (inRect(pt, st.dish)) return { kind: 'dish', rect: st.dish };
  } else {
    for (const sh of LIB_ST.shelves) if (inRect(pt, { x: sh.x - 38, y: sh.y, w: sh.w + 38, h: sh.h })) return { kind: 'shelf', color: sh.id, rect: sh };
    if (inRect(pt, LIB_ST.cart)) return { kind: 'cart', rect: LIB_ST.cart };
  }
  return null;
}

function handleTap(hit) {
  if (!hit) { selected = null; return; }
  if (hit.kind === 'group') { selected = selected === hit.g ? null : hit.g; SFX.seat(); return; }
  if (hit.kind === 'table' && selected) { trySeat(selected, hit.t); selected = null; return; }
  selected = null;
  if (hit.kind === 'table') enqueue({ kind: 'table', t: hit.t });
  else if (hit.kind === 'pickup') enqueue({ kind: 'pickup', plateId: hit.plateId });
  else if (hit.kind === 'kitchen') enqueue({ kind: 'kitchen' });
  else if (hit.kind === 'dish') enqueue({ kind: 'dish' });
  else if (hit.kind === 'shelf') enqueue({ kind: 'shelf', color: hit.color });
  else if (hit.kind === 'cart') enqueue({ kind: 'cart' });
}

canvas.addEventListener('pointerdown', e => {
  if (screen !== 'play') return;
  e.preventDefault();
  const pt = toGame(e);
  const hit = hitTest(pt);
  if (hit && hit.kind === 'group') {
    drag = { g: hit.g, x: pt.x, y: pt.y, sx: pt.x, sy: pt.y, moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    return;
  }
  handleTap(hit);
});
canvas.addEventListener('pointermove', e => {
  if (screen !== 'play' || !S) return;
  const pt = toGame(e);
  if (drag) {
    drag.x = pt.x; drag.y = pt.y;
    if (Math.hypot(pt.x - drag.sx, pt.y - drag.sy) > 12) { drag.moved = true; selected = null; }
  }
  const hit = hitTest(pt);
  hover = hit && hit.kind !== 'group' ? hit.rect : null;
  if (hit && hit.kind === 'table') hover = null; // tables show their own highlight
});
canvas.addEventListener('pointerup', e => {
  if (screen !== 'play' || !drag) return;
  const pt = toGame(e);
  const d = drag; drag = null;
  if (d.moved) {
    const hit = hitTest(pt);
    if (hit && hit.kind === 'table') trySeat(d.g, hit.t);
  } else {
    handleTap({ kind: 'group', g: d.g });
  }
});
canvas.addEventListener('pointercancel', () => { drag = null; });

document.addEventListener('keydown', e => {
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
  if (e.key === 'm' || e.key === 'M') toggleMute();
});
document.getElementById('btn-pause').onclick = togglePause;
document.getElementById('btn-mute').onclick = toggleMute;
document.getElementById('btn-help').onclick = () => { if (screen === 'play') { screen = 'paused'; showHow(true); } else if (screen === 'paused') showHow(true); else if (screen !== 'how') showHow(false); };
document.addEventListener('visibilitychange', () => { if (document.hidden && screen === 'play') togglePause(); });

function togglePause() {
  if (screen === 'play') { screen = 'paused'; showPause(); }
  else if (screen === 'paused') { screen = 'play'; hideOverlay(); }
}
function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('huskerdash-muted', muted ? '1' : '0'); } catch (e) {}
  document.getElementById('btn-mute').classList.toggle('off', muted);
}
document.getElementById('btn-mute').classList.toggle('off', muted);

/* ============================================================
 * HUD + HINTS
 * ============================================================ */
function updateHud() {
  const L = S ? S.L : null;
  document.getElementById('hud-level').textContent = L ? L.name : 'Husker Dash';
  document.getElementById('hud-place').textContent = L ? `${L.place} · ${L.week}` : 'A Semester at UNL';
  const max = L ? L.expert * 1.15 : 1;
  document.getElementById('hud-goal-mark').style.left = L ? (L.goal / max * 100) + '%' : '-10px';
  document.getElementById('hud-expert-mark').style.left = L ? (L.expert / max * 100) + '%' : '-10px';
  updateHudLive();
}
function updateHudLive() {
  if (!S) return;
  const L = S.L;
  document.getElementById('hud-money').textContent = '$' + S.money;
  document.getElementById('hud-goal').textContent = S.money >= L.expert ? `★★ Expert! ($${L.expert})` : S.money >= L.goal ? `★ Goal met! Expert: $${L.expert}` : `Goal: $${L.goal}`;
  document.getElementById('hud-bar').style.width = Math.min(100, S.money / (L.expert * 1.15) * 100) + '%';
  const left = L.customers - S.spawned + S.line.length + S.tables.filter(t => t.group).length;
  document.getElementById('hud-left').textContent = `👥 ${left} left`;
}

function currentHint() {
  if (!S || !S.L.tutorial || screen !== 'play') return '';
  const p = S.player, lib = S.mode === 'library';
  const tabs = S.tables;
  const has = st => tabs.some(t => t.group && t.group.state === st);
  if (selected) return 'Now tap an empty table with enough seats.';
  if (has('paying')) return 'A table is showing $. Click it to collect their tip!';
  if (lib) {
    if (p.hands.some(h => h.kind === 'return')) return 'Drop finished books at BOOK RETURNS to reshelve them.';
    if (p.hands.some(h => h.kind === 'book')) return 'Click the table that needs that color book to deliver it.';
    if (has('waiting')) return 'The bubble shows which book they need. Click the matching colored shelf (call number range).';
    if (has('ready')) return 'A student has a ? — click their table to ask what book they need.';
    if (tabs.some(t => t.dirty)) return 'Click a table with leftover books to pick them up.';
  } else {
    if (p.hands.some(h => h.kind === 'dishes')) return 'Take dirty dishes to the DISH RETURN.';
    if (p.hands.some(h => h.kind === 'food')) return 'Click the table with the matching number to serve the food.';
    if (S.plates.length) return 'Food is up! Click a plate at FOOD PICKUP. The red tag is the table number.';
    if (S.tickets.length) return 'You have an order ticket. Click the KITCHEN window to drop it off.';
    if (has('ready')) return 'Someone has a ! — click their table to take their order.';
    if (tabs.some(t => t.dirty)) return 'Click a dirty table to clear it.';
  }
  if (S.line.length) return 'Drag a student from the line onto a table (or tap them, then tap a table).';
  if (has('reading')) return lib ? 'They\'re getting settled…' : 'They\'re reading the menu…';
  if (has('eating')) return lib ? 'They\'re studying. Tip: keep busy clearing tables!' : 'They\'re eating. Tip: chain the same action back-to-back for bonus $!';
  return '';
}
let lastHint = '';
function updateHint() {
  const h = currentHint();
  if (h === lastHint) return;
  lastHint = h;
  const el = document.getElementById('hint');
  el.textContent = h; el.classList.toggle('show', !!h);
}

/* ============================================================
 * SCREENS
 * ============================================================ */
const overlay = document.getElementById('overlay');
function showOverlay(html) { overlay.innerHTML = `<div class="panel">${html}</div>`; overlay.classList.add('show'); }
function hideOverlay() { overlay.classList.remove('show'); overlay.innerHTML = ''; }
const starStr = n => '★'.repeat(n) + '☆'.repeat(2 - n);

function showTitle() {
  screen = 'title';
  S = null; updateHud(); updateHint();
  document.getElementById('hud-left').textContent = '';
  document.getElementById('hud-money').textContent = '';
  document.getElementById('hud-goal').textContent = '';
  document.getElementById('hud-bar').style.width = '0';
  const next = Math.min(save.unlocked, LEVELS.length - 1);
  const started = save.unlocked > 0 || save.stars.some(s => s);
  showOverlay(`
    <h1>HUSKER DASH</h1>
    <p class="tagline">A Semester at UNL</p>
    <p>You're a student worker trying to survive one semester of campus jobs, from Cather and Harper to the Nebraska Union on game day to finals week at Love Library.</p>
    <p class="feature">📰 Every shift is based on a real story from <b>The Daily Nebraskan</b>.</p>
    <button class="btn" data-go="intro" data-level="${next}">${started ? `Continue: Shift ${next + 1}` : 'Start Semester'}</button>
    <button class="btn secondary" data-go="how">How to Play</button>
    <button class="btn secondary" data-go="shopmenu">🛒 Shop</button>
    <button class="btn secondary" data-go="lockermenu">👕 Locker</button>
    <div class="shift-list">
      ${LEVELS.map((L, i) => `
        <button class="shift" data-go="intro" data-level="${i}" ${i > save.unlocked ? 'disabled' : ''}>
          <span><b>${L.week}</b> · ${L.name.replace(/^Shift \d: /, '')}<br><span class="small">${L.place}</span></span>
          <span class="stars">${i > save.unlocked ? '🔒' : starStr(save.stars[i] || 0)}</span>
        </button>`).join('')}
    </div>
    <p class="small" style="margin-top:12px">All stories are from the fall 2026 semester.</p>
    <p class="small">Savings: $${save.bank} · <a href="#" data-go="resetask" data-from="title" style="color:inherit">⟲ restart everything</a></p>
  `);
}

function showHow(fromPause) {
  if (!fromPause) screen = 'how';
  showOverlay(`
    <h2>How to Play</h2>
    <div class="how">
      <h3>🍽️ Dining Hall &amp; Union</h3>
      <ol>
        <li><b>Seat</b> students: drag them from the line to a table (or tap them, then tap a table). Groups of 3–4 need a big table.</li>
        <li>When a <b>!</b> pops up, click the table to <b>take their order</b>.</li>
        <li>Click the <b>KITCHEN</b> to drop off order tickets.</li>
        <li>When food appears at <b>FOOD PICKUP</b>, click the plate, then click the table whose number is on the tag.</li>
        <li>When they show <b>$</b>, click to collect the tip. Then clear the table and drop the dishes at <b>DISH RETURN</b>.</li>
      </ol>
      <h3>📚 Love Library</h3>
      <ol>
        <li>Seat students, then click a <b>?</b> to find out which book they need.</li>
        <li>Grab it from the shelf with the matching color and call number range, then deliver it.</li>
        <li>When they're done, pick up the book and drop it at <b>BOOK RETURNS</b>.</li>
      </ol>
      <h3>📰 Daily Nebraskan stories</h3>
      <ol>
        <li>Each shift starts with a real Daily Nebraskan story about that place.</li>
        <li>Partway through a shift, a <b>DN News Flash</b> shakes things up, like a sudden rush of students or a tip bonus.</li>
        <li>After each shift you pass, answer a <b>pop quiz</b> about the story for a $25 bonus.</li>
      </ol>
      <h3>💡 Tips</h3>
      <ol>
        <li>The <b>hearts</b> are patience. Happy students tip more; at zero hearts they walk out.</li>
        <li>You can queue up several clicks in a row, and your worker does them in order.</li>
        <li>Doing the <b>same action back-to-back</b> (seat, seat, seat…) builds a <b>chain bonus</b>.</li>
        <li>Spend your savings in the <b>Shop</b> (most upgrades have several levels) and dress up your worker in the <b>Locker</b>. More upgrades = a higher job rank!</li>
        <li> <b>P</b> pauses, <b>M</b> mutes.</li>
      </ol>
    </div>
    ${fromPause ? '<button class="btn" data-go="resume">Back to my shift</button>' : '<button class="btn" data-go="title">Back</button>'}
  `);
}

function storyCard(st, label = 'From the Daily Nebraskan') {
  return `<div class="story">
    <div class="story-tag">📰 ${label}${st.date ? ` · ${st.date}` : ''}</div>
    <a class="story-title" href="${st.url}" target="_blank" rel="noopener">${st.title}</a>
    ${st.summary ? `<p>${st.summary}</p>` : ''}
    <a class="story-link" href="${st.url}" target="_blank" rel="noopener">Read the full story on dailynebraskan.com ↗</a>
  </div>`;
}

function showIntro(idx) {
  screen = 'intro';
  startLevel(idx);
  draw();
  const L = LEVELS[idx];
  const types = Object.keys(L.mix);
  showOverlay(`
    <p class="small" style="margin:0">${L.week.toUpperCase()}</p>
    <h2>${L.name}</h2>
    <p><b>${L.place}</b></p>
    <p>${L.blurb}</p>
    ${storyCard(L.story)}
    <p class="small" style="opacity:.85">📰 Watch for a <b>DN News Flash</b> during your shift, and answer a pop quiz about this story afterward for bonus cash!</p>
    <div class="controls">${L.mode === 'library'
      ? '<b>Quick controls:</b> drag students to a table → click <b>?</b> to hear the book they need → click the matching colored shelf → click their table to deliver → click <b>$</b> for the tip → pick up the book → drop it at BOOK RETURNS.'
      : '<b>Quick controls:</b> drag students to a table → click <b>!</b> to take the order → click KITCHEN → click the plate at FOOD PICKUP → click the matching table → click <b>$</b> for the tip → clear the table → DISH RETURN.'}</div>
    <div class="types">${types.map(k => `<div class="type-card" style="border-color:${TYPES[k].color}"><b>${TYPES[k].name}</b>${TYPES[k].desc}</div>`).join('')}</div>
    <div class="goals">
      <div class="goal">Goal<b>$${L.goal}</b></div>
      <div class="goal">Expert<b>$${L.expert}</b></div>
      <div class="goal">Students<b>${L.customers}</b></div>
    </div>
    <button class="btn" data-go="play">Clock In!</button>
    <button class="btn secondary" data-go="title">Menu</button>
  `);
}

function showPause() {
  showOverlay(`
    <h2>Paused</h2>
    <p>Take a breather. Your customers are frozen in time.</p>
    <button class="btn" data-go="resume">Resume</button>
    <button class="btn secondary" data-go="restart">Restart Shift</button>
    <button class="btn secondary" data-go="title">Quit to Menu</button>
    <div><button class="btn danger" data-go="resetask" data-from="pause">⟲ Restart Everything</button></div>
  `);
}

function endLevel() {
  S.ended = true;
  screen = 'results';
  const L = S.L, idx = S.idx;
  const stars = S.money >= L.expert ? 2 : S.money >= L.goal ? 1 : 0;
  save.bank += S.money;
  if (stars > 0) {
    save.stars[idx] = Math.max(save.stars[idx] || 0, stars);
    save.unlocked = Math.max(save.unlocked, Math.min(idx + 1, LEVELS.length - 1));
    if (idx === LEVELS.length - 1) save.finished = true;
  }
  persist();
  document.getElementById('hint').classList.remove('show'); lastHint = '';
  document.getElementById('flash').classList.remove('show');
  if (stars) SFX.win(); else SFX.lose();
  const last = idx === LEVELS.length - 1;
  showOverlay(`
    <h2>${stars === 2 ? 'Employee of the Month!' : stars === 1 ? 'Shift Complete!' : 'Rough Shift…'}</h2>
    <p class="stars" style="font-size:36px">${starStr(stars)}</p>
    <div class="goals">
      <div class="goal">Earned<b>$${S.money}</b></div>
      <div class="goal">Served<b>${S.served}</b></div>
      <div class="goal">Walked out<b>${S.walkouts}</b></div>
    </div>
    <div class="headline"><span class="small">TOMORROW'S HEADLINE (in your dreams)</span><b>${makeHeadline(S, stars)}</b></div>
    <p>${stars ? `You beat the $${L.goal} goal${stars === 2 ? ' and hit Expert' : ''}! $${S.money} added to your savings.` : `You needed $${L.goal}. Your $${S.money} still goes into savings, so try again, maybe with an upgrade.`}</p>
    ${stars
      ? `<button class="btn" data-go="quiz" data-level="${idx}">Continue → DN Pop Quiz</button>`
      : `<button class="btn secondary" data-go="shop" data-level="${idx}">Upgrade Shop</button>`}
    <div class="end-actions">
      <button class="btn secondary" data-go="intro" data-level="${idx}">↻ ${stars ? 'Redo Shift' : 'Try Again'}</button>
      <button class="btn secondary" data-go="title">Menu</button>
      <button class="btn danger" data-go="resetask" data-from="results">⟲ Restart Everything</button>
    </div>
  `);
}

function makeHeadline(S, stars) {
  const nm = (look().name || '').trim();
  const who = nm ? nm : (S.mode === 'library' ? 'Love Library desk worker' : 'Student worker');
  if (stars === 2) return `${who} serves ${S.served} Huskers, named Employee of the Month`;
  if (stars === 1) return `${who} survives ${S.L.week.toLowerCase()} shift at ${S.L.place}, earns $${S.money} in tips`;
  return `${S.walkouts} hungry Huskers walk out of ${S.L.place}; manager "has questions"`;
}

function showQuiz(idx, picked) {
  screen = 'quiz';
  const L = LEVELS[idx], Q = L.quiz;
  const last = idx === LEVELS.length - 1;
  save.quiz = save.quiz || {};
  let feedback = '';
  if (picked !== undefined) {
    const right = picked === Q.answer;
    if (right && !save.quiz[idx]) { save.bank += 25; save.quiz[idx] = true; persist(); SFX.cash(); }
    else if (!right) SFX.error();
    feedback = `<p class="quiz-fb ${right ? 'ok' : 'no'}">${right ? (save.quiz[idx] ? '✅ Correct! +$25 bonus is in your savings.' : '✅ Correct!') : `❌ Not quite. The answer is: <b>${Q.options[Q.answer]}</b>`}</p>
      ${storyCard({ title: L.story.title, url: L.story.url }, 'Read the story')}
      ${last ? `<button class="btn" data-go="final">Finish the Semester →</button>` : `<button class="btn" data-go="shop" data-level="${idx + 1}">Upgrade Shop →</button>`}`;
  }
  showOverlay(`
    <p class="small" style="margin:0">BREAK ROOM</p>
    <h2>📰 Daily Nebraskan Pop Quiz</h2>
    <p>Based on the story from your shift: <i>${L.story.title}</i></p>
    <p class="quiz-q">${Q.q}</p>
    <div class="quiz-opts">${Q.options.map((o, i) => `<button class="shift quiz-opt ${picked !== undefined && i === Q.answer ? 'right' : ''} ${picked === i && i !== Q.answer ? 'wrong' : ''}" ${picked !== undefined ? 'disabled' : `data-go="answer" data-level="${idx}" data-i="${i}"`}>${o}</button>`).join('')}</div>
    ${feedback || '<p class="small">Right answer = <b>+$25</b> savings (first try counts once per shift).</p>'}
  `);
}

let resetFrom = 'title', lastResultsHtml = '';
function showResetConfirm(from) {
  resetFrom = from;
  if (from === 'results') lastResultsHtml = overlay.innerHTML;
  screen = 'confirm';
  showOverlay(`
    <h2>⟲ Restart Everything?</h2>
    <p>This starts your semester over from <b>Shift 1</b>. You'll lose:</p>
    <ul class="lose-list">
      <li>All unlocked shifts and stars (${save.stars.reduce((a, b) => a + b, 0)} ★)</li>
      <li>Your savings ($${save.bank})</li>
      <li>Every shop upgrade (rank: ${rankName()})</li>
      <li>Outfits you bought in the Locker</li>
    </ul>
    <label class="keep"><input type="checkbox" id="keep-look" checked> Keep my name, skin and hair</label>
    <div>
      <button class="btn secondary" data-go="resetno">No, go back</button>
      <button class="btn danger" data-go="resetyes">Yes, start over</button>
    </div>
  `);
}
function showResultsAgain() {
  overlay.innerHTML = lastResultsHtml; overlay.classList.add('show');
}

function showShop(nextIdx) {
  screen = 'shop';
  lockerReturn = nextIdx;
  showOverlay(`
    <h2>Break Room Upgrades</h2>
    <p>Savings: <span class="bank">$${save.bank}</span> · Rank: <b>${rankName()}</b></p>
    <p class="small">Fun fact: this week the Daily Nebraskan reported that UNL custodial jobs start at $15.25 an hour, just above Nebraska's $15 minimum wage (<a href="${DN_EXTRA.wages.url}" target="_blank" rel="noopener">read the story ↗</a>).</p>
    <div class="shop">
      ${UPGRADES.map(u => {
        const n = lvl(u.id), max = u.costs.length, maxed = n >= max;
        const cost = u.costs[n];
        return `<div class="item ${n ? 'owned' : ''}">
          <div class="icon">${u.icon}</div><b>${u.name}</b>
          <div class="pips">${u.costs.map((_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('')}</div>
          <p>${maxed ? u.desc(n) : (n ? `Now: ${u.desc(n)}<br>Next: ` : '') + u.desc(n + 1)}</p>
          ${maxed ? '<b style="color:#1E8449">★ Maxed out</b>' : `<button class="btn" data-go="buy" data-id="${u.id}" data-level="${nextIdx}" ${save.bank < cost ? 'disabled' : ''}>${n ? 'Upgrade' : 'Buy'} $${cost}</button>`}
        </div>`;
      }).join('')}
    </div>
    <button class="btn secondary" data-go="locker">👕 Locker: change your look</button>
    ${nextIdx === null ? '<button class="btn" data-go="title">Back to Menu</button>' : `<button class="btn" data-go="intro" data-level="${nextIdx}">Next: ${LEVELS[nextIdx].name} →</button>`}
  `);
}

let lockerReturn = null;
function showLocker() {
  screen = 'locker';
  const lk = look();
  const opt = (slot, it) => {
    const owned = ownsLook(slot, it.id), on = lk[slot] === it.id;
    return `<button class="look-opt ${on ? 'on' : ''}" data-go="${owned ? 'equip' : 'buylook'}" data-slot="${slot}" data-id="${it.id}" ${!owned && save.bank < it.cost ? 'disabled' : ''}>
      ${slot === 'shirt' ? `<i class="sw" style="background:${it.color === 'stripes' ? 'repeating-linear-gradient(0deg,#D00000 0 4px,#fff 4px 7px)' : it.color}"></i>` : ''}${it.name}<small>${owned ? (on ? 'Wearing' : 'Owned') : '$' + it.cost}</small></button>`;
  };
  const swatches = slot => LOOKS[slot].map(c => `<button class="swatch ${lk[slot] === c ? 'on' : ''}" style="background:${c}" data-go="equip" data-slot="${slot}" data-id="${c}" aria-label="${slot} color"></button>`).join('');
  showOverlay(`
    <h2>👕 Your Locker</h2>
    <p>Savings: <span class="bank">$${save.bank}</span> · Rank: <b>${rankName()}</b> <span class="small">(buy upgrades to rank up)</span></p>
    <div class="locker">
      <div class="preview"><canvas id="preview" width="160" height="190"></canvas><div class="rank-badge">${rankName()}</div></div>
      <div class="locker-opts">
        <label class="name-row">Name: <input id="worker-name" maxlength="14" placeholder="Your name" value="${(lk.name || '').replace(/"/g, '&quot;')}"></label>
        <h3>Skin</h3><div class="swatches">${swatches('skin')}</div>
        <h3>Hair</h3><div class="swatches">${swatches('hair')}</div>
        <h3>Shirt</h3><div class="looks">${LOOKS.shirt.map(i => opt('shirt', i)).join('')}</div>
        <h3>Hat</h3><div class="looks">${LOOKS.hat.map(i => opt('hat', i)).join('')}</div>
        <h3>Extras</h3><div class="looks">${LOOKS.extra.map(i => opt('extra', i)).join('')}</div>
      </div>
    </div>
    <p class="small">Tip: add a Name Tag to show your name on the floor and in your shift headlines.</p>
    <button class="btn" data-go="lockerback">Done</button>
  `);
  const inp = document.getElementById('worker-name');
  inp.addEventListener('input', () => { look().name = inp.value.slice(0, 14); persist(); });
  drawPreview();
}
function drawPreview() {
  const c = document.getElementById('preview'); if (!c) return;
  const main = ctx; ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#F3EBDD'; rr(0, 0, c.width, c.height, 14); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(80, 176, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
  drawWorker(80, 126, 2.6, 1, look());
  ctx = main;
}

function showFinal() {
  screen = 'final';
  const total = save.stars.reduce((a, b) => a + b, 0);
  showOverlay(`
    <h1>SEMESTER<br>COMPLETE!</h1>
    <p class="tagline">You survived a whole semester of campus jobs.</p>
    <p class="stars" style="font-size:32px">${'★'.repeat(total)}${'☆'.repeat(LEVELS.length * 2 - total)}</p>
    <p>${total === LEVELS.length * 2 ? 'Perfect semester. Dean\'s List AND Employee of the Year!' : 'Go back and replay shifts to earn every Expert star.'}</p>
    <p>Total savings: <span class="bank">$${save.bank}</span></p>
    ${storyCard({ title: DN_EXTRA.finale.title, url: DN_EXTRA.finale.url, date: DN_EXTRA.finale.date, summary: 'Ready to unwind before real finals? A UNL event planning class is hosting a casino-style night during Big Red Finale.' }, 'Now go relax')}
    <button class="btn" data-go="title">Main Menu</button>
  `);
}

overlay.addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (!b) return; // plain links (Daily Nebraskan stories) open normally
  e.preventDefault();
  const go = b.dataset.go, lvlIdx = parseInt(b.dataset.level, 10);
  beep(660, 0.05, 'triangle');
  switch (go) {
    case 'title': showTitle(); break;
    case 'how': showHow(); break;
    case 'intro': showIntro(lvlIdx); break;
    case 'play': screen = 'play'; hideOverlay(); break;
    case 'resume': screen = 'play'; hideOverlay(); break;
    case 'restart': showIntro(S.idx); break;
    case 'shop': showShop(lvlIdx); break;
    case 'quiz': showQuiz(lvlIdx); break;
    case 'answer': showQuiz(lvlIdx, parseInt(b.dataset.i, 10)); break;
    case 'final': showFinal(); break;
    case 'buy': {
      const u = UPGRADES.find(x => x.id === b.dataset.id);
      const n = u ? lvl(u.id) : 0;
      if (u && n < u.costs.length && save.bank >= u.costs[n]) { save.bank -= u.costs[n]; save.upgrades[u.id] = n + 1; persist(); SFX.cash(); }
      showShop(isNaN(lvlIdx) ? null : lvlIdx); break;
    }
    case 'locker': showLocker(); break;
    case 'lockerback': if (lockerReturn === 'title') showTitle(); else showShop(lockerReturn); break;
    case 'equip': look()[b.dataset.slot] = b.dataset.id; persist(); beep(700, 0.05, 'triangle'); showLocker(); break;
    case 'buylook': {
      const it = LOOKS[b.dataset.slot].find(x => x.id === b.dataset.id);
      if (it && save.bank >= it.cost) { save.bank -= it.cost; look(); save.owned[b.dataset.slot + ':' + it.id] = true; look()[b.dataset.slot] = it.id; persist(); SFX.cash(); }
      showLocker(); break;
    }
    case 'shopmenu': showShop(null); break;
    case 'lockermenu': lockerReturn = 'title'; showLocker(); break;
    case 'resetask': showResetConfirm(b.dataset.from); break;
    case 'resetno':
      if (resetFrom === 'pause') { screen = 'paused'; showPause(); }
      else if (resetFrom === 'results' && S) { screen = 'results'; showResultsAgain(); }
      else showTitle();
      break;
    case 'resetyes': {
      const keepLook = document.getElementById('keep-look')?.checked;
      const lk = look();
      save = freshSave();
      if (keepLook) save.look = { skin: lk.skin, hair: lk.hair, name: lk.name, shirt: 'scarlet', hat: 'cap', extra: 'none' };
      persist();
      showIntro(0);
      break;
    }
  }
});

/* ============================================================
 * MAIN LOOP
 * ============================================================ */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!window.HD_SIM) update(dt);
  draw();
  requestAnimationFrame(frame);
}
function buildTicker() {
  const items = [...LEVELS.map(L => L.story), DN_EXTRA.library, DN_EXTRA.wages, DN_EXTRA.finale];
  const html = items.map(st => `<a href="${st.url}" target="_blank" rel="noopener">${st.title}</a>`).join('<span class="dot">•</span>');
  document.getElementById('ticker-track').innerHTML = html + '<span class="dot">•</span>' + html;
}
buildTicker();
showTitle();
requestAnimationFrame(frame);

// small hook used for automated testing
window.HD = {
  get S() { return S; }, get screen() { return screen; }, set screen(v) { screen = v; },
  startLevel, update, enqueue, trySeat, LEVELS, hideOverlay, get save() { return save; },
};
})();
