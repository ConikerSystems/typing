/**
 * KeyQuest — Visual Keyboard Component
 *
 * Renders a full QWERTY keyboard with finger color coding.
 * Exports: renderKeyboard(), highlightKey(), flashKeyCorrect(), clearHighlights()
 */

// ---------------------------------------------------------------
// Finger color map — each key maps to a CSS class name
// ---------------------------------------------------------------
const FINGER_MAP = {
  // Left pinky — purple
  '`': 'finger-l-pinky', '1': 'finger-l-pinky',
  'q': 'finger-l-pinky', 'a': 'finger-l-pinky', 'z': 'finger-l-pinky',

  // Left ring — blue
  '2': 'finger-l-ring',
  'w': 'finger-l-ring', 's': 'finger-l-ring', 'x': 'finger-l-ring',

  // Left middle — teal
  '3': 'finger-l-mid',
  'e': 'finger-l-mid', 'd': 'finger-l-mid', 'c': 'finger-l-mid',

  // Left index — green
  '4': 'finger-l-idx', '5': 'finger-l-idx',
  'r': 'finger-l-idx', 't': 'finger-l-idx',
  'f': 'finger-l-idx', 'g': 'finger-l-idx',
  'v': 'finger-l-idx', 'b': 'finger-l-idx',

  // Right index — yellow
  '6': 'finger-r-idx', '7': 'finger-r-idx',
  'y': 'finger-r-idx', 'u': 'finger-r-idx',
  'h': 'finger-r-idx', 'j': 'finger-r-idx',
  'n': 'finger-r-idx', 'm': 'finger-r-idx',

  // Right middle — orange
  '8': 'finger-r-mid',
  'i': 'finger-r-mid', 'k': 'finger-r-mid', ',': 'finger-r-mid',

  // Right ring — red
  '9': 'finger-r-ring',
  'o': 'finger-r-ring', 'l': 'finger-r-ring', '.': 'finger-r-ring',

  // Right pinky — pink
  '0': 'finger-r-pinky', '-': 'finger-r-pinky', '=': 'finger-r-pinky',
  'p': 'finger-r-pinky', '[': 'finger-r-pinky', ']': 'finger-r-pinky',
  ';': 'finger-r-pinky', "'": 'finger-r-pinky', '/': 'finger-r-pinky',

  // Space — gray
  ' ': 'finger-space',

  // Shifted punctuation — same finger as the unshifted key it shares.
  // Exam passages use ':' (as in "6:30") and '!', and getFingerName() returns
  // '' for anything missing here, which would blank the finger hint.
  '!': 'finger-l-pinky',   // Shift + 1
  '@': 'finger-l-ring',    // Shift + 2
  '#': 'finger-l-mid',     // Shift + 3
  '$': 'finger-l-idx',     // Shift + 4
  '%': 'finger-l-idx',     // Shift + 5
  '^': 'finger-r-idx',     // Shift + 6
  '&': 'finger-r-idx',     // Shift + 7
  '*': 'finger-r-mid',     // Shift + 8
  '(': 'finger-r-ring',    // Shift + 9
  ')': 'finger-r-pinky',   // Shift + 0
  ':': 'finger-r-pinky',   // Shift + ;
  '"': 'finger-r-pinky',   // Shift + '
  '?': 'finger-r-pinky',   // Shift + /
};

// ---------------------------------------------------------------
// Readable finger names — used for the live "Use your ___ finger" hint
// and the on-screen legend. Keyed by the finger CSS class.
// ---------------------------------------------------------------
const FINGER_NAMES = {
  'finger-l-pinky': 'left pinky',
  'finger-l-ring':  'left ring finger',
  'finger-l-mid':   'left middle finger',
  'finger-l-idx':   'left index finger',
  'finger-r-idx':   'right index finger',
  'finger-r-mid':   'right middle finger',
  'finger-r-ring':  'right ring finger',
  'finger-r-pinky': 'right pinky',
  'finger-space':   'thumb'
};

// Short labels for the compact legend row
const FINGER_LEGEND = [
  ['finger-l-pinky', 'L pinky'],
  ['finger-l-ring',  'L ring'],
  ['finger-l-mid',   'L middle'],
  ['finger-l-idx',   'L index'],
  ['finger-r-idx',   'R index'],
  ['finger-r-mid',   'R middle'],
  ['finger-r-ring',  'R ring'],
  ['finger-r-pinky', 'R pinky'],
  ['finger-space',   'Thumbs']
];

