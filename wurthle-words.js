// Würthle word lists, daily answer selection and guess scoring.
// The repo is public, so the daily order is a secret-keyed shuffle:
// knowing this file is not enough to work out future answers.

const crypto = require("crypto");
const { SECRET } = require("./tokens");

const ANSWERS = [
  "HOUSE","PLANT","BRAIN","SHARE","LIGHT","WATER","SMILE","STONE","PRIDE","GRADE",
  "DRILL","BRACE","METAL","RIVET","PAINT","CLAMP","SCREW","TORCH","VALVE","HINGE",
  "LATCH","STEEL","BRASS","MOTOR","POWER","WHEEL","BUILD","FORGE","GLOVE","CRANE",
  "GRAIN","THINK","THANK","EVERY","OTHER","THERE","WHERE","WHICH","WRITE","PAPER",
  "POINT","PLACE","MONEY","STORY","SHINE","SHORE","STORM","STORE","SCORE","SHADE",
  "SHAPE","SHAKE","BRIDE","TRICK","BRICK","CLICK","CLOCK","BLOCK","STICK","THICK",
  "QUICK","PHASE","PRIZE","PRIME","CRIME","DRAIN","PLAIN","STAIN","FAITH","SAINT"
];

const EXTRA_GUESSES = [
  "SLATE","TRACE","CRATE","ADIEU","AUDIO","RAISE","AROSE","LEAST","STARE","TEARS",
  "NOTES","NIGHT","MIGHT","RIGHT","SIGHT","FIGHT","TIGHT","EIGHT","APPLE","HAPPY",
  "HELLO","WORLD","MUSIC","PIANO","TABLE","CHAIR","PHONE","BOARD","PRESS","CABLE",
  "TOOLS","PARTS","STOCK","TRADE","MIXER","PUMPS","TRAIN","TRAIL","BRING","THEIR",
  "WORDS","WROTE","PUNCH","TOUCH","WATCH","CATCH","MATCH","BATCH","PATCH","HATCH",
  "HOIST","SPARK","MOUNT","BOLTS","WELDS","PIPES","PIVOT","SHEET","ANGLE","EARTH",
  "EAGLE","LEMON","LEVEL","LABEL","MAGIC","MODEL","NORTH","SOUTH","GREEN","HEART",
  "HEAVY","HOTEL","HUMAN","LARGE","LEARN","MAYBE","MONTH","MOUTH","MOVIE","NEVER",
  "OCEAN","ORDER","PARTY","PEACE","PHOTO","PIECE","PILOT","PITCH","PRICE","PROUD",
  "QUEEN","QUEST","RADIO","RANGE","RAPID","REACH","READY","REPLY","RIVER","ROUGH",
  "ROUND","ROUTE","ROYAL","SCENE","SENSE","SHARP","SHEEP","SHIFT","SHIRT","SHORT",
  "SHOWN","SILLY","SINCE","SKILL","SLEEP","SLIDE","SMART","SOLID","SORRY","SOUND",
  "SPACE","SPEAK","SPEED","SPEND","SPLIT","SPOKE","SPORT","STAFF","STAGE","STAND",
  "START","STATE","STEAM","STIFF","STILL","STOOD","STUCK","STUDY","STUFF","SUGAR",
  "SUITE","SUPER","SWEET","TASTE","TEACH","TEETH","THEME","THOSE","THREE","THREW",
  "THROW","THUMB","TIRED","TITLE","TODAY","TOPIC","TOTAL","TOUGH","TOWER","TRACK",
  "TREAT","TREND","TRIAL","TRUCK","TRULY","TRUNK","TRUST","TRUTH","UNDER","UNION",
  "UNTIL","UPPER","UPSET","URBAN","USAGE","USUAL","VALID","VALUE","VIDEO","VISIT",
  "VITAL","VOICE","WASTE","WHILE","WHITE","WHOLE","WHOSE","WOMAN","WOMEN","WORRY",
  "WORSE","WORST","WORTH","WOULD","WRONG","YIELD","YOUNG","YOUTH"
];

const VALID_GUESSES = new Set([...ANSWERS, ...EXTRA_GUESSES]);

const EPOCH = new Date("2026-01-01T00:00:00Z");

function puzzleNoFor(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return Math.floor((d - EPOCH) / 86400000) + 1;
}

// Changing PUZZLE_SECRET (or JWT_SECRET when it's unset) reshuffles every
// future day; puzzles already stored in wurthle_puzzles keep their answer.
function answerOrder(secret) {
  const key = (w) => crypto.createHmac("sha256", secret).update("wurthle-answer-order:" + w).digest("hex");
  return [...ANSWERS].sort((a, b) => (key(a) < key(b) ? -1 : 1));
}

const ORDER = answerOrder(process.env.PUZZLE_SECRET || SECRET);

function answerForDate(dateStr) {
  const n = puzzleNoFor(dateStr);
  return ORDER[(((n - 1) % ORDER.length) + ORDER.length) % ORDER.length];
}

function scoreGuess(guess, answer) {
  const g = guess.split("");
  const a = answer.split("");
  const result = ["absent", "absent", "absent", "absent", "absent"];
  const consumed = [false, false, false, false, false];
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) { result[i] = "correct"; consumed[i] = true; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!consumed[j] && g[i] === a[j]) {
        result[i] = "present"; consumed[j] = true; break;
      }
    }
  }
  return result;
}

module.exports = { ANSWERS, VALID_GUESSES, puzzleNoFor, answerOrder, answerForDate, scoreGuess };
