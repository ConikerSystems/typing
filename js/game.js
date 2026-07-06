/**
 * KeyQuest — Word Zap (arcade typing game)
 *
 * Words fall from the top of the playfield; type them to zap them before
 * they reach the ground. The word pool is built ONLY from keys the active
 * player has unlocked in the lessons, so the game is always practice for
 * exactly what they know. Three landed words = game over. High score is
 * saved per profile in progress.games.wordzap.
 *
 * Reuses from app.js (global functions): loadProgress, saveProgress,
 * getAudioCtx, playCorrectSound, playErrorSound, playLessonCompleteSound,
 * showView, renderHome, state.
 */

'use strict';

// ================================================================
// WORD BANK — kid-friendly, lowercase a-z only, 2-7 letters.
// buildWordBank() filters this by the player's unlocked keys.
// ================================================================

const ZAP_WORDS = [
  // home-row friendly (playable early, once A/S/D/F/J/K/L are known)
  'as', 'ask', 'asks', 'dad', 'dads', 'sad', 'lad', 'lads', 'fad', 'fads',
  'add', 'adds', 'all', 'fall', 'falls', 'lass', 'alas', 'salad', 'flask',
  // animals
  'cat', 'dog', 'pig', 'cow', 'fox', 'bee', 'ant', 'bug', 'bat', 'rat',
  'fish', 'bird', 'frog', 'bear', 'lion', 'wolf', 'duck', 'goat', 'crab',
  'seal', 'deer', 'moose', 'shark', 'whale', 'snake', 'mouse', 'horse',
  'tiger', 'zebra', 'panda', 'koala', 'otter', 'eagle', 'robin', 'skunk',
  // action words
  'run', 'jump', 'play', 'read', 'sing', 'swim', 'kick', 'clap', 'snap',
  'spin', 'race', 'zoom', 'dash', 'ride', 'slide', 'climb', 'throw',
  'catch', 'dance', 'skate', 'float', 'crawl', 'sneak', 'dive', 'flip',
  // zappy words
  'zap', 'pow', 'bam', 'boom', 'bang', 'whiz', 'bolt', 'flash', 'spark',
  'blast', 'laser', 'flame', 'glow', 'shine', 'storm', 'comet', 'smash',
  // adventure
  'robot', 'ninja', 'magic', 'dragon', 'wizard', 'knight', 'sword',
  'crown', 'king', 'queen', 'castle', 'tower', 'cave', 'map', 'gem',
  'coin', 'chest', 'key', 'lock', 'door', 'hero', 'quest', 'trap',
  'rocket', 'space', 'alien', 'orbit', 'earth', 'mars', 'moon', 'star',
  // food
  'cake', 'milk', 'rice', 'soup', 'taco', 'pizza', 'candy', 'apple',
  'grape', 'lemon', 'mango', 'peach', 'berry', 'bread', 'chip', 'corn',
  'egg', 'ham', 'jam', 'pie', 'nut', 'melon', 'donut', 'salsa', 'chips',
  // nature
  'sun', 'sky', 'sea', 'rain', 'snow', 'wind', 'cloud', 'lake', 'hill',
  'rock', 'sand', 'leaf', 'seed', 'root', 'tree', 'pond', 'reef', 'dune',
  // things
  'ship', 'boat', 'car', 'bus', 'train', 'bike', 'kite', 'drum', 'bell',
  'ball', 'goal', 'game', 'prize', 'medal', 'team', 'book', 'page',
  'word', 'desk', 'chair', 'lamp', 'room', 'home', 'wall', 'roof',
  'paper', 'glue', 'ruler', 'chalk', 'class', 'brush', 'paint',
  // describing words
  'fast', 'slow', 'big', 'small', 'tall', 'tiny', 'cold', 'hot', 'wet',
  'dry', 'new', 'old', 'red', 'blue', 'green', 'gold', 'pink', 'gray',
  'happy', 'silly', 'funny', 'brave', 'super', 'mega', 'ultra', 'epic',
  'cool', 'neat', 'loud', 'soft', 'shiny', 'sneaky', 'mighty',
  // little words (easy targets)
  'go', 'up', 'in', 'on', 'at', 'it', 'is', 'am', 'we', 'me', 'my',
  'do', 'so', 'no', 'and', 'the', 'you', 'was', 'are', 'had', 'has',
  'yes', 'wow', 'yay', 'fun', 'day', 'night', 'smile', 'laugh'
];

// How many words trigger a level-up
const ZAP_WORDS_PER_LEVEL = 8;