// ---------------------------------------------------------------
// getFingerName(char)
// Returns a friendly description of which finger types `char`,
// e.g. "left index finger". Adds "+ Shift" for capital letters.
// ---------------------------------------------------------------
function getFingerName(char) {
  if (!char) return '';
  if (char === ' ') return 'thumb';
  const lower = char.toLowerCase();
  const fingerClass = FINGER_MAP[lower];
  if (!fingerClass) return '';
  let name = FINGER_NAMES[fingerClass] || '';
  if (char >= 'A' && char <= 'Z') {
    name += ' + Shift';
  }
  return name;
}

// ---------------------------------------------------------------
// RIGHT_HAND_KEYS — keys typed by the right hand.
// When these are uppercase, the LEFT Shift key is used.
// All other letter/symbol keys use RIGHT Shift.
// ---------------------------------------------------------------
const RIGHT_HAND_KEYS = new Set([
  'y', 'u', 'i', 'o', 'p',
  'h', 'j', 'k', 'l', ';',
  'n', 'm', ',', '.', '/',
  '6', '7', '8', '9', '0'
]);

// ---------------------------------------------------------------
// Keyboard layout — rows of [displayLabel, dataKey] pairs
// For keys where the data-key differs from what's displayed,
// we separate them. Shift/modifier keys have no data-key.
// ---------------------------------------------------------------
const KEY_ROWS = [
  // Number row
  [
    ['`', '`'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'],
    ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'],
    ['0', '0'], ['-', '-'], ['=', '='], ['⌫', 'backspace']
  ],
  // Top letter row
  [
    ['tab', 'tab'],
    ['Q', 'q'], ['W', 'w'], ['E', 'e'], ['R', 'r'], ['T', 't'],
    ['Y', 'y'], ['U', 'u'], ['I', 'i'], ['O', 'o'], ['P', 'p'],
    ['[', '['], [']', ']'], ['\\', '\\']
  ],
  // Home row
  [
    ['caps', 'caps'],
    ['A', 'a'], ['S', 's'], ['D', 'd'], ['F', 'f'], ['G', 'g'],
    ['H', 'h'], ['J', 'j'], ['K', 'k'], ['L', 'l'], [';', ';'],
    ["'", "'"], ['↵', 'enter']
  ],
  // Bottom row
  [
    ['⇧', 'shift-l'],
    ['Z', 'z'], ['X', 'x'], ['C', 'c'], ['V', 'v'], ['B', 'b'],
    ['N', 'n'], ['M', 'm'], [',', ','], ['.', '.'], ['/', '/'],
    ['⇧', 'shift-r']
  ],
  // Space row
  [
    ['ctrl', 'ctrl'], ['alt', 'alt'],
    ['space', ' '],
    ['alt', 'alt'], ['ctrl', 'ctrl']
  ]
];

// Special wide keys (CSS class appended)
const WIDE_KEYS = new Set([
  'backspace', 'tab', 'caps', 'enter', 'shift-l', 'shift-r',
  'ctrl', 'alt', ' '
]);

// Support-only keys (not finger colored)
const SUPPORT_KEYS = new Set([
  'backspace', 'tab', 'caps', 'enter', 'shift-l', 'shift-r',
  'ctrl', 'alt'
]);

// ---------------------------------------------------------------
// Internal reference to key elements: dataKey → DOM element
// ---------------------------------------------------------------
let keyElements = {};

// ---------------------------------------------------------------
// renderKeyboard(containerEl)
// Builds the keyboard HTML and appends it to containerEl.
// ---------------------------------------------------------------
function renderKeyboard(containerEl) {
  keyElements = {};
  containerEl.innerHTML = '';

  const kbd = document.createElement('div');
  kbd.className = 'keyboard';

  KEY_ROWS.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'key-row';

    row.forEach(([label, dataKey]) => {
      const keyEl = document.createElement('div');
      keyEl.className = 'key';
      keyEl.setAttribute('data-key', dataKey);
      keyEl.textContent = label;

      // Wide key class
      if (WIDE_KEYS.has(dataKey)) {
        keyEl.classList.add('key-wide');
        keyEl.classList.add('key-wide-' + dataKey.replace(' ', 'space'));
      }

      // Finger color class (only for typeable keys)
      if (!SUPPORT_KEYS.has(dataKey)) {
        const fingerClass = FINGER_MAP[dataKey];
        if (fingerClass) {
          keyEl.classList.add(fingerClass);
        }
      } else {
        keyEl.classList.add('key-support');
      }

      // Store reference for fast access
      keyElements[dataKey] = keyEl;

      rowEl.appendChild(keyEl);
    });

    kbd.appendChild(rowEl);
  });

  containerEl.appendChild(kbd);
}

