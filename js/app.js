/**
 * KeyQuest — Main Application Logic
 *
 * Handles:
 *  - View routing (home, intro, lesson, results)
 *  - Progress persistence via localStorage
 *  - Typing engine (keydown handling, WPM, accuracy)
 *  - Home screen rendering (lesson cards, stars, locks)
 *  - Lesson intro screen
 *  - Results screen
 *  - Sound effects via Web Audio API (no external files)
 *  - PWA service worker registration
 */

'use strict';

// ================================================================
// CONSTANTS
// ================================================================

// App version — shown in the footer so a user can tell you which build they
// have. IMPORTANT: when you ship an update, bump this AND the ?v= query on the
// <script>/<link> tags in index.html (they cache-bust assets) AND CACHE_NAME
// in sw.js. Keeping them in lockstep is what guarantees devices get the update.
const APP_VERSION = window.APP_VERSION || '1.0.0';

// Legacy single-profile key (migrated into a profile on first run).
const LEGACY_PROGRESS_KEY = 'keyquest_progress';

// Profile storage keys
const PROFILES_KEY = 'keyquest_profiles';
const ACTIVE_KEY   = 'keyquest_active_profile';

// Avatar choices for the "Who's typing?" screen (emoji + accent color)
const AVATARS = [
  ['🦊', '#F0A500'], ['🐯', '#E67E22'], ['🐼', '#4A9EFF'], ['🦄', '#EC407A'],
  ['🚀', '#00C896'], ['🐲', '#2ECC71'], ['🦁', '#F1C40F'], ['🐸', '#1ABC9C'],
  ['🐵', '#9B59B6'], ['🐶', '#3498DB'], ['🐱', '#E74C3C'], ['🦖', '#16A085']
];

// Emoji currently selected in the create-profile form
let selectedEmoji = AVATARS[0][0];

// Cap WPM at a sane maximum so a quick burst or key-mash can't post a silly
// number (the sustained human record is ~210). Keeps results/certificates real.
const MAX_WPM = 250;

// Star thresholds
const STAR_1_ACCURACY = 70;   // >= 70% accuracy
const STAR_2_ACCURACY = 85;   // >= 85% accuracy
const STAR_3_ACCURACY = 95;   // >= 95% accuracy AND WPM >= target

// Encouragement messages by star count
const ENCOURAGEMENT = {
  1: [
    "Good start! Keep practicing and you'll get faster!",
    "You finished it! Practice makes perfect.",
    "Nice work getting through the lesson. Try again for more stars!"
  ],
  2: [
    "Great job! You're building real typing skills!",
    "Solid performance! One more push for that third star!",
    "Well done! Your fingers are learning the keys!"
  ],
  3: [
    "AMAZING! You nailed it! You're a typing star!",
    "PERFECT! Three stars! You are incredible!",
    "WOW! Full stars! You're becoming a typing master!"
  ]
};

// Level accent colors for the lesson screen top bar
const LEVEL_COLORS = {
  1: '#F0A500',   // gold
  2: '#4A9EFF',   // blue
  3: '#00C896',   // teal
  4: '#EC407A'    // pink
};

// ================================================================
// SOUND ENGINE — Web Audio API, no external files
// ================================================================

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new AudioCtx();
    } catch (e) {
      console.warn('[KeyQuest] Web Audio API not available:', e);
      return null;
    }
  }
  return audioCtx;
}

function playCorrectSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) { /* silent fail */ }
}

function playErrorSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) { /* silent fail */ }
}

function playLessonCompleteSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    [523, 659, 784].forEach(function(freq, i) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.2);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.2);
    });
  } catch (e) { /* silent fail */ }
}

// ================================================================
// STATE
// ================================================================

let state = {
  // Current view: 'home' | 'intro' | 'lesson' | 'results'
  view: 'home',

  // Active lesson object (from LESSONS array)
  lesson: null,

  // Active exercise index within the lesson
  exerciseIndex: 0,

  // Full exercise text (string)
  exerciseText: '',

  // Current character position in exerciseText
  charIndex: 0,

  // Total keystrokes attempted (including wrong ones)
  totalKeystrokes: 0,

  // Number of wrong keystrokes (errors)
  errorCount: 0,

  // Whether a wrong key was just pressed (for shake animation)
  inError: false,

  // Timer
  startTime: null,
  timerInterval: null,

  // Exam mode: null for normal lessons, or the active exam object.
  // examScoreMode is 'accuracy' or 'speed' when an exam is running.
  activeExam: null,
  examScoreMode: null,

  // Results for current lesson attempt
  results: {
    wpm: 0,
    accuracy: 0,
    seconds: 0,
    stars: 0
  }
};

/** True while an exam (not a normal lesson) is being taken. */
function inExam() {
  return !!state.activeExam;
}

// ================================================================
// PROFILES — local, offline "players" so multiple people (son, wife,
// you) each keep their own stars, WPM, and lesson progress.
// ================================================================

/** Load the list of profiles. */
function loadProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw) || [];
  } catch (e) {
    console.warn('[KeyQuest] Could not load profiles:', e);
  }
  return [];
}

/** Save the list of profiles. */
function saveProfiles(list) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[KeyQuest] Could not save profiles:', e);
  }
}

function getActiveProfileId() {
  return localStorage.getItem(ACTIVE_KEY) || null;
}

function setActiveProfileId(id) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

/** Return the active profile object, or null. */
function getActiveProfile() {
  const id = getActiveProfileId();
  if (!id) return null;
  return loadProfiles().find(function(p) { return p.id === id; }) || null;
}

/** Create a new profile and return its id. */
function createProfile(name, emoji, color) {
  const profiles = loadProfiles();
  const id = 'p_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000);
  profiles.push({ id: id, name: name, emoji: emoji, color: color });
  saveProfiles(profiles);
  return id;
}

/** Delete a profile and its saved progress. */
function deleteProfile(id) {
  const profiles = loadProfiles().filter(function(p) { return p.id !== id; });
  saveProfiles(profiles);
  try { localStorage.removeItem('keyquest_progress__' + id); } catch (e) {}
  if (getActiveProfileId() === id) setActiveProfileId(null);
}