// Score per letter (multiplied by streak bonus)
const ZAP_POINTS_PER_LETTER = 10;

// ================================================================
// GAME STATE
// ================================================================

const zap = {
  running: false,
  paused: false,
  words: [],        // [{ text, x, y, speed, matched, el }]
  target: null,     // the word currently locked on
  score: 0,
  level: 1,
  lives: 3,
  zapCount: 0,      // words zapped this game (drives level-ups)
  streak: 0,        // words zapped without a wrong key or a landed word
  spawnTimer: 0,
  lastTs: 0,
  rafId: null,
  bank: [],         // playable words for this player's unlocked keys
  keys: []          // the unlocked letter pool
};

// ================================================================
// KEY POOL + WORD BANK
// ================================================================

/**
 * Letters the player has unlocked: lesson 1's keys as a floor, plus every
 * key from lessons completed with at least one star. Letters only —
 * punctuation, digits, and space aren't fun falling targets.
 */
function getZapKeys(progress) {
  const pool = new Set(getLessonById(1).keys);
  LESSONS.forEach(function(l) {
    const r = progress.completedLessons[l.id];
    if (r && r.stars >= 1) l.keys.forEach(function(k) { pool.add(k); });
  });
  return Array.from(pool).filter(function(k) { return /^[a-z]$/.test(k); });
}

/**
 * Real words typeable with the given keys; padded with generated letter
 * drills (fj, jfk, dkfj…) when the pool is too small for real words —
 * which is exactly the case in the first few lessons ({f,j} has no vowels).
 */
function buildWordBank(keys) {
  const set = new Set(keys);
  const real = ZAP_WORDS.filter(function(w) {
    return w.split('').every(function(ch) { return set.has(ch); });
  });
  if (real.length >= 20) return real;
  return real.concat(makeDrillWords(keys, 30 - real.length));
}

/** Generate n short letter-combo "words" (2-4 chars) from the key pool. */
function makeDrillWords(keys, n) {
  const out = [];
  let guard = 0;
  while (out.length < n && guard < n * 20) {
    guard++;
    const len = 2 + Math.floor(Math.random() * 3);
    let w = '';
    for (let i = 0; i < len; i++) {
      let ch = keys[Math.floor(Math.random() * keys.length)];
      // no letter three times in a row
      if (w.length >= 2 && w[w.length - 1] === ch && w[w.length - 2] === ch) {
        ch = keys[(keys.indexOf(ch) + 1) % keys.length];
      }
      w += ch;
    }
    // skip single-letter repeats like "ff" only if we have variety available
    if (keys.length > 1 && w.split('').every(function(c) { return c === w[0]; })) continue;
    if (out.indexOf(w) === -1) out.push(w);
  }
  return out.length ? out : ['fj', 'jf'];
}

/**
 * Pick the next word to drop: length capped by level, and (when possible)
 * not starting with the same letter as any word already on screen, so
 * first-letter targeting stays unambiguous.
 */
function pickZapWord() {
  const maxLen = 4 + Math.floor((zap.level - 1) / 2);
  const fits = zap.bank.filter(function(w) { return w.length <= maxLen; });
  const pool = fits.length ? fits : zap.bank;
  const takenFirsts = new Set(zap.words.map(function(w) { return w.text[0]; }));
  for (let i = 0; i < 8; i++) {
    const w = pool[Math.floor(Math.random() * pool.length)];
    if (!takenFirsts.has(w[0])) return w;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ================================================================
// SOUNDS — same Web Audio synth style as app.js
// ================================================================

/** Laser sweep for a zapped word. */
function playZapSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) { /* silent fail */ }
}

/** Descending buzz when a word lands and a life is lost. */
function playLifeLostSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) { /* silent fail */ }
}

/** Quick bright arpeggio on level-up. */
function playLevelUpSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    [523, 659, 784, 1047].forEach(function(freq, i) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.15);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.15);
    });
  } catch (e) { /* silent fail */ }
}

// ================================================================
// HIGH SCORE — stored per profile in progress.games.wordzap
// ================================================================

function getZapBest(progress) {
  return (progress.games && progress.games.wordzap) ||
    { highScore: 0, highLevel: 1, plays: 0 };
}

/** Record a finished game; returns true if it's a new personal best. */
function recordZapScore(score, level) {
  const progress = loadProgress();
  if (!progress.games) progress.games = {};
  const prev = getZapBest(progress);
  const isNewBest = score > (prev.highScore || 0);
  progress.games.wordzap = {
    highScore: Math.max(prev.highScore || 0, score),
    highLevel: Math.max(prev.highLevel || 1, level),
    plays: (prev.plays || 0) + 1
  };
  saveProgress(progress);
  return isNewBest;
}

