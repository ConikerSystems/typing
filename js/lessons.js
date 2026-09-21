/**
 * KeyQuest — Lesson Data
 *
 * All 32 lessons across 4 levels.
 * Each lesson has:
 *   id         - unique number 1-32
 *   level      - 1 (Beginner), 2 (Building Up), 3 (Full Keyboard), 4 (Numbers & Capitals)
 *   title      - display name
 *   keys       - array of keys taught up to this lesson (cumulative)
 *   targetWPM  - WPM required for 3-star rating
 *   tip        - short tip shown on the lesson intro screen
 *   exercises  - array of exercise strings (3-4 per lesson, 40-80 chars each)
 */

const LESSONS = [

  // ============================================================
  // LEVEL 1 — Beginner: Home Row
  // ============================================================

  {
    id: 1,
    level: 1,
    title: 'F and J — Home Position',
    keys: ['f', 'j'],
    targetWPM: 8,
    tip: 'Rest your left index on F and right index on J. Feel the raised bumps — those are your anchors!',
    exercises: [
      'fj fj fj fj ff jj ff jj fj jf fj jf',
      'fjfj jfjf ffff jjjj fj jf fjfj jfjf',
      'fj fj fj fj ff jj fj jf fj jf fj jf fj',
      'fjfjfj jfjfjf fff jjj fj jf fjfj fjfj jfjf'
    ]
  },

  {
    id: 2,
    level: 1,
    title: 'D and K — Reach Out',
    keys: ['f', 'j', 'd', 'k'],
    targetWPM: 9,
    tip: 'D and K are one step away from home. Let your middle fingers reach out naturally, then return.',
    exercises: [
      'dk dk fd jk dk fd kj fd dk dk fd jk',
      'fdjk kjdf dkfj fjdk fdkj jkfd dfkj',
      'ddd kkk ddk kkd fdjk kjdf fjdk dkfj',
      'fd jk dk fj fd jk dk fj fdkj jkdf dkfj'
    ]
  },

  {
    id: 3,
    level: 1,
    title: 'S and L — Keep Going',
    keys: ['f', 'j', 'd', 'k', 's', 'l'],
    targetWPM: 10,
    tip: 'S is your left ring finger, L is your right ring finger. Keep your index fingers anchored on F and J.',
    exercises: [
      'sl sl sl ls ls sl sl ls ss ll sl ls sl',
      'sd lk sf lj ds kl fs jl sdlk klsd fslj',
      'sss lll ssl lls sld lsd fsd jsl skld',
      'sl sk sf sj dl dk df dj fl fk fs fj jl'
    ]
  },

  {
    id: 4,
    level: 1,
    title: 'A and ; — Full Home Row',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';'],
    targetWPM: 10,
    tip: 'A and ; are your pinky fingers — the last two home row keys. Now you know the whole home row!',
    exercises: [
      'a; a; ;a ;a aa ;; a; ;a asdf jkl; asdf',
      'asdf jkl; fdsa ;lkj asdf jkl; asdfjkl;',
      'aaa ;;; as l; ad lk af lj sd kl sf kj',
      'asdf jkl; asdf jkl; fdsa ;lkj asdf jkl;'
    ]
  },

  {
    id: 5,
    level: 1,
    title: 'Home Row Words',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';'],
    targetWPM: 12,
    tip: 'Real words now! Keep your fingers on the home row — every letter in these words lives right there.',
    exercises: [
      'sad ask all fall adds flask lads lass',
      'dad fad salad lass ask falls asks dads',
      'all sad fads flask flasks salads lads',
      'asks dads falls flask salad fads lass dad'
    ]
  },

  {
    id: 6,
    level: 1,
    title: 'More Home Row Words',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';'],
    targetWPM: 13,
    tip: 'More home row words! Focus on accuracy first — speed will come naturally with practice.',
    exercises: [
      'alfalfa lads fall flask salad asks dads',
      'flasks salads dads falls lass all alfalfa',
      'salad lads ask falls sad flask alfalfa dads',
      'salad lass flask adds falls dads asks alfalfa'
    ]
  },

  {
    id: 7,
    level: 1,
    title: 'Home Row Sentences',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';'],
    targetWPM: 13,
    tip: 'Short sentences using only home row keys. Read ahead one or two words so your fingers are ready!',
    exercises: [
      'a sad lad falls as dad asks',
      'dad asks a lass flask sad falls',
      'all lads ask dad flask salads fads',
      'flask salad falls sad dads lass all asks'
    ]
  },

  {
    id: 8,
    level: 1,
    title: 'Home Row Speed Drill',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';'],
    targetWPM: 15,
    tip: 'Push your speed on these home row drills! You know all these keys — let your muscle memory take over.',
    exercises: [
      'sad lad dad flask salad asks all falls lass',
      'all asks dads falls flasks salads fads lads',
      'sad dad flask adds lads lass ask falls salad',
      'dad asks all lads flask salads falls fads lass'
    ]
  },

  // ============================================================
  // LEVEL 2 — Building Up: Adding More Keys
  // ============================================================

  {
    id: 9,
    level: 2,
    title: 'E and I — First Reach Up',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i'],
    targetWPM: 14,
    tip: 'Reach up with your left middle finger for E, and your right middle finger for I. Return to home after each reach.',
    exercises: [
      'ded kik ede iki see ski idea elk aide',
      'else like isle idle said silk side desk',
      'idea silk else like isle aide desk said',
      'else said idea silk like isle idle aids desk'
    ]
  },

  {
    id: 10,
    level: 2,
    title: 'R and U — Index Stretch',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u'],
    targetWPM: 15,
    tip: 'R is your left index reaching up-right, U is your right index reaching up-left. Both are index fingers!',
    exercises: [
      'red fur rule ruse user sure ride fire',
      'ride rude used sure rule fire sale real',
      'rules fired users rides rude sale sure fuel',
      'sure fuel rise ruse fire ride real rules used'
    ]
  },

  {
    id: 11,
    level: 2,
    title: 'T and Y — Center Keys',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y'],
    targetWPM: 15,
    tip: 'T and Y sit in the center of the keyboard. Left index reaches to T, right index reaches to Y.',
    exercises: [
      'try yet tidy stay tree year rely style',
      'daily taste style dusty year try yet truly',
      'stay daily tasty style try year truly dirty',
      'style truly stay dusty tasty trees daily year trusty'
    ]
  },

  {
    id: 12,
    level: 2,
    title: 'W and O — Ring Fingers Up',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y', 'w', 'o'],
    targetWPM: 16,
    tip: 'W is your left ring finger reaching up, O is your right ring finger. Think of them as partners!',
    exercises: [
      'two row owl word work slow tower flow',
      'world tower lower words write story flow',
      'write story tower world lower words slow flow',
      'tower world write story flow lower words two owl'
    ]
  },

  {
    id: 13,
    level: 2,
    title: 'Q and P — Pinky Reach',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y', 'w', 'o', 'q', 'p'],
    targetWPM: 16,
    tip: 'Q and P are pinky keys at the top corners. Stretch carefully — your pinky is the weakest finger, so be precise.',
    exercises: [
      'quite pretty pout quiet pop poetry quest',
      'pretty quality quiet poetry quest people pout',
      'quite pretty quiet quest poetry people quality',
      'quality pretty quiet quest poetry people quite pout'
    ]
  },

  {
    id: 14,
    level: 2,
    title: 'Top Row Review',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y', 'w', 'o', 'q', 'p'],
    targetWPM: 17,
    tip: 'Review all the top row keys you have learned so far. Take your time and keep your home row anchored.',
    exercises: [
      'quite pretty try tower world write story',
      'poetry quest type quite pretty world tower',
      'write tower world story type quite poetry',
      'quite pretty tower world write story poetry quest type'
    ]
  },

  {
    id: 15,
    level: 2,
    title: 'V and M — Reach Down',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y', 'w', 'o', 'q', 'p', 'v', 'm'],
    targetWPM: 17,
    tip: 'V is your left index reaching down, M is your right index reaching down. Keep your wrists steady!',
    exercises: [
      'move very marvel visit vim every vivid',
      'every move marvel vivid very visit most',
      'moves marvel vivid every very visit most',
      'vivid moves every marvel very visit most move'
    ]
  },

  {
    id: 16,
    level: 2,
    title: 'C and Comma — Middle Down',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y', 'w', 'o', 'q', 'p', 'v', 'm', 'c', ','],
    targetWPM: 18,
    tip: 'C is left middle finger reaching down, comma is right middle finger reaching down. Nice and symmetrical!',
    exercises: [
      'come cool ice, cool voice come, cover mice',
      'cool come, rice voice mice, cover cream come',
      'come, cool voice mice cream cover cool rice',
      'cool, come mice voice, cream cover cool rice, come'
    ]
  },

  // ============================================================
  // LEVEL 3 — Full Keyboard
  // ============================================================

  {
    id: 17,
    level: 3,
    title: 'X and Period — Ring Finger Down',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y', 'w', 'o', 'q', 'p', 'v', 'm', 'c', ',', 'x', '.'],
    targetWPM: 18,
    tip: 'X is left ring finger down, period is right ring finger down. The period ends sentences — use it confidently!',
    exercises: [
      'mix fox extra, text exist. vex exactly six.',
      'exit exact. mix fox extra text, exist extra.',
      'exactly. fox mix extra exit, vex text extra.',
      'fox, exit exact text. mix extra vex exactly exist.'
    ]
  },

  {
    id: 18,
    level: 3,
    title: 'Z and Slash — Pinky Down',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y', 'w', 'o', 'q', 'p', 'v', 'm', 'c', ',', 'x', '.', 'z', '/'],
    targetWPM: 19,
    tip: 'Z is the bottom-left pinky key and slash is the bottom-right. These are rare but important keys!',
    exercises: [
      'zip zero zoom fizz quiz, size/style, maze',
      'fuzzy/cozy zero size quiz zoom zip maze.',
      'zero zip maze, zoom quiz size. fuzzy cozy/',
      'zip size, maze zoom. zero quiz cozy fuzzy/style'
    ]
  },

  {
    id: 19,
    level: 3,
    title: 'B and N — Index Down',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y', 'w', 'o', 'q', 'p', 'v', 'm', 'c', ',', 'x', '.', 'z', '/', 'b', 'n'],
    targetWPM: 19,
    tip: 'B is left index reaching down-right, N is right index reaching down-left. Both index fingers again!',
    exercises: [
      'bone brain blend born new. bronze noble',
      'born noble brain, next bonnet blind bone.',
      'binder noble blend. born brain, bronze next.',
      'born next brain, noble blend. bone bronze banner'
    ]
  },

  {
    id: 20,
    level: 3,
    title: 'G and H — Center Index',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a', ';', 'e', 'i', 'r', 'u', 't', 'y', 'w', 'o', 'q', 'p', 'v', 'm', 'c', ',', 'x', '.', 'z', '/', 'b', 'n', 'g', 'h'],
    targetWPM: 20,
    tip: 'G and H sit just beside your index fingers on the home row. A short reach inward — now you have the full alphabet!',
    exercises: [
      'ghost bright laugh huge gorge height right',
      'bright huge ghost gorge laugh right height',
      'ghost height, bright huge gorge. laugh right',
      'ghost bright huge laugh, gorge height. right bright'
    ]
  },

  {
    id: 21,
    level: 3,
    title: 'Full Alphabet Practice',
    keys: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',',','.','/',';'],
    targetWPM: 20,
    tip: 'You know every letter! These classic pangrams use every letter of the alphabet. Show off your full keyboard skills.',
    exercises: [
      'the quick brown fox jumps over the lazy dog.',
      'pack my box with five dozen liquor jugs.',
      'bright vixens jump, dozy fowl quack, zigzag.',
      'the five boxing wizards jump quickly over fences.'
    ]
  },

  {
    id: 22,
    level: 3,
    title: 'Everyday Words',
    keys: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',',','.','/',';',' '],
    targetWPM: 22,
    tip: 'Common everyday words with commas and periods. These are the building blocks of all writing!',
    exercises: [
      'time, year, people, way, day, man, woman, child.',
      'world, life, hand, part, place, week, case, point.',
      'group, number, night, water, room, word, fact, side.',
      'home, work, school, game, team, play, time, year, day.'
    ]
  },

  {
    id: 23,
    level: 3,
    title: 'Fun Sentences',
    keys: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',',','.','/',';',' '],
    targetWPM: 23,
    tip: 'Fun facts about the world! Read each sentence before you type it so you understand the words.',
    exercises: [
      'astronauts float in space and see the whole earth.',
      'dolphins can talk to each other using sounds.',
      'the fastest land animal is the cheetah, not the lion.',
      'video games teach quick thinking and problem solving skills.'
    ]
  },

  {
    id: 24,
    level: 3,
    title: 'Speed Challenge',
    keys: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',',','.','/',';',' '],
    targetWPM: 25,
    tip: 'Final speed challenge! Push yourself — you have mastered every key. Type with rhythm and confidence!',
    exercises: [
      'robots may one day help surgeons fix broken hearts.',
      'sharks have been swimming the oceans for millions of years.',
      'the sun is so huge, a million earths could fit inside it.',
      'scientists found water on mars, which means life might exist.'
    ]
  },

  // ============================================================
  // LEVEL 4 — Numbers & Capitals
  // ============================================================

  {
    id: 25,
    level: 4,
    title: 'Numbers 1 through 5',
    keys: ['1','2','3','4','5','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',';',',','.','/'],
    targetWPM: 16,
    tip: 'Keep your fingers on the home row and stretch your LEFT hand up to reach numbers 1 through 5. Left pinky gets 1, left ring gets 2, and so on.',
    exercises: [
      '1 2 3 4 5 11 22 33 44 55 12 34 51 23 45',
      '123 234 345 451 512 135 245 1234 5432 2315',
      '12345 54321 13524 24531 51423 12 34 51 23 45',
      '1 fish 2 fish 3 cats 4 dogs 5 birds on 1 tree'
    ]
  },

  {
    id: 26,
    level: 4,
    title: 'Numbers 6 through 0',
    keys: ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',';',',','.','/'],
    targetWPM: 16,
    tip: 'Now stretch your RIGHT hand up for 6 through 0. Right index covers 6 and 7, right middle gets 8, right ring gets 9, and right pinky handles 0.',
    exercises: [
      '6 7 8 9 0 66 77 88 99 00 67 89 70 98 60',
      '678 789 890 907 670 869 6789 9870 8076',
      '67890 09876 78906 89067 98760 6789 0987',
      '6 players score 7 goals in 8 minutes for 9th place at 0 cost'
    ]
  },

  {
    id: 27,
    level: 4,
    title: 'Numbers Review',
    keys: ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',';',',','.','/'],
    targetWPM: 18,
    tip: 'All 10 digits mixed with real words. Numbers appear everywhere in writing — get comfortable switching between letters and numbers!',
    exercises: [
      '1234567890 0987654321 1357 2468 9081 7263',
      'there are 365 days in a year and 24 hours in a day',
      'the score was 7 to 3 and the team had 11 players on the field',
      'call 555 1234 or visit room 42 on floor 3 before 5 today'
    ]
  },

  {
    id: 28,
    level: 4,
    title: 'Capital Letters — Sentence Starts',
    keys: ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',';',',','.','/'],
    targetWPM: 18,
    tip: 'Every sentence starts with a capital letter. Hold Shift with the OPPOSITE hand from the letter — so for "T", hold Right Shift with your right pinky.',
    exercises: [
      'The cat sat. The dog ran. The sun is hot.',
      'Sam saw a frog. Dan had a flag. Fred fell fast.',
      'All cats like fish. Dogs like to run and play.',
      'The fast cat ran. A glad dad asked. She fell.'
    ]
  },

  {
    id: 29,
    level: 4,
    title: 'Capital Letters — Names',
    keys: ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',';',',','.','/'],
    targetWPM: 19,
    tip: 'Names of people and places always start with a capital. Think of each capital as a small pause — hold Shift, press the letter, release both.',
    exercises: [
      'Jack and Jill ran up a hill to get some water.',
      'Tom and Mary live in Texas near the Gulf of Mexico.',
      'Mike, Sue, and Jake went to the park on Sunday.',
      'Sara likes cats. Ben likes dogs. Kim likes both fish and birds.'
    ]
  },

  {
    id: 30,
    level: 4,
    title: 'Mixed Capitals',
    keys: ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',';',',','.','/'],
    targetWPM: 20,
    tip: 'A mix of sentence capitals and proper nouns. Scan ahead for capital letters so your shift hand is ready before you need it!',
    exercises: [
      'Every day I practice typing for thirty minutes after school.',
      'On Monday the class starts at nine in the morning at Oak School.',
      'My friend Jake scored ten goals in the big soccer game on Friday.',
      'The Amazon River flows through Brazil and is one of the longest rivers.'
    ]
  },

  {
    id: 31,
    level: 4,
    title: 'Numbers and Capitals Together',
    keys: ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',';',',','.','/'],
    targetWPM: 22,
    tip: 'Numbers, capitals, and full sentences together — just like real writing! Stay relaxed and let your eyes read ahead.',
    exercises: [
      'In 2024 about 8 billion people live on planet Earth.',
      'Jupiter has 95 moons and is about 11 times larger than Earth.',
      'A cheetah can run 70 miles per hour for about 30 seconds.',
      'The Great Wall of China is over 13000 miles long and took 1000 years to build.'
    ]
  },

  {
    id: 32,
    level: 4,
    title: 'Grand Speed Challenge',
    keys: ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',';',',','.','/'],
    targetWPM: 28,
    tip: 'The ultimate challenge — numbers, capitals, and amazing facts! You have come so far. Type with confidence and show everyone what you can do!',
    exercises: [
      'By age 11 most kids can type around 20 words per minute with practice.',
      'In 1969 Neil Armstrong became the first person to walk on the Moon.',
      'Scientists believe the universe is about 13 billion years old and still growing.',
      'The fastest supercomputers can do over 1 quadrillion calculations every single second.'
    ]
  }

];