/**
 * One-time migration: if an older single-profile save exists and no
 * profiles have been created yet, fold it into a "Player 1" profile so
 * existing progress is never lost.
 */
function migrateLegacyProgress() {
  if (loadProfiles().length > 0) return;
  const legacy = localStorage.getItem(LEGACY_PROGRESS_KEY);
  if (legacy) {
    const id = createProfile('Player 1', '🦊', '#F0A500');
    try { localStorage.setItem('keyquest_progress__' + id, legacy); } catch (e) {}
    setActiveProfileId(id);
  }
}

// ================================================================
// PROGRESS PERSISTENCE — namespaced per active profile
// ================================================================

/** localStorage key for the active profile's progress. */
function progressKey() {
  const id = getActiveProfileId();
  return 'keyquest_progress__' + (id || 'default');
}

/**
 * Load progress for the active profile.
 * Returns a normalized progress object.
 */
function loadProgress() {
  try {
    const raw = localStorage.getItem(progressKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        completedLessons: parsed.completedLessons || {},
        totalSessions: parsed.totalSessions || 0,
        exams: parsed.exams || {},
        forceUnlocked: parsed.forceUnlocked || {},
        certifiedAt: parsed.certifiedAt || null,
        games: parsed.games || {}
      };
    }
  } catch (e) {
    console.warn('[KeyQuest] Could not load progress:', e);
  }
  return { completedLessons: {}, totalSessions: 0, exams: {}, forceUnlocked: {}, certifiedAt: null, games: {} };
}

/**
 * Save progress for the active profile.
 */
function saveProgress(progress) {
  try {
    localStorage.setItem(progressKey(), JSON.stringify(progress));
  } catch (e) {
    console.warn('[KeyQuest] Could not save progress:', e);
  }
}

/**
 * Record a lesson completion.
 * Only updates if the new result is better (more stars, or same stars + more WPM).
 */
function recordLessonCompletion(lessonId, stars, wpm, accuracy, seconds) {
  const progress = loadProgress();
  const existing = progress.completedLessons[lessonId];

  const isBetter = !existing
    || stars > existing.stars
    || (stars === existing.stars && wpm > existing.wpm);

  if (isBetter) {
    progress.completedLessons[lessonId] = {
      stars,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      seconds: Math.round(seconds || 0),
      completedAt: new Date().toISOString()
    };
  }

  progress.totalSessions = (progress.totalSessions || 0) + 1;
  saveProgress(progress);
}

// ================================================================
// EXAM PROGRESS + UNLOCKING
// ================================================================

/** Record an exam attempt; keeps the best result and a "passed" flag. */
function recordExamResult(examId, mode, passed, wpm, accuracy, seconds) {
  const progress = loadProgress();
  if (!progress.exams) progress.exams = {};
  const prev = progress.exams[examId] || { passed: false, bestWpm: 0, bestAccuracy: 0 };

  progress.exams[examId] = {
    passed: prev.passed || passed,
    bestWpm: Math.max(prev.bestWpm || 0, Math.round(wpm)),
    bestAccuracy: Math.max(prev.bestAccuracy || 0, Math.round(accuracy)),
    lastMode: mode,
    lastSeconds: Math.round(seconds || 0),
    lastWpm: Math.round(wpm),
    lastAccuracy: Math.round(accuracy),
    attemptedAt: new Date().toISOString()
  };

  // Stamp a certification date the first time the final exam is passed.
  if (examId === 'FINAL' && passed && !progress.certifiedAt) {
    progress.certifiedAt = new Date().toISOString();
  }

  saveProgress(progress);
}

function examPassed(examId, progress) {
  return !!(progress.exams && progress.exams[examId] && progress.exams[examId].passed);
}

/** A module exam unlocks once every lesson in its level has at least 1 star. */
function isModuleExamUnlocked(level, progress) {
  const lessons = getLessonsForLevel(level);
  return lessons.every(function(l) {
    const r = progress.completedLessons[l.id];
    return r && r.stars >= 1;
  });
}

/** The final exam unlocks once all four module exams are passed. */
function isFinalExamUnlocked(progress) {
  return [1, 2, 3, 4].every(function(lvl) {
    const exam = getExamForLevel(lvl);
    return exam && examPassed(exam.id, progress);
  });
}

/** Did the player pass an exam given a mode + scores? */
function evaluateExam(exam, mode, accuracy, wpm) {
  if (mode === 'accuracy') {
    return accuracy >= EXAM_ACCURACY_ONLY_PASS;
  }
  return accuracy >= exam.passAccuracy && wpm >= exam.targetWPM;
}

/**
 * Check if a lesson is unlocked.
 * Lesson 1 is always unlocked. Lesson N unlocks when N-1 has stars >= 1.
 */
function isLessonUnlocked(lessonId, progress) {
  if (lessonId === 1) return true;
  // Manually unlocked (tapped a locked lesson) — start here and continue forward.
  if (progress.forceUnlocked && progress.forceUnlocked[lessonId]) return true;
  const prev = progress.completedLessons[lessonId - 1];
  return !!(prev && prev.stars >= 1);
}

/**
 * Tap-to-unlock: let a learner jump ahead. Unlocks just this one lesson (they
 * then continue forward on the normal path). Mirrors Simpli Piano's behavior.
 */
function unlockLesson(lessonId) {
  const lesson = LESSONS.find(function(l) { return l.id === lessonId; });
  const title = lesson ? lesson.title : ('Lesson ' + lessonId);
  if (!confirm('Unlock “' + title + '”?\n\nYou can start here and keep going forward from this point.')) return;
  const progress = loadProgress();
  if (!progress.forceUnlocked) progress.forceUnlocked = {};
  progress.forceUnlocked[lessonId] = true;
  saveProgress(progress);
  renderHome();
}

// ================================================================
// VIEW ROUTING
// ================================================================