// ================================================================
// LIFECYCLE
// ================================================================

/** Entry point — called from the home-screen Game Zone tile. */
function startWordZap() {
  const progress = loadProgress();
  zap.keys = getZapKeys(progress);
  zap.bank = buildWordBank(zap.keys);
  resetZapGame();
  showView('game');
  showZapOverlay('start');
}

function resetZapGame() {
  cancelZapLoop();
  zap.words.forEach(function(w) { if (w.el) w.el.remove(); });
  zap.words = [];
  zap.target = null;
  zap.score = 0;
  zap.level = 1;
  zap.lives = 3;
  zap.zapCount = 0;
  zap.streak = 0;
  zap.spawnTimer = 0;
  zap.running = false;
  zap.paused = false;
  // clear any leftover popups/particles
  const field = document.getElementById('game-playfield');
  field.querySelectorAll('.zap-word, .zap-popup, .zap-particle, .zap-banner')
    .forEach(function(el) { el.remove(); });
  updateZapHud();
}

/** Play / Play Again / Resume button on the overlay. */
function runZapGame() {
  const overlay = document.getElementById('game-overlay');
  overlay.classList.add('hidden');
  if (zap.paused) {
    zap.paused = false;
    zap.lastTs = 0; // reseed dt on the next frame
    return;
  }
  resetZapGame();
  zap.running = true;
  zap.lastTs = 0;
  zap.spawnTimer = 400; // first word drops almost right away
  zap.rafId = requestAnimationFrame(zapTick);
}

function pauseZapGame() {
  if (!zap.running || zap.paused) return;
  zap.paused = true;
  showZapOverlay('pause');
}

/** Hard teardown — Exit button and any navigation away from the game. */
function stopZapGame() {
  cancelZapLoop();
  zap.running = false;
  zap.paused = false;
  zap.words.forEach(function(w) { if (w.el) w.el.remove(); });
  zap.words = [];
  zap.target = null;
}

function cancelZapLoop() {
  if (zap.rafId) {
    cancelAnimationFrame(zap.rafId);
    zap.rafId = null;
  }
}

function endZapGame() {
  cancelZapLoop();
  zap.running = false;
  const isNewBest = recordZapScore(zap.score, zap.level);
  if (isNewBest && zap.score > 0) playLessonCompleteSound();
  showZapOverlay('over', isNewBest);
}

// ================================================================
// GAME LOOP
// ================================================================

function zapTick(ts) {
  if (!zap.running) return;
  zap.rafId = requestAnimationFrame(zapTick);

  if (zap.paused) { zap.lastTs = 0; return; }
  if (!zap.lastTs) { zap.lastTs = ts; return; }

  // Clamp dt so a long rAF gap (tab switch) can't teleport words
  const dt = Math.min(ts - zap.lastTs, 100);
  zap.lastTs = ts;

  const field = document.getElementById('game-playfield');
  const floorY = field.clientHeight - 16; // just above the ground line

  // Spawn cadence — faster with level, capped concurrent words
  zap.spawnTimer -= dt;
  const maxOnScreen = Math.min(6, 2 + Math.floor(zap.level / 3));
  if (zap.spawnTimer <= 0 && zap.words.length < maxOnScreen) {
    spawnZapWord(field);
    zap.spawnTimer = Math.max(1100, 3000 - 220 * (zap.level - 1));
  }

  // Advance words; collect the ones that landed
  const landed = [];
  zap.words.forEach(function(w) {
    w.y += w.speed * dt / 1000;
    w.el.style.transform = 'translateY(' + w.y + 'px)';
    if (w.y + w.el.offsetHeight >= floorY) landed.push(w);
  });
  landed.forEach(loseZapLife);
}

function spawnZapWord(field) {
  const text = pickZapWord();
  const el = document.createElement('div');
  el.className = 'zap-word';
  el.textContent = text;
  field.appendChild(el);

  // Random x, clamped so the word stays fully inside the playfield
  const maxX = Math.max(0, field.clientWidth - el.offsetWidth - 8);
  const x = 4 + Math.random() * maxX;
  el.style.left = x + 'px';
  el.style.top = '0px';

  // Fall speed ramps with level, ±15% jitter per word, capped
  const base = Math.min(90, 28 + 7 * (zap.level - 1));
  const speed = base * (0.85 + Math.random() * 0.3);

  const startY = -el.offsetHeight;
  el.style.transform = 'translateY(' + startY + 'px)';
  zap.words.push({ text: text, x: x, y: startY, speed: speed, matched: 0, el: el });
}