/**
 * Level metadata — used for rendering the home screen sections.
 */
const LEVELS = [
  {
    id: 1,
    title: 'Beginner',
    subtitle: 'Home Row Keys',
    lessonRange: [1, 8]
  },
  {
    id: 2,
    title: 'Building Up',
    subtitle: 'Adding More Keys',
    lessonRange: [9, 16]
  },
  {
    id: 3,
    title: 'Full Keyboard',
    subtitle: 'All Keys',
    lessonRange: [17, 24]
  },
  {
    id: 4,
    title: 'Numbers & Capitals',
    subtitle: 'Complete Typing',
    lessonRange: [25, 32]
  }
];

/**
 * Get a lesson by its ID.
 * @param {number} id
 * @returns {object|undefined}
 */
function getLessonById(id) {
  return LESSONS.find(l => l.id === id);
}

/**
 * Get all lessons for a given level.
 * @param {number} levelId
 * @returns {object[]}
 */
function getLessonsForLevel(levelId) {
  return LESSONS.filter(l => l.level === levelId);
}

/**
 * Get the level object for a given lesson id.
 * @param {number} lessonId
 * @returns {object|undefined}
 */
function getLevelForLesson(lessonId) {
  return LEVELS.find(lv => lessonId >= lv.lessonRange[0] && lessonId <= lv.lessonRange[1]);
}