const views = {
  profiles:     document.getElementById('view-profiles'),
  home:         document.getElementById('view-home'),
  intro:        document.getElementById('view-intro'),
  'exam-intro': document.getElementById('view-exam-intro'),
  lesson:       document.getElementById('view-lesson'),
  results:      document.getElementById('view-results'),
  game:         document.getElementById('view-game')
};

function showView(name) {
  Object.entries(views).forEach(function([key, el]) {
    el.classList.toggle('hidden', key !== name);
  });
  state.view = name;
}

// ================================================================
// HOME SCREEN
// ================================================================

function renderHome() {
  state.activeExam = null;
  state.examScoreMode = null;
  const progress = loadProgress();
  renderProfileChip();
  renderLevelSections(progress);
  renderStatsBar(progress);
  showView('home');
}

/** Update the header chip that shows whose profile is active. */
function renderProfileChip() {
  const ap = getActiveProfile();
  const emojiEl = document.getElementById('profile-chip-emoji');
  const nameEl = document.getElementById('profile-chip-name');
  if (emojiEl) emojiEl.textContent = ap ? ap.emoji : '🙂';
  if (nameEl) nameEl.textContent = ap ? ap.name : 'Player';
}

// ================================================================
// PROFILE PICKER SCREEN
// ================================================================

function showProfiles(mode) {
  renderProfiles(mode);
  showView('profiles');
}

function renderProfiles(mode) {
  const grid = document.getElementById('profiles-grid');
  grid.innerHTML = '';

  const profiles = loadProfiles();

  profiles.forEach(function(p) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.style.setProperty('--accent', p.color || 'var(--gold)');
    card.innerHTML =
      '<button class="profile-del" aria-label="Remove ' + p.name + '">✕</button>' +
      '<div class="profile-emoji">' + p.emoji + '</div>' +
      '<div class="profile-name">' + p.name + '</div>';

    card.addEventListener('click', function(e) {
      if (e.target.closest('.profile-del')) return;
      selectProfile(p.id);
    });
    card.querySelector('.profile-del').addEventListener('click', function(e) {
      e.stopPropagation();
      if (confirm('Remove ' + p.name + '? Their stars and progress will be erased.')) {
        deleteProfile(p.id);
        const remaining = loadProfiles();
        showProfiles(remaining.length ? 'pick' : 'create');
      }
    });

    grid.appendChild(card);
  });

  // "Add player" card
  const add = document.createElement('div');
  add.className = 'profile-card profile-add';
  add.innerHTML =
    '<div class="profile-emoji">➕</div>' +
    '<div class="profile-name">Add player</div>';
  add.addEventListener('click', openCreateForm);
  grid.appendChild(add);

  const createEl = document.getElementById('profile-create');
  if (mode === 'create' || profiles.length === 0) {
    openCreateForm();
  } else {
    createEl.classList.add('hidden');
  }
}

function openCreateForm() {
  const createEl = document.getElementById('profile-create');
  const nameInput = document.getElementById('profile-name-input');
  const picker = document.getElementById('emoji-picker');

  nameInput.value = '';
  selectedEmoji = AVATARS[0][0];

  // Build emoji picker
  picker.innerHTML = '';
  AVATARS.forEach(function(av, i) {
    const btn = document.createElement('button');
    btn.className = 'emoji-option' + (i === 0 ? ' selected' : '');
    btn.textContent = av[0];
    btn.setAttribute('data-color', av[1]);
    btn.addEventListener('click', function() {
      selectedEmoji = av[0];
      picker.querySelectorAll('.emoji-option').forEach(function(el) {
        el.classList.remove('selected');
      });
      btn.classList.add('selected');
    });
    picker.appendChild(btn);
  });

  createEl.classList.remove('hidden');
  nameInput.focus();
}

function saveNewProfile() {
  const nameInput = document.getElementById('profile-name-input');
  const name = (nameInput.value || '').trim() || 'Player';
  // Find the color paired with the selected emoji
  const match = AVATARS.find(function(av) { return av[0] === selectedEmoji; });
  const color = match ? match[1] : '#F0A500';
  const id = createProfile(name, selectedEmoji, color);
  setActiveProfileId(id);
  renderHome();
}

function selectProfile(id) {
  setActiveProfileId(id);
  renderHome();
}

// ================================================================
// ABOUT
// ================================================================

function openAbout() {
  // Standard: the About page is its own URL (shareable, prints to a PDF flyer).
  // Same-origin in-app navigation is safe inside a standalone PWA.
  window.location.href = 'about.html';
}

function closeAbout() {
  document.getElementById('about-overlay').classList.add('hidden');
}

// ---- Update button: force-pull the latest version ----
// iOS often resumes an installed (Home-Screen) app from memory instead of
// reloading, so it never sees a new release. This updates the service worker,
// clears caches, and does a cache-busted reload. Needs the network.
function updateApp(btn) {
  if (!navigator.onLine) { alert('Connect to Wi-Fi or cellular, then tap Update again.'); return; }
  if (btn) btn.textContent = '🔄 Updating…';
  (async function () {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function (r) { return r.update().catch(function () {}); }));
      }
      if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(function (k) { return caches.delete(k); })); }
    } catch (e) { /* ignore */ }
    location.href = 'index.html?u=' + Date.now();
  })();
}

/**
 * The next lesson to do = the first unlocked lesson that isn't finished yet.
 * Used to show a "Start here" guide so the learner always knows where to go.
 */
function getNextLessonId(progress) {
  for (let i = 0; i < LESSONS.length; i++) {
    const lesson = LESSONS[i];
    const result = progress.completedLessons[lesson.id];
    const done = result && result.stars >= 1;
    if (isLessonUnlocked(lesson.id, progress) && !done) {
      return lesson.id;
    }
  }
  return null; // everything finished
}