// ================================================================
// INPUT — first-letter targeting, prefix matching
// ================================================================

function handleZapKey(e) {
  if (state.view !== 'game') return;

  // Let Cmd/Ctrl shortcuts (reload etc.) through; block everything else
  // from scrolling or triggering browser behavior (space scrolls on iPad).
  if (!e.metaKey && !e.ctrlKey) e.preventDefault();

  if (!zap.running) return;

  if (e.key === 'Escape') { pauseZapGame(); return; }
  if (zap.paused) return;

  const key = e.key.length === 1 ? e.key.toLowerCase() : null;
  if (!key || !/^[a-z]$/.test(key)) return;

  if (!zap.target) {
    // Lock onto the lowest (most dangerous) word starting with this key
    let best = null;
    zap.words.forEach(function(w) {
      if (w.text[0] === key && (!best || w.y > best.y)) best = w;
    });
    if (best) {
      zap.target = best;
      best.matched = 1;
      best.el.classList.add('zap-target');
      playCorrectSound();
      renderZapWordText(best);
      if (best.matched >= best.text.length) zapWord(best);
    } else {
      zapMiss();
    }
    return;
  }

  // A target is locked — the next letter must continue it
  const t = zap.target;
  if (t.text[t.matched] === key) {
    t.matched++;
    playCorrectSound();
    renderZapWordText(t);
    if (t.matched >= t.text.length) zapWord(t);
  } else {
    zapMiss();
  }
}

/** Wrong key: buzz + shake, streak resets — but no life lost, no progress lost. */
function zapMiss() {
  zap.streak = 0;
  playErrorSound();
  updateZapHud();
  // zap-shake animates margin (not transform) so it can't clobber the
  // word's translateY fall position.
  const el = zap.target ? zap.target.el : null;
  if (el) {
    el.classList.remove('zap-shake');
    void el.offsetWidth; // restart animation
    el.classList.add('zap-shake');
  }
}

/** Re-render a word with its matched prefix highlighted. */
function renderZapWordText(w) {
  w.el.innerHTML =
    '<span class="zap-hit">' + w.text.slice(0, w.matched) + '</span>' +
    w.text.slice(w.matched);
}

// ================================================================
// ZAP / LOSE LIFE / LEVEL UP
// ================================================================

function zapWord(w) {
  removeZapWordFromPlay(w);

  zap.zapCount++;
  zap.streak++;
  const multiplier = zap.streak >= 10 ? 3 : (zap.streak >= 5 ? 2 : 1);
  const points = ZAP_POINTS_PER_LETTER * w.text.length * multiplier;
  zap.score += points;

  playZapSound();
  spawnZapPop(w, points, multiplier);

  // Freeze the word at its current spot (the pop animation owns transform,
  // so translateY must move into `top` first), then pop + remove.
  w.el.style.top = Math.max(0, w.y) + 'px';
  w.el.style.transform = 'none';
  w.el.classList.add('zap-pop');
  setTimeout(function() { w.el.remove(); }, 350);

  updateZapHud();

  if (zap.zapCount % ZAP_WORDS_PER_LEVEL === 0) levelUpZap();
}

function loseZapLife(w) {
  removeZapWordFromPlay(w);
  w.el.style.top = Math.max(0, w.y) + 'px';
  w.el.style.transform = 'none';
  w.el.classList.add('zap-landed');
  setTimeout(function() { w.el.remove(); }, 400);

  zap.lives--;
  zap.streak = 0;
  playLifeLostSound();

  // red flash on the playfield
  const field = document.getElementById('game-playfield');
  field.classList.remove('zap-field-flash');
  void field.offsetWidth;
  field.classList.add('zap-field-flash');

  updateZapHud();
  if (zap.lives <= 0) endZapGame();
}

/** Take a word out of the active list and clear targeting on it. */
function removeZapWordFromPlay(w) {
  zap.words = zap.words.filter(function(x) { return x !== w; });
  if (zap.target === w) zap.target = null;
  w.el.classList.remove('zap-target');
}

function levelUpZap() {
  zap.level++;
  playLevelUpSound();
  updateZapHud();

  const field = document.getElementById('game-playfield');
  const banner = document.createElement('div');
  banner.className = 'zap-banner';
  banner.textContent = 'LEVEL ' + zap.level + '!';
  field.appendChild(banner);
  banner.addEventListener('animationend', function() { banner.remove(); });
}