// ================================================================
// EXAMS — modular tests, one per level + a final exam.
//
// Each exam is a single continuous passage (one timer, one score).
// Two ways to pass (chosen by the learner before starting):
//   • Accuracy Test     → accuracy >= EXAM_ACCURACY_ONLY_PASS (speed ignored)
//   • Speed + Accuracy   → accuracy >= passAccuracy AND wpm >= targetWPM
// targetWPM rises across modules so speed expectations progress.
// Passages only use keys taught up to and including that level.
// ================================================================

const EXAM_ACCURACY_ONLY_PASS = 95;

const EXAMS = [
  {
    id: 'L1',
    level: 1,
    title: 'Level 1 Test',
    subtitle: 'Home Row',
    targetWPM: 10,
    passAccuracy: 90,
    intro: 'Show what you learned on the home row. Keep your fingers on F and J — no peeking at the keyboard!',
    text: 'a sad lad asks dad; all lads fall fast; dad adds a salad; flasks fall off; a lass asks all dads; sad lads ask a glad dad.'
  },
  {
    id: 'L2',
    level: 2,
    title: 'Level 2 Test',
    subtitle: 'Top Row',
    targetWPM: 14,
    passAccuracy: 90,
    intro: 'Time to test the top row keys you added. Type the words you know without looking down.',
    text: 'you type quietly as your ideas pour out; we write true poetry; try a tidy ruler; pour out water; edit your paper; their party was a quiet treat.'
  },
  {
    id: 'L3',
    level: 3,
    title: 'Level 3 Test',
    subtitle: 'Full Keyboard',
    targetWPM: 18,
    passAccuracy: 90,
    intro: 'You know every letter now. Type these full sentences with capitals off — just lowercase letters and punctuation.',
    text: 'the clever brown fox jumped over a lazy dog. six quick zebras grazed near the big quiet pond, while the happy jaguar watched them from a shady rock.'
  },
  {
    id: 'L4',
    level: 4,
    title: 'Level 4 Test',
    subtitle: 'Numbers & Capitals',
    targetWPM: 22,
    passAccuracy: 90,
    intro: 'The full test — capital letters, numbers, and punctuation, just like real writing.',
    text: 'On June 7, 2026, the Tigers scored 21 points in 4 quarters. My friend Max ran 3 miles in 25 minutes at Oak Park. We left at 6:30 and got home by 8.'
  },
  {
    id: 'FINAL',
    level: null,
    isFinal: true,
    title: 'Final Exam',
    subtitle: 'Type a Page',
    targetWPM: 20,
    passAccuracy: 92,
    intro: 'This is it — a full page of real writing with letters, capitals, and numbers. Pass this and you are a certified typist!',
    text: 'Learning to type well is a skill you will use for the rest of your life. When you can type without looking at your hands, you can write your ideas almost as fast as you think them. Practice for 10 minutes a day, keep your fingers resting on the home row, and watch your speed climb week after week. You have worked hard to get here, and now you can truly type. Great job!'
  }
];

/** Get an exam by its id ('L1'..'L4', 'FINAL'). */
function getExamById(id) {
  return EXAMS.find(e => e.id === id);
}

/** Get the module exam for a given level number (1-4), or undefined. */
function getExamForLevel(levelId) {
  return EXAMS.find(e => e.level === levelId && !e.isFinal);
}

/** The final exam object. */
function getFinalExam() {
  return EXAMS.find(e => e.isFinal);
}