// ---------------------------------------------------------------
// _getShiftKeyForChar(char)
// Returns the shift key data-key to highlight for an uppercase char.
// Right-hand keys → highlight Left Shift ('shift-l')
// Left-hand keys  → highlight Right Shift ('shift-r')
// ---------------------------------------------------------------
function _getShiftKeyForChar(char) {
  const lower = char.toLowerCase();
  return RIGHT_HAND_KEYS.has(lower) ? 'shift-l' : 'shift-r';
}

// ---------------------------------------------------------------
// highlightKey(char)
// Highlights the key for the given character — gold, scaled up.
// For uppercase letters, also highlights the correct Shift key.
// ---------------------------------------------------------------
function highlightKey(char) {
  clearHighlights();
  updateFingerHint(char);

  if (char === ' ') {
    const el = keyElements[' '];
    if (el) el.classList.add('key-active');
    return;
  }

  const isUpper = char >= 'A' && char <= 'Z';
  const key = char.toLowerCase();
  const el = keyElements[key];
  if (el) {
    el.classList.add('key-active');
  }

  if (isUpper) {
    const shiftKey = _getShiftKeyForChar(char);
    const shiftEl = keyElements[shiftKey];
    if (shiftEl) {
      shiftEl.classList.add('key-active');
    }
  }
}

// ---------------------------------------------------------------
// flashKeyCorrect(char)
// Briefly flashes the key green to confirm a correct keystroke.
// For uppercase letters, also flashes the correct Shift key.
// ---------------------------------------------------------------
function flashKeyCorrect(char) {
  const key = char === ' ' ? ' ' : char.toLowerCase();
  const el = keyElements[key];
  if (el) {
    el.classList.add('key-correct-flash');
    setTimeout(() => {
      el.classList.remove('key-correct-flash');
    }, 300);
  }

  const isUpper = char >= 'A' && char <= 'Z';
  if (isUpper) {
    const shiftKey = _getShiftKeyForChar(char);
    const shiftEl = keyElements[shiftKey];
    if (shiftEl) {
      shiftEl.classList.add('key-correct-flash');
      setTimeout(() => {
        shiftEl.classList.remove('key-correct-flash');
      }, 300);
    }
  }
}

// ---------------------------------------------------------------
// clearHighlights()
// Removes all highlight classes from all keys.
// ---------------------------------------------------------------
function clearHighlights() {
  Object.values(keyElements).forEach((el) => {
    el.classList.remove('key-active');
  });
}

// ---------------------------------------------------------------
// updateFingerHint(char)
// Updates the "Use your ___ finger" coaching line for the next key.
// ---------------------------------------------------------------
function updateFingerHint(char) {
  const hintEl = document.getElementById('finger-hint');
  if (!hintEl) return;
  const name = getFingerName(char);
  if (char === ' ') {
    hintEl.innerHTML = 'Press <strong>Space</strong> with your <strong>thumb</strong>';
  } else if (name) {
    hintEl.innerHTML = 'Use your <strong>' + name + '</strong>';
  } else {
    hintEl.innerHTML = '';
  }
}

// ---------------------------------------------------------------
// renderFingerLegend(containerEl)
// Builds the compact finger-color legend so learners know what
// each keyboard color means (green = left index, etc.).
// ---------------------------------------------------------------
function renderFingerLegend(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  FINGER_LEGEND.forEach(([fingerClass, label]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const dot = document.createElement('span');
    dot.className = 'legend-dot ' + fingerClass;
    const txt = document.createElement('span');
    txt.className = 'legend-label';
    txt.textContent = label;
    item.appendChild(dot);
    item.appendChild(txt);
    containerEl.appendChild(item);
  });
}