/** Floating "+points ×N" popup + burst of particles where the word was. */
function spawnZapPop(w, points, multiplier) {
  const field = document.getElementById('game-playfield');

  const pop = document.createElement('div');
  pop.className = 'zap-popup';
  pop.textContent = '+' + points + (multiplier > 1 ? ' ×' + multiplier : '');
  pop.style.left = w.x + 'px';
  pop.style.top = Math.max(0, w.y) + 'px';
  field.appendChild(pop);
  pop.addEventListener('animationend', function() { pop.remove(); });

  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'zap-particle';
    const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.6;
    p.style.setProperty('--dx', Math.round(Math.cos(angle) * 46) + 'px');
    p.style.setProperty('--dy', Math.round(Math.sin(angle) * 46) + 'px');
    p.style.left = (w.x + w.el.offsetWidth / 2) + 'px';
    p.style.top = (Math.max(0, w.y) + w.el.offsetHeight / 2) + 'px';
    field.appendChild(p);
    p.addEventListener('animationend', function() { p.remove(); });
  }
}

// ================================================================
// HUD + OVERLAY
// ================================================================

function updateZapHud() {
  document.getElementById('game-score').textContent = zap.score;
  document.getElementById('game-level').textContent = zap.level;

  const streakEl = document.getElementById('game-streak');
  const multiplier = zap.streak >= 10 ? 3 : (zap.streak >= 5 ? 2 : 1);
  streakEl.textContent = multiplier > 1 ? '×' + multiplier : '';

  const hearts = document.querySelectorAll('#game-lives .game-heart');
  hearts.forEach(function(h, i) {
    h.classList.toggle('lost', i >= zap.lives);
  });

  const best = getZapBest(loadProgress());
  document.getElementById('game-best').textContent = best.highScore || 0;
}

/**
 * One overlay, three states: 'start' (before a game), 'pause', and
 * 'over' (game over, with score + new-best banner).
 */
function showZapOverlay(mode, isNewBest) {
  const overlay = document.getElementById('game-overlay');
  const title = document.getElementById('game-overlay-title');
  const body = document.getElementById('game-overlay-body');
  const startBtn = document.getElementById('btn-game-start');

  if (mode === 'start') {
    title.textContent = '⚡ Word Zap';
    const keyTiles = zap.keys.map(function(k) {
      const fingerClass = (window.FINGER_MAP && FINGER_MAP[k]) || 'finger-space';
      return '<div class="intro-key-tile intro-key-tile--' +
        fingerClass.replace('finger-', '') + '">' + k.toUpperCase() + '</div>';
    }).join('');
    body.innerHTML =
      '<p>Type the falling words to zap them before they hit the ground!<br>' +
      'Miss 3 words and the game is over.</p>' +
      '<div class="game-keys-label">Your keys so far:</div>' +
      '<div class="game-keys-row">' + keyTiles + '</div>' +
      '<p class="game-hint">Finish more lessons to unlock more letters and words!</p>';
    startBtn.textContent = 'Play! →';
  } else if (mode === 'pause') {
    title.textContent = '⏸ Paused';
    body.innerHTML = '<p>Take a breath. Your words are frozen in the sky.</p>';
    startBtn.textContent = 'Resume →';
  } else {
    title.textContent = 'Game Over!';
    const best = getZapBest(loadProgress());
    body.innerHTML =
      (isNewBest && zap.score > 0
        ? '<div class="game-newbest">🏆 NEW HIGH SCORE! 🏆</div>' : '') +
      '<div class="game-final-score">' + zap.score + '</div>' +
      '<p>You reached level ' + zap.level + ' and zapped ' +
      zap.zapCount + ' word' + (zap.zapCount === 1 ? '' : 's') + '.<br>' +
      'Best score: ' + (best.highScore || 0) + '</p>';
    startBtn.textContent = 'Play Again →';
  }

  overlay.classList.remove('hidden');
}

// ================================================================
// WIRING — buttons + auto-pause (scripts load at end of body, DOM is ready)
// ================================================================

document.getElementById('btn-game-start').addEventListener('click', runZapGame);

document.getElementById('btn-game-pause').addEventListener('click', pauseZapGame);

document.getElementById('btn-game-exit').addEventListener('click', function() {
  stopZapGame();
  renderHome();
});

document.getElementById('btn-game-home').addEventListener('click', function() {
  stopZapGame();
  renderHome();
});

window.addEventListener('keydown', handleZapKey, { passive: false });

// iPad home button / app switch: freeze the game instead of losing lives
document.addEventListener('visibilitychange', function() {
  if (document.hidden && state.view === 'game' && zap.running && !zap.paused) {
    pauseZapGame();
  }
});