function renderLevelSections(progress) {
  const container = document.getElementById('levels-container');
  container.innerHTML = '';

  renderGameZone(container, progress);

  const nextId = getNextLessonId(progress);

  LEVELS.forEach(function(level) {
    const levelEl = document.createElement('div');
    levelEl.className = 'level-section';

    // Apply level color accent
    const color = LEVEL_COLORS[level.id] || 'var(--gold)';
    const header = document.createElement('div');
    header.className = 'level-header';
    header.innerHTML = `
      <span class="level-title" style="color:${color}">${level.title}</span>
      <span class="level-subtitle">${level.subtitle}</span>
    `;
    levelEl.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'lessons-grid';

    const lessons = getLessonsForLevel(level.id);
    lessons.forEach(function(lesson) {
      const card = createLessonCard(lesson, progress, color, nextId);
      grid.appendChild(card);
    });

    // Module test card for this level
    const exam = getExamForLevel(level.id);
    if (exam) {
      grid.appendChild(createExamCard(exam, progress, color));
    }

    levelEl.appendChild(grid);
    container.appendChild(levelEl);
  });

  // Final Exam section at the very end
  const finalExam = getFinalExam();
  const finalSection = document.createElement('div');
  finalSection.className = 'level-section';
  const finalHeader = document.createElement('div');
  finalHeader.className = 'level-header';
  finalHeader.innerHTML =
    '<span class="level-title" style="color:var(--gold)">🏆 Final Exam</span>' +
    '<span class="level-subtitle">Prove you can type</span>';
  finalSection.appendChild(finalHeader);
  const finalGrid = document.createElement('div');
  finalGrid.className = 'lessons-grid';
  finalGrid.appendChild(createExamCard(finalExam, progress, 'var(--gold)'));
  finalSection.appendChild(finalGrid);
  container.appendChild(finalSection);
}

/**
 * "Game Zone" section at the top of the home screen — one wide tile that
 * launches Word Zap (js/game.js). Always available: the word pool falls
 * back to lesson 1's F/J keys for a brand-new player.
 */
function renderGameZone(container, progress) {
  const best = (progress.games && progress.games.wordzap) || null;

  const section = document.createElement('div');
  section.className = 'level-section';

  const header = document.createElement('div');
  header.className = 'level-header';
  header.innerHTML =
    '<span class="level-title" style="color:var(--pink)">🎮 Game Zone</span>' +
    '<span class="level-subtitle">Practice with a game</span>';
  section.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'lessons-grid';

  const tile = document.createElement('div');
  tile.className = 'lesson-card unlocked game-tile';
  tile.id = 'game-tile';
  tile.innerHTML =
    '<div class="card-exam-icon">⚡</div>' +
    '<div class="card-title">Word Zap</div>' +
    '<div class="card-exam-sub">Zap falling words with the keys you know!</div>' +
    (best && best.highScore
      ? '<div class="exam-status passed">🏆 Best: ' + best.highScore + '</div>'
      : '<div class="exam-status ready">Play</div>');
  tile.addEventListener('click', function() { startWordZap(); });
  grid.appendChild(tile);

  section.appendChild(grid);
  container.appendChild(section);
}

/** Build a test/exam card for the home screen. */
function createExamCard(exam, progress, accentColor) {
  const unlocked = exam.isFinal
    ? isFinalExamUnlocked(progress)
    : isModuleExamUnlocked(exam.level, progress);
  const passed = examPassed(exam.id, progress);
  const rec = progress.exams && progress.exams[exam.id];

  const card = document.createElement('div');
  card.className = 'lesson-card exam-card'
    + (unlocked ? ' unlocked' : ' locked')
    + (passed ? ' passed' : '')
    + (exam.isFinal ? ' final' : '');

  const icon = exam.isFinal ? '🏆' : '📝';
  const statusHtml = passed
    ? `<div class="exam-status passed">✓ Passed${rec && rec.bestWpm ? ' · ' + rec.bestWpm + ' WPM' : ''}</div>`
    : (unlocked
        ? '<div class="exam-status ready">Ready</div>'
        : '<div class="exam-status">Locked</div>');

  card.innerHTML = `
    <div class="card-exam-icon">${icon}</div>
    <div class="card-title">${exam.title}</div>
    <div class="card-exam-sub">${exam.subtitle}</div>
    ${statusHtml}
    ${!unlocked ? '<div class="card-lock">🔒</div>' : ''}
  `;

  if (unlocked) {
    card.addEventListener('click', function() { showExamIntro(exam.id); });
  }
  return card;
}

function createLessonCard(lesson, progress, accentColor, nextId) {
  const unlocked = isLessonUnlocked(lesson.id, progress);
  const result = progress.completedLessons[lesson.id];
  const stars = result ? result.stars : 0;
  const completed = stars >= 1;
  const isNext = lesson.id === nextId;

  const card = document.createElement('div');
  card.className = 'lesson-card'
    + (unlocked ? ' unlocked' : ' locked')
    + (completed ? ' completed' : '')
    + (isNext ? ' next-up' : '');

  // Apply level accent color to completed cards
  if (completed && accentColor) {
    card.style.borderColor = accentColor.replace(')', ', 0.4)').replace('rgb', 'rgba').replace('#', 'rgba(').replace('var(--gold)', 'rgba(240,165,0,0.4)');
  }

  // Stars row
  let starsHtml = '';
  for (let i = 1; i <= 3; i++) {
    starsHtml += `<span class="card-star ${i <= stars ? 'filled' : 'empty'}">★</span>`;
  }

  // WPM badge if completed
  const wpmBadge = (completed && result.wpm)
    ? `<span class="card-wpm">${result.wpm} WPM</span>`
    : '';

  card.innerHTML = `
    ${isNext ? '<div class="card-badge">Start here</div>' : ''}
    <div class="card-number">${lesson.id}</div>
    <div class="card-title">${lesson.title}</div>
    <div class="card-stars">${starsHtml}${wpmBadge}</div>
    ${!unlocked ? '<div class="card-lock">🔒</div><div class="card-unlock-hint">Tap to unlock</div>' : ''}
  `;

  if (unlocked) {
    card.addEventListener('click', function() { startLesson(lesson.id); });
  } else {
    // Tap a locked lesson to unlock it (confirm first), then continue forward.
    card.addEventListener('click', function() { unlockLesson(lesson.id); });
  }

  return card;
}

function renderStatsBar(progress) {
  const completed = Object.keys(progress.completedLessons).length;
  const allResults = Object.values(progress.completedLessons);
  const bestWpm = allResults.length
    ? Math.max(...allResults.map(r => r.wpm || 0))
    : 0;
  const avgAccuracy = allResults.length
    ? Math.round(allResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / allResults.length)
    : 0;

  document.getElementById('stat-completed').textContent = completed;
  document.getElementById('stat-wpm').textContent = bestWpm;
  document.getElementById('stat-accuracy').textContent = allResults.length ? avgAccuracy + '%' : '—';
}

// ================================================================
// LESSON INTRO SCREEN
// ================================================================

/**
 * showLessonIntro(lessonId)
 * Populates the intro screen and shows it.
 * The "Start Lesson" button on the intro screen calls beginLesson().
 */
function showLessonIntro(lessonId) {
  const lesson = getLessonById(lessonId);
  if (!lesson) return;

  state.lesson = lesson;

  // Level info
  const level = getLevelForLesson(lessonId);
  const levelName = level ? level.title : 'Level ' + lesson.level;
  const levelColor = LEVEL_COLORS[lesson.level] || 'var(--gold)';

  // Set level badge
  const badgeEl = document.getElementById('intro-level-badge');
  badgeEl.textContent = 'Level ' + lesson.level + ' — ' + levelName;
  badgeEl.style.background = levelColor;
  badgeEl.style.color = lesson.level >= 2 ? '#0F1923' : '#0F1923';

  // Title
  document.getElementById('intro-title').textContent = lesson.title;

  // Tip/subtitle
  const tipText = lesson.tip || 'Get ready — keep your fingers on the home row!';
  document.getElementById('intro-subtitle').textContent = tipText;
  document.getElementById('intro-tip').innerHTML =
    '<span class="intro-tip-icon">💡</span> ' + tipText;

  // Key tiles — show the NEW keys this lesson introduces (not every key
  // learned so far). Compute the delta vs. the previous lesson. Space is
  // excluded because it's used from the very first lesson.
  const keysDisplay = document.getElementById('intro-keys-display');
  const keysLabel = document.getElementById('intro-keys-label');
  keysDisplay.innerHTML = '';

  const prevLesson = getLessonById(lessonId - 1);
  const prevKeys = prevLesson ? prevLesson.keys : [];
  const newKeys = lesson.keys.filter(function(k) {
    return k !== ' ' && prevKeys.indexOf(k) === -1;
  });

  let keysToShow;
  if (newKeys.length > 0) {
    keysToShow = newKeys.slice(0, 12);
    if (keysLabel) {
      keysLabel.textContent = newKeys.length === 1
        ? 'New key in this lesson' : 'New keys in this lesson';
    }
  } else {
    // Review / speed lesson — no new keys. Show the keys being practiced.
    keysToShow = lesson.keys.filter(function(k) { return k !== ' '; }).slice(0, 12);
    if (keysLabel) keysLabel.textContent = "Keys you'll practice (review)";
  }

  keysToShow.forEach(function(k) {
    const tile = document.createElement('div');
    tile.className = 'intro-key-tile';

    // Color by finger
    const fingerClass = FINGER_MAP[k] || 'finger-space';
    tile.classList.add('intro-key-tile--' + fingerClass.replace('finger-', ''));

    // Display label: numbers as-is, letters uppercase, space as "Space"
    let label = k;
    if (k === ' ') {
      label = 'Space';
      tile.classList.add('intro-key-tile--wide');
    } else if (k.length === 1 && k >= 'a' && k <= 'z') {
      label = k.toUpperCase();
    }

    tile.textContent = label;
    keysDisplay.appendChild(tile);
  });

  // Wire the "Start Lesson" button for this specific lesson
  const startBtn = document.getElementById('btn-start-lesson');
  // Remove old listener by replacing the button (simplest approach)
  const newBtn = startBtn.cloneNode(true);
  startBtn.parentNode.replaceChild(newBtn, startBtn);
  newBtn.addEventListener('click', function() {
    beginLesson(lessonId);
  });

  showView('intro');
}

/**
 * startLesson(lessonId)
 * Entry point from lesson card click — shows the intro screen first.
 */
function startLesson(lessonId) {
  showLessonIntro(lessonId);
}

/**
 * beginLesson(lessonId)
 * Actually starts the typing exercise (called from intro "Start Lesson" button).
 */
function beginLesson(lessonId) {
  const lesson = getLessonById(lessonId);
  if (!lesson) return;

  state.activeExam = null;
  state.examScoreMode = null;
  state.lesson = lesson;
  state.exerciseIndex = 0;
  startExercise();
}

// ================================================================
// EXAM INTRO + RUN
// ================================================================

/** Show the exam intro screen with the two test modes. */
function showExamIntro(examId) {
  const exam = getExamById(examId);
  if (!exam) return;
  state.activeExam = exam;

  document.getElementById('exam-intro-title').textContent =
    (exam.isFinal ? '🏆 ' : '📝 ') + exam.title;
  document.getElementById('exam-intro-sub').textContent = exam.subtitle;
  document.getElementById('exam-intro-desc').textContent = exam.intro;

  // Requirement text on each mode button
  document.getElementById('exam-req-accuracy').textContent =
    'Pass at ' + EXAM_ACCURACY_ONLY_PASS + '%+ accuracy (any speed)';
  document.getElementById('exam-req-speed').textContent =
    'Pass at ' + exam.passAccuracy + '%+ accuracy AND ' + exam.targetWPM + '+ WPM';

  // Wire the two mode buttons fresh
  const accBtn = document.getElementById('btn-exam-accuracy');
  const spdBtn = document.getElementById('btn-exam-speed');
  accBtn.onclick = function() { beginExam(exam.id, 'accuracy'); };
  spdBtn.onclick = function() { beginExam(exam.id, 'speed'); };

  showView('exam-intro');
}

/** Start an exam in the chosen scoring mode. */
function beginExam(examId, scoreMode) {
  const exam = getExamById(examId);
  if (!exam) return;

  state.activeExam = exam;
  state.examScoreMode = scoreMode;
  // Reuse the lesson engine: present the exam as a one-"exercise" lesson.
  state.lesson = {
    id: exam.id,
    title: exam.title,
    level: exam.level || 4,
    exercises: [exam.text],
    targetWPM: exam.targetWPM,
    __isExam: true
  };
  state.exerciseIndex = 0;
  startExercise();
}

// ================================================================
// LESSON / TYPING SCREEN
// ================================================================

function startExercise() {
  const lesson = state.lesson;
  const text = lesson.exercises[state.exerciseIndex];

  state.exerciseText = text;
  state.charIndex = 0;
  state.totalKeystrokes = 0;
  state.errorCount = 0;
  state.inError = false;
  state.startTime = null;

  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  // Set the level accent bar color
  const levelBar = document.getElementById('lesson-level-bar');
  if (levelBar) {
    levelBar.style.background = LEVEL_COLORS[lesson.level] || 'var(--gold)';
  }

  // Render lesson UI
  document.getElementById('lesson-title').textContent = lesson.title;

  const examing = inExam();
  const lessonView = document.getElementById('view-lesson');
  lessonView.classList.toggle('exam-mode', examing);

  if (examing) {
    document.getElementById('lesson-exercise-counter').textContent =
      (state.examScoreMode === 'speed' ? 'Speed + Accuracy Test' : 'Accuracy Test');
  } else {
    document.getElementById('lesson-exercise-counter').textContent =
      `Exercise ${state.exerciseIndex + 1} of ${lesson.exercises.length}`;
  }

  updateProgressBar();
  renderTypingArea();
  updateStats();

  // Coaching (highlight next key + finger hint) only during lessons — an exam
  // is a real test, so the learner gets no on-screen help.
  if (examing) {
    clearHighlights();
    const hintEl = document.getElementById('finger-hint');
    if (hintEl) hintEl.innerHTML = '';
  } else {
    highlightKey(text[0]);
  }

  showView('lesson');
}

/**
 * Render the typing text area with colored spans for each character.
 * Characters before charIndex are 'done', charIndex is 'current', rest are 'upcoming'.
 */
function renderTypingArea() {
  const container = document.getElementById('typing-text');
  const text = state.exerciseText;
  let html = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const display = ch === ' ' ? '&nbsp;' : ch;

    if (i < state.charIndex) {
      html += `<span class="char done">${display}</span>`;
    } else if (i === state.charIndex) {
      html += `<span class="char current" id="char-current">${display}</span>`;
    } else {
      html += `<span class="char upcoming">${display}</span>`;
    }
  }

  container.innerHTML = html;

  // Scroll current character into view
  const currentEl = document.getElementById('char-current');
  if (currentEl) {
    currentEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

/**
 * Update the WPM and accuracy displays.
 */
function updateStats() {
  const elapsed = state.startTime
    ? (Date.now() - state.startTime) / 60000
    : 0;

  const wpm = elapsed > 0
    ? Math.min(MAX_WPM, Math.round((state.charIndex / 5) / elapsed))
    : 0;

  const accuracy = state.totalKeystrokes > 0
    ? Math.round(((state.totalKeystrokes - state.errorCount) / state.totalKeystrokes) * 100)
    : 100;

  document.getElementById('stat-wpm-live').textContent = wpm;
  document.getElementById('stat-accuracy-live').textContent = accuracy + '%';
}

/**
 * Update the progress bar.
 */
function updateProgressBar() {
  const total = state.exerciseText.length;
  const done = state.charIndex;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${done} / ${total}`;
}

// ================================================================
// TYPING ENGINE
// ================================================================

/**
 * Main keydown handler — attached to window.
 */
function handleKeyDown(e) {
  if (state.view !== 'lesson') return;

  const text = state.exerciseText;
  const idx = state.charIndex;

  // Prevent browser shortcuts (but allow Cmd+R for reload during dev)
  if (!e.metaKey && !e.ctrlKey) {
    e.preventDefault();
  }

  // Ignore pure modifier keys
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab',
       'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
       'Escape', 'F1', 'F2', 'F3', 'F4', 'F5'].includes(e.key)) {
    return;
  }

  // Start timer on first real keystroke
  if (!state.startTime && idx < text.length) {
    state.startTime = Date.now();
    state.timerInterval = setInterval(updateStats, 1000);
  }

  // Backspace — move back one position
  if (e.key === 'Backspace') {
    if (state.charIndex > 0) {
      state.charIndex--;
      state.inError = false;
      renderTypingArea();
      updateProgressBar();
      const nextChar = text[state.charIndex];
      if (nextChar !== undefined && !inExam()) {
        highlightKey(nextChar);
      }
    }
    return;
  }

  // Already at end — nothing to do
  if (idx >= text.length) return;

  const expected = text[idx];
  const typed = e.key.length === 1 ? e.key : null;

  if (typed === null) return; // Non-character key we don't handle

  state.totalKeystrokes++;

  if (typed === expected) {
    // --- CORRECT ---
    state.inError = false;
    state.charIndex++;

    playCorrectSound();
    if (!inExam()) flashKeyCorrect(expected);

    // Re-render typing area
    renderTypingArea();
    updateProgressBar();
    updateStats();

    // Highlight next key (lessons only — exams give no help)
    if (!inExam()) {
      if (state.charIndex < text.length) {
        highlightKey(text[state.charIndex]);
      } else {
        clearHighlights();
      }
    }

    // Check if exercise complete
    if (state.charIndex >= text.length) {
      onExerciseComplete();
    }

  } else {
    // --- WRONG ---
    state.errorCount++;
    playErrorSound();
    triggerErrorFeedback();
    updateStats();
  }
}

/**
 * Trigger visual error feedback — red flash + shake on current character.
 */
function triggerErrorFeedback() {
  const currentEl = document.getElementById('char-current');
  if (!currentEl) return;

  currentEl.classList.remove('shake'); // Reset if already shaking
  void currentEl.offsetWidth; // Force reflow to restart animation
  currentEl.classList.add('error-flash', 'shake');

  setTimeout(function() {
    if (currentEl) {
      currentEl.classList.remove('error-flash', 'shake');
    }
  }, 400);
}

/**
 * Called when the user finishes typing all characters in an exercise.
 */
function onExerciseComplete() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;

  const elapsed = state.startTime
    ? (Date.now() - state.startTime) / 60000
    : 0.01;

  const charsTyped = state.exerciseText.length;
  const wpm = Math.min(MAX_WPM, Math.round((charsTyped / 5) / elapsed));
  const accuracy = state.totalKeystrokes > 0
    ? Math.round(((state.totalKeystrokes - state.errorCount) / state.totalKeystrokes) * 100)
    : 100;
  const seconds = Math.round(elapsed * 60);

  // --- EXAM: single passage, evaluate pass/fail ---
  if (inExam()) {
    const exam = state.activeExam;
    const passed = evaluateExam(exam, state.examScoreMode, accuracy, wpm);
    state.results = { wpm, accuracy, seconds, passed, mode: state.examScoreMode };
    recordExamResult(exam.id, state.examScoreMode, passed, wpm, accuracy, seconds);
    if (passed) playLessonCompleteSound(); else playErrorSound();
    setTimeout(showExamResults, 500);
    return;
  }

  // Check if more exercises remain in this lesson
  const lesson = state.lesson;
  const hasMore = state.exerciseIndex < lesson.exercises.length - 1;

  if (hasMore) {
    // Move to next exercise after a brief pause
    setTimeout(function() {
      state.exerciseIndex++;
      startExercise();
    }, 600);
  } else {
    // All exercises done — show results
    const stars = calculateStars(accuracy, wpm, lesson.targetWPM);
    state.results = { wpm, accuracy, seconds, stars };

    recordLessonCompletion(lesson.id, stars, wpm, accuracy, seconds);

    playLessonCompleteSound();

    setTimeout(function() {
      showResults();
    }, 500);
  }
}

/**
 * Calculate star rating.
 */
function calculateStars(accuracy, wpm, targetWPM) {
  if (accuracy >= STAR_3_ACCURACY && wpm >= targetWPM) return 3;
  if (accuracy >= STAR_2_ACCURACY) return 2;
  if (accuracy >= STAR_1_ACCURACY) return 1;
  return 0;
}

// ================================================================
// RESULTS SCREEN
// ================================================================

function showResults() {
  const { wpm, accuracy, seconds, stars } = state.results;

  // Reset to lesson chrome (in case the last view was an exam result)
  document.getElementById('results-title').textContent = 'Lesson Complete!';
  document.getElementById('results-exam-banner').classList.add('hidden');
  document.getElementById('results-certificate').classList.add('hidden');
  document.getElementById('results-stars').classList.remove('hidden');
  document.getElementById('btn-try-again').textContent = 'Try Again';

  // Lesson name
  document.getElementById('results-lesson-name').textContent = state.lesson.title;

  // Stats
  document.getElementById('results-wpm').textContent = wpm;
  document.getElementById('results-accuracy').textContent = accuracy + '%';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  document.getElementById('results-time').textContent =
    mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  // Stars — animate them lighting up in sequence
  const starEls = document.querySelectorAll('.result-star');
  starEls.forEach(function(el, i) {
    el.classList.remove('lit', 'animate-in');
    if (i < stars) {
      setTimeout(function() {
        el.classList.add('lit', 'animate-in');
      }, 300 + i * 400);
    }
  });

  // Encouragement message
  const messages = ENCOURAGEMENT[Math.max(1, stars)] || ENCOURAGEMENT[1];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  document.getElementById('results-message').textContent = msg;

  // "Next Lesson" button — show only if next lesson exists and is now unlocked
  const nextLesson = getLessonById(state.lesson.id + 1);
  const progress = loadProgress();
  const nextBtn = document.getElementById('btn-next-lesson');

  if (nextLesson && isLessonUnlocked(nextLesson.id, progress)) {
    nextBtn.classList.remove('hidden');
    nextBtn.onclick = function() { startLesson(nextLesson.id); };
  } else {
    nextBtn.classList.add('hidden');
  }

  showView('results');
}

/**
 * Exam results — pass/fail, recorded accuracy + time + speed, and a
 * certificate when the final exam is passed.
 */
function showExamResults() {
  const exam = state.activeExam;
  const { wpm, accuracy, seconds, passed, mode } = state.results;

  // Stats
  document.getElementById('results-wpm').textContent = wpm;
  document.getElementById('results-accuracy').textContent = accuracy + '%';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  document.getElementById('results-time').textContent =
    mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  // Hide the stars row — exams use a pass/fail banner instead
  document.getElementById('results-stars').classList.add('hidden');

  document.getElementById('results-lesson-name').textContent =
    exam.title + ' · ' + (mode === 'speed' ? 'Speed + Accuracy' : 'Accuracy');

  // Title + banner
  const titleEl = document.getElementById('results-title');
  const banner = document.getElementById('results-exam-banner');
  banner.classList.remove('hidden');

  const requirement = (mode === 'accuracy')
    ? 'Needed: ' + EXAM_ACCURACY_ONLY_PASS + '%+ accuracy'
    : 'Needed: ' + exam.passAccuracy + '%+ accuracy and ' + exam.targetWPM + '+ WPM';

  if (passed) {
    titleEl.textContent = exam.isFinal ? 'Certified! 🏆' : 'Test Passed! 🎉';
    banner.className = 'results-exam-banner pass';
    banner.textContent = '✓ PASSED — ' + requirement;
  } else {
    titleEl.textContent = 'Almost There!';
    banner.className = 'results-exam-banner fail';
    banner.textContent = '✗ Not yet — ' + requirement + '. Keep practicing and try again!';
  }

  // Certificate for a passed final exam
  const cert = document.getElementById('results-certificate');
  if (exam.isFinal && passed) {
    const ap = getActiveProfile();
    const name = ap ? ap.name : 'Typist';
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    cert.innerHTML =
      '<div class="cert-banner">🏆 Certificate of Typing 🏆</div>' +
      '<div class="cert-name">' + name + '</div>' +
      '<div class="cert-text">has completed KeyQuest and can type with ' +
      accuracy + '% accuracy at ' + wpm + ' WPM.</div>' +
      '<div class="cert-date">' + dateStr + '</div>' +
      '<div class="cert-sign">Coniker Systems™ · v' + APP_VERSION + '</div>';
    cert.classList.remove('hidden');
  } else {
    cert.classList.add('hidden');
  }

  // Message
  document.getElementById('results-message').textContent = passed
    ? (exam.isFinal
        ? 'Incredible! You finished the whole program. You are a real typist now!'
        : 'Great work — you passed this test. On to the next challenge!')
    : 'So close! Practice the lessons a little more, then take the test again.';

  // Buttons: retake this test, no "next lesson"
  document.getElementById('btn-next-lesson').classList.add('hidden');
  const tryBtn = document.getElementById('btn-try-again');
  tryBtn.textContent = 'Try Test Again';

  showView('results');
}

// ================================================================
// BUTTON HANDLERS
// ================================================================

function setupButtonHandlers() {
  // Intro screen — back to home
  document.getElementById('btn-intro-back').addEventListener('click', function() {
    renderHome();
  });

  // Exam intro — back to home
  document.getElementById('btn-exam-back').addEventListener('click', function() {
    renderHome();
  });

  // Lesson screen — back to home
  document.getElementById('btn-back-home').addEventListener('click', function() {
    clearInterval(state.timerInterval);
    clearHighlights();
    renderHome();
  });

  // Results screen — try again (re-open the exam, or retry the lesson)
  document.getElementById('btn-try-again').addEventListener('click', function() {
    if (inExam() && state.activeExam) {
      showExamIntro(state.activeExam.id);
      return;
    }
    startLesson(state.lesson.id);
  });

  // Results screen — go home
  document.getElementById('btn-results-home').addEventListener('click', function() {
    renderHome();
  });

  // Home — switch player
  document.getElementById('btn-switch-player').addEventListener('click', function() {
    showProfiles('pick');
  });

  // Home — share + feedback are handled by the reusable js/feedback.js widget
  // (loaded after app.js). Header buttons trigger it; no floating button.
  document.getElementById('btn-share').addEventListener('click', function() {
    if (window.Feedback) window.Feedback.shareApp();
  });
  document.getElementById('btn-feedback').addEventListener('click', function() {
    if (window.Feedback) window.Feedback.open();
  });

  // Home — force-pull the latest version (iOS resume gotcha)
  document.getElementById('btn-update').addEventListener('click', function() {
    updateApp(this);
  });

  // Home — about
  document.getElementById('btn-about').addEventListener('click', openAbout);
  document.getElementById('btn-about-close').addEventListener('click', closeAbout);
  document.getElementById('btn-about-ok').addEventListener('click', closeAbout);
  document.getElementById('about-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeAbout();
  });

  // Profile create form — save / cancel
  document.getElementById('btn-create-save').addEventListener('click', saveNewProfile);
  document.getElementById('btn-create-cancel').addEventListener('click', function() {
    const profiles = loadProfiles();
    if (profiles.length) {
      showProfiles('pick');
    } else {
      document.getElementById('profile-create').classList.add('hidden');
    }
  });
  // Enter key in the name field creates the player
  document.getElementById('profile-name-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveNewProfile(); }
  });

  // "Next Lesson" and "Start Lesson" are set up dynamically
}

// ================================================================
// KEYBOARD SHORTCUT GUARD
// Prevent iPad/browser from intercepting common keys during typing
// ================================================================

window.addEventListener('keydown', handleKeyDown, { passive: false });

// ================================================================
// SERVICE WORKER REGISTRATION
// ================================================================

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Don't cache during local development — caching makes the dev preview serve
  // stale files. Also self-heal: tear down any existing worker + caches so a
  // previously-installed dev worker stops intercepting requests.
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '';
  if (isLocal) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(r) { r.unregister(); });
    });
    if (window.caches) {
      caches.keys().then(function(keys) { keys.forEach(function(k) { caches.delete(k); }); });
    }
    return;
  }

  // Production (e.g. GitHub Pages) — register for offline use.
  navigator.serviceWorker.register('sw.js')
    .then(function(reg) {
      console.log('[KeyQuest] Service worker registered:', reg.scope);
    })
    .catch(function(err) {
      console.warn('[KeyQuest] Service worker registration failed:', err);
    });
}

/** Write "© <year> Coniker Systems™ · vX.Y.Z" into every credit line. */
function stampVersion() {
  const label = '© ' + new Date().getFullYear() + ' Coniker Systems™ · v' + APP_VERSION;
  document.querySelectorAll('.app-credit, .about-credit').forEach(function(el) {
    el.textContent = label;
  });
}

// ================================================================
// APP BOOT
// ================================================================

function boot() {
  // Register PWA service worker
  registerServiceWorker();

  // Render the visual keyboard + finger legend in the lesson view
  renderKeyboard(document.getElementById('keyboard-container'));
  renderFingerLegend(document.getElementById('finger-legend'));

  // Wire up all static button handlers
  setupButtonHandlers();

  // Stamp the version into the footer credits
  stampVersion();

  // Bring any old single-profile save forward into a profile
  migrateLegacyProgress();

  // Decide the first screen: create a player, pick a player, or go home
  const profiles = loadProfiles();
  const active = getActiveProfile();
  if (profiles.length === 0) {
    showProfiles('create');
  } else if (!active) {
    showProfiles('pick');
  } else {
    renderHome();
  }
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', boot);
