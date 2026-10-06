"use strict";

/* =========================================================
   たして10か20
   第1試作版
========================================================= */


/* =========================================================
   DOM
========================================================= */

const screens = {
  menu: document.getElementById("menu-screen"),
  soloMenu: document.getElementById("solo-menu-screen"),
  game: document.getElementById("game-screen"),
  result: document.getElementById("result-screen"),
  howto: document.getElementById("howto-screen"),
  records: document.getElementById("records-screen"),
  settings: document.getElementById("settings-screen")
};

const fieldArea = document.getElementById("field-area");
const handArea = document.getElementById("hand-area");
const deckCount = document.getElementById("deck-count");
const graveyard = document.getElementById("graveyard");
const graveyardCard = document.getElementById("graveyard-card");

const turnDisplay = document.getElementById("turn-display");

const drawButton = document.getElementById("draw-button");
const turnButtons = document.getElementById("turn-buttons");
const finalButtons = document.getElementById("final-buttons");

const passButton = document.getElementById("pass-button");
const confirmButton = document.getElementById("confirm-button");

const cannotMakeSetButton =
  document.getElementById("cannot-make-set-button");

const finalConfirmButton =
  document.getElementById("final-confirm-button");

const messageOverlay =
  document.getElementById("message-overlay");

const messageText =
  document.getElementById("message-text");

const graveyardOverlay =
  document.getElementById("graveyard-overlay");

const graveyardHistory =
  document.getElementById("graveyard-history");

const exitOverlay =
  document.getElementById("exit-overlay");


/* =========================================================
   ボタン
========================================================= */

document.getElementById("solo-button")
  .addEventListener("click", () => {
    showSoloBestScores();
    showScreen("soloMenu");
    updateDailyDisplay();
  });

document.getElementById("versus-button")
  .addEventListener("click", () => {
    alert("2人対戦は次の段階で追加します。");
  });

document.getElementById("records-button")
  .addEventListener("click", () => {
    showBestScores();
    showScreen("records");
    updateRecordsDisplay();
  });

document.getElementById("howto-button")
  .addEventListener("click", () => {
    showScreen("howto");
  });

document.getElementById("settings-button")
  .addEventListener("click", () => {
    showScreen("settings");
  });

document.getElementById("solo-menu-back-button")
  .addEventListener("click", () => {
    showScreen("menu");
  });

document.getElementById("howto-back-button")
  .addEventListener("click", () => {
    showScreen("menu");
  });

document.getElementById("records-back-button")
  .addEventListener("click", () => {
    showScreen("menu");
  });

document.getElementById("settings-back-button")
  .addEventListener("click", () => {
    showScreen("menu");
  });

document.getElementById("start-game-button")
  .addEventListener("click", startNewGame);

document.getElementById("retry-button")
  .addEventListener("click", startNewGame);

document.getElementById("result-menu-button")
  .addEventListener("click", () => {
    updateMenuTodaySummary();
    showScreen("menu");
  });

document.getElementById("game-menu-button")
  .addEventListener("click", () => {
    exitOverlay.classList.remove("hidden");
  });

document.getElementById("continue-game-button")
  .addEventListener("click", () => {
    exitOverlay.classList.add("hidden");
  });

document.getElementById("exit-game-button")
  .addEventListener("click", () => {
    exitOverlay.classList.add("hidden");
    updateMenuTodaySummary();
    showScreen("menu");
  });

document.getElementById("draw-button")
  .addEventListener("click", drawCard);

document.getElementById("pass-button")
  .addEventListener("click", passTurn);

document.getElementById("confirm-button")
  .addEventListener("click", () => {
    confirmSets(false);
  });

document.getElementById("final-confirm-button")
  .addEventListener("click", confirmFinalTurn);

document.getElementById("cannot-make-set-button")
  .addEventListener("click", loseGame);

graveyard.addEventListener("click", () => {
  if (!game.inProgress) {
    return;
  }

  openGraveyard();
});

document.getElementById("close-graveyard-button")
  .addEventListener("click", () => {
    graveyardOverlay.classList.add("hidden");
  });


/* =========================================================
   効果音設定
========================================================= */

/*
 * 効果音音量
 *
 * OFF = 0
 * 小   = 0.3
 * 中   = 0.6
 * 大   = 1.0
 *
 * 初回は「中」
 */
let soundVolume =
  Number(localStorage.getItem("soundVolume") ?? 0.6);


/* =========================================================
   効果音
========================================================= */

const sounds = {
  decide: new Audio("sounds/decide.mp3"),
  draw: new Audio("sounds/draw.mp3"),
  place: new Audio("sounds/place.mp3"),
  complete10: new Audio("sounds/complete10.mp3"),
  complete20: new Audio("sounds/complete20.mp3"),
  grave: new Audio("sounds/grave.mp3"),
  deal: new Audio("sounds/deal.mp3"),
  pass: new Audio("sounds/pass.mp3"),
  penalty: new Audio("sounds/penalty.mp3"),
  win: new Audio("sounds/win.mp3"),
  lose: new Audio("sounds/lose.mp3"),
  shuffle: new Audio("sounds/shuffle.mp3")
};


/* =========================================================
   効果音を再生
========================================================= */

function playSound(name) {

  /*
   * OFFなら何もしない
   */
  if (soundVolume <= 0) {
    return;
  }

  const sound = sounds[name];

  if (!sound) {
    return;
  }

  /*
   * 現在の音量を設定
   */
  sound.volume = soundVolume;

  /*
   * 同じ音を連続して鳴らせるようにする
   */
  sound.currentTime = 0;

  sound.play().catch(() => {});
}


/* =========================================================
   効果音音量を設定
========================================================= */

function setSoundVolume(volume) {

  soundVolume = Number(volume);

  localStorage.setItem(
    "soundVolume",
    String(soundVolume)
  );
}

/* =========================================================
   カードデータ
========================================================= */

const suits = [
  {
    symbol: "♥",
    color: "red"
  },
  {
    symbol: "♦",
    color: "red"
  },
  {
    symbol: "♠",
    color: "black"
  },
  {
    symbol: "♣",
    color: "black"
  }
];


/* =========================================================
   ゲーム状態
========================================================= */

const game = {
  deck: [],
  field: [],
  hand: [],
  graveyard: [],

  turn: 1,
  inProgress: false,
  hasDrawn: false,
  finalTurn: false,

  startTime: 0,
  isNewBest: false,

  score: {
    clear: 500,
    deckRemaining: 0,

    setNormal: 0,
    setColor: 0,
    setSuit: 0,

    speed: 0,
    oneShot: 0,
    lastShot: 0,

    total: 0
  },

  dragging: null
};


/* =========================================================
   デイリー記録
========================================================= */

function getTodayKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}


function getDailyRecord() {

  const key = "tasite10or20_daily";

  const saved = localStorage.getItem(key);

  if (!saved) {
    return {
      date: getTodayKey(),
      challenges: 0,
      wins: 0,
      losses: 0
    };
  }

  try {

    const record = JSON.parse(saved);

    if (record.date !== getTodayKey()) {
      return {
        date: getTodayKey(),
        challenges: 0,
        wins: 0,
        losses: 0
      };
    }

    return record;

  } catch (error) {

    return {
      date: getTodayKey(),
      challenges: 0,
      wins: 0,
      losses: 0
    };
  }
}


function saveDailyRecord(record) {
  localStorage.setItem(
    "tasite10or20_daily",
    JSON.stringify(record)
  );
}


function updateDailyDisplay() {

  const record = getDailyRecord();

  document.getElementById("challenge-count").textContent =
    `本日${record.challenges}回目の挑戦`;

  document.getElementById("win-loss").textContent =
    `${record.wins}勝${record.losses}敗`;
}


function updateMenuTodaySummary() {

  const record = getDailyRecord();

  document.getElementById("menu-wins").textContent =
    record.wins;

  document.getElementById("menu-losses").textContent =
    record.losses;
}


function updateRecordsDisplay() {

  const record = getDailyRecord();

  document.getElementById("records-challenge").textContent =
    record.challenges;

  document.getElementById("records-wins").textContent =
    record.wins;

  document.getElementById("records-losses").textContent =
    record.losses;
}


/* =========================================================
   画面切り替え
========================================================= */

function showScreen(name) {

  Object.values(screens).forEach(screen => {
    screen.classList.remove("active");
  });

  screens[name].classList.add("active");
}


/* =========================================================
   カード生成
========================================================= */

function createDeck() {

  const cards = [];

  let id = 0;

  for (let value = 1; value <= 10; value++) {

    for (let suitIndex = 0; suitIndex < suits.length; suitIndex++) {

      cards.push({
        id: id++,
        value,
        suit: suits[suitIndex].symbol,
        color: suits[suitIndex].color
      });

    }
  }

  return cards;
}


/* =========================================================
   シャッフル
========================================================= */

function shuffle(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] =
      [array[j], array[i]];
  }

  return array;
}


/* =========================================================
   新しいゲーム
========================================================= */

async function startNewGame() {

  const record = getDailyRecord();

  record.challenges++;

  saveDailyRecord(record);

  game.deck = shuffle(createDeck());

  playSound("shuffle");

  game.field = [];
  game.hand = [];
  game.graveyard = [];

  game.turn = 1;
game.inProgress = true;
game.hasDrawn = false;
game.finalTurn = false;

turnDisplay.classList.remove("turn-slide");
turnDisplay.textContent = "第1ターン";

game.score = {
  clear: 500,
  deckRemaining: 0,

  setNormal: 0,
  setColor: 0,
  setSuit: 0,

  speed: 0,
  oneShot: 0,
  lastShot: 0,

  total: 0
};

  showScreen("game");

  hideActionButtons();

  renderAll();

  await showMessage("シャッフルします", 1000);

  await dealInitialCards();

game.startTime = Date.now();

showTurn();

await showTurnPopup();

  showDrawButton();
}


/* =========================================================
   初期配札
========================================================= */

async function dealInitialCards() {

  for (let i = 0; i < 4; i++) {

    const card = game.deck.pop();

    if (card) {
      game.field.push({
        base: card,
        stack: []
      });
    }

    playSound("deal");

    renderAll();

    await wait(180);
  }


  for (let i = 0; i < 5; i++) {

    const card = game.deck.pop();

    if (card) {
      game.hand.push(card);
    }

    playSound("deal");

    renderAll();

    await wait(180);
  }
}


/* =========================================================
   ドロー
========================================================= */

async function drawCard() {

  if (!game.inProgress) {
    return;
  }

  if (game.finalTurn) {
    return;
  }

  if (game.hasDrawn) {
    return;
  }

  if (game.deck.length === 0) {

    beginFinalTurn();

    return;
  }

  const card = game.deck.pop();

  if (card) {

    game.hand.push(card);

    /*
     * 山札からカードを引いた音
     */
    playSound("draw");

    game.hasDrawn = true;

    renderAll();

    highlightNewestCard();

    await wait(350);

    showTurnActionButtons();
  }
}


/* =========================================================
   パス
========================================================= */

async function passTurn() {

  if (!game.inProgress || !game.hasDrawn) {
    return;
  }

  hideActionButtons();

  /*
   * パスを選択した音
   */
  playSound("pass");

  await showMessage("パスが選択されました", 700);

  await showMessage("ペナルティ", 700);

  /*
   * 2ドローのペナルティ音
   */
  playSound("penalty");

  await showMessage("2ドロー", 900);

  let drawCount = Math.min(2, game.deck.length);

  if (game.deck.length === 1) {

    await showMessage(
      "山札が1枚しかないので、1ドロー",
      1000
    );

  } else if (game.deck.length === 0) {

    await showMessage(
      "山札がないので、0ドロー",
      1000
    );
  }


  for (let i = 0; i < drawCount; i++) {

    const card = game.deck.pop();

    if (card) {
      game.hand.push(card);
    }

    renderAll();

    await wait(250);
  }


  if (game.deck.length === 0) {
    game.finalTurn = true;
  }

  nextTurn();
}


/* =========================================================
   次のターン
========================================================= */

async function nextTurn() {

  game.turn++;
  game.hasDrawn = false;

  if (game.deck.length === 0) {
    game.finalTurn = true;
  }

  renderAll();

  await wait(300);

  showTurn();
await showTurnPopup();

if (game.finalTurn) {
  showFinalButtons();
} else {
  showDrawButton();
}
}


/* =========================================================
   最終ターン
========================================================= */

function beginFinalTurn() {

  game.finalTurn = true;

  game.hasDrawn = true;

  renderAll();

  showTurn();

  setTimeout(() => {
    showFinalButtons();
  }, 700);
}


function confirmFinalTurn() {

  if (!game.inProgress) {
    return;
  }

  const validSets = getValidSets();

  if (validSets.length === 0) {
    return;
  }

  confirmSets(true);
}


/* =========================================================
   セット計算
========================================================= */

function getStackSum(fieldIndex) {

  const field = game.field[fieldIndex];

  if (!field) {
    return 0;
  }

  let total = field.base.value;

  for (const card of field.stack) {
    total += card.value;
  }

  return total;
}


function getValidSets() {

  const result = [];

  game.field.forEach((field, index) => {

    if (!field) {
      return;
    }

    if (field.stack.length === 0) {
      return;
    }

    const total = getStackSum(index);

    if (total === 10 || total === 20) {

      result.push({
        fieldIndex: index,
        total
      });
    }
  });

  return result;
}

function calculateSetScore(field) {

  const cards = [
    field.base,
    ...field.stack
  ];

  const cardCount = cards.length;

  const basePointsTable = {
    2: 20,
    3: 60,
    4: 150,
    5: 200,
    6: 300
  };

  let basePoints;

if (cardCount >= 7) {
  basePoints = 400;
} else {
  basePoints =
    basePointsTable[cardCount] || 0;
}

  const sameSuit =
    cards.every(card =>
      card.suit === cards[0].suit
    );

  const sameColor =
    cards.every(card =>
      card.color === cards[0].color
    );

  if (sameSuit) {
    return {
      type: "suit",
      points: basePoints * 4
    };
  }

  if (sameColor) {
    return {
      type: "color",
      points: basePoints * 2
    };
  }

  return {
    type: "normal",
    points: basePoints
  };
}

/* =========================================================
   決定
========================================================= */

async function confirmSets(isFinal = false) {

  if (!game.inProgress) {
    return;
  }

  const validSets = getValidSets();

  if (validSets.length >= 3) {
  await showSetLimitPopup();
  return;
}

  if (validSets.length === 0) {
    return;
  }

  if (validSets.length > 2) {
    return;
  }

  

  hideActionButtons();

/*
 * 決定音
 */
playSound("decide");

/*
 * 完成したセットを順番に処理
 */

for (const setInfo of validSets) {

  const field = game.field[setInfo.fieldIndex];

  /*
   * セット得点を計算
   * 墓地へ送る前に計算する
   */
  const setScore =
    calculateSetScore(field);

  if (setScore.type === "suit") {

    game.score.setSuit +=
      setScore.points;

  } else if (setScore.type === "color") {

    game.score.setColor +=
      setScore.points;

  } else {

    game.score.setNormal +=
      setScore.points;
  }

  
  /*
   * 完成ポップ
   */
  await showMessage(
    `${setInfo.total}完成！`,
    1000
  );

  /*
   * 墓地へ1枚ずつ移動
   */
    game.graveyard.push(field.base);

    for (const card of field.stack) {

      game.graveyard.push(card);

      playSound("grave");

      renderAll();

      await wait(120);
    }

    /*
     * 場札を空にする
     */
    game.field[setInfo.fieldIndex] = null;

    renderAll();

    await wait(150);
  }


  // 手札が0枚、かつ場札に未完成のカードも残っていなければ勝利
const remainingFieldCards = game.field.some(
  field => field && field.stack.length > 0
);

if (
  game.hand.length === 0 &&
  !remainingFieldCards
) {
  winGame();
  return;
}


  /*
   * 空いた場札を補充
   */

  await refillField();


  /*
   * 最終ターンの勝敗
   */

  if (isFinal) {

    loseGame();
    return;
  }


  nextTurn();
}


/* =========================================================
   場札補充
========================================================= */

async function refillField() {

  for (let i = 0; i < game.field.length; i++) {

    if (game.field[i] !== null) {
      continue;
    }

    if (game.deck.length === 0) {
      break;
    }

    const card = game.deck.pop();

    if (card) {

      game.field[i] = {
        base: card,
        stack: []
      };

      renderAll();

      await wait(220);
    }
  }


  if (game.deck.length === 0) {
    game.finalTurn = true;
  }
}

function calculateSpeedBonus() {

  const elapsedSeconds =
    (Date.now() - game.startTime) / 1000;

  if (elapsedSeconds <= 30) return 200;
  if (elapsedSeconds <= 45) return 150;
  if (elapsedSeconds <= 60) return 100;
  if (elapsedSeconds <= 90) return 50;

  return 0;
}

function calculateFinalScore() {

  console.log("turn:", game.turn);
console.log("startTime:", game.startTime);
console.log("speed:", game.score.speed);
console.log("oneShot:", game.score.oneShot);

  game.score.deckRemaining =
    game.deck.length * 50;

  game.score.speed =
    calculateSpeedBonus();

  /*
   * 最初のターンでクリア
   */
  if (game.turn === 1) {
    game.score.oneShot = 300;
  } else {
    game.score.oneShot = 0;
  }

  if (game.finalTurn) {
  game.score.lastShot = 300;
} else {
  game.score.lastShot = 0;
}

  game.score.total =
    game.score.clear +
    game.score.deckRemaining +
    game.score.setNormal +
    game.score.setColor +
    game.score.setSuit +
    game.score.speed +
    
    game.score.oneShot +
    game.score.lastShot;

  
}

function showFinalScore() {

  document.getElementById("score-clear")
    .textContent = game.score.clear;

  document.getElementById("score-deck")
    .textContent = game.score.deckRemaining;

  document.getElementById("score-color")
    .textContent = game.score.setColor;

  document.getElementById("score-suit")
    .textContent = game.score.setSuit;

  document.getElementById("score-normal")
    .textContent = game.score.setNormal;

  const setTotal =
    game.score.setColor +
    game.score.setSuit +
    game.score.setNormal;

  document.getElementById("score-set-total")
    .textContent = setTotal;

  const newBestMessage =
  document.getElementById("new-best-message");

newBestMessage.classList.toggle(
  "hidden",
  !game.isNewBest
);

  const speedRow =
  document.getElementById("score-speed-row");

const oneShotRow =
  document.getElementById("score-one-shot-row");

const lastShotRow =
  document.getElementById("score-last-shot-row");

document.getElementById("score-speed")
  .textContent = game.score.speed;

document.getElementById("score-one-shot")
  .textContent = game.score.oneShot;

document.getElementById("score-last-shot")
  .textContent = game.score.lastShot;

if (game.score.lastShot > 0) {
  lastShotRow.style.display = "";
} else {
  lastShotRow.style.display = "none";
}

speedRow.classList.toggle(
  "hidden",
  game.score.speed <= 0
);

oneShotRow.classList.toggle(
  "hidden",
  game.score.oneShot <= 0
);

lastShotRow.classList.toggle(
  "hidden",
  game.score.lastShot <= 0
);

  document.getElementById("score-total")
    .textContent = game.score.total + "点";
}


function showBestScores() {

  const list =
    document.getElementById("best-score-list");

  const bestScores =
    JSON.parse(
      localStorage.getItem("bestScores") || "[]"
    );

  list.innerHTML = "";

  if (bestScores.length === 0) {
    list.innerHTML =
      `<div class="no-record">まだ記録がありません</div>`;
    return;
  }

  bestScores.forEach((record, index) => {

    const row =
      document.createElement("div");

    row.className = "best-score-row";

    row.innerHTML = `
      <span class="best-score-rank">
        ${index + 1}位
      </span>

      <span class="best-score-points">
        ${record.score.toLocaleString()}点
      </span>

      <span class="best-score-date">
        ${record.date}
      </span>
    `;

    list.appendChild(row);
  });
}


function showSoloBestScores() {

  // これまでのベストスコア
  const bestScore =
    Number(localStorage.getItem("bestScore")) || 0;

  document.getElementById("all-time-best-score")
    .textContent =
      `${bestScore.toLocaleString()}点`;


  // 本日のベストスコア
  const todayBestData =
    JSON.parse(
      localStorage.getItem("todayBestScore") || "null"
    );

  const now = new Date();

  const today =
    `${now.getFullYear()}/` +
    `${String(now.getMonth() + 1).padStart(2, "0")}/` +
    `${String(now.getDate()).padStart(2, "0")}`;

  let todayBest = 0;

  if (
    todayBestData &&
    todayBestData.date === today
  ) {
    todayBest = todayBestData.score;
  }

  document.getElementById("today-best-score")
    .textContent =
      `${todayBest.toLocaleString()}点`;
}


/* =========================================================
   勝敗
========================================================= */

async function winGame() {

  if (!game.inProgress) {
    return;
  }

  game.inProgress = false;

    // スコア計算
  calculateFinalScore();

  // ベストスコア判定
  const bestScore =
    Number(localStorage.getItem("bestScore")) || 0;

  game.isNewBest =
    game.score.total > bestScore;

  if (game.isNewBest) {
    localStorage.setItem(
      "bestScore",
      game.score.total
    );
  }

    // ベストスコア履歴に追加
  const bestScores =
    JSON.parse(
      localStorage.getItem("bestScores") || "[]"
    );

  const now = new Date();

  const date =
    `${now.getFullYear()}/` +
    `${String(now.getMonth() + 1).padStart(2, "0")}/` +
    `${String(now.getDate()).padStart(2, "0")}`;

  bestScores.push({
    score: game.score.total,
    turn: game.turn,
    date: date
  });

    // 本日のベストスコアを更新
  
  const today =
    `${now.getFullYear()}/` +
    `${String(now.getMonth() + 1).padStart(2, "0")}/` +
    `${String(now.getDate()).padStart(2, "0")}`;

  const todayBestData =
    JSON.parse(
      localStorage.getItem("todayBestScore") || "null"
    );

  if (
    !todayBestData ||
    todayBestData.date !== today ||
    game.score.total > todayBestData.score
  ) {

    localStorage.setItem(
      "todayBestScore",
      JSON.stringify({
        date: today,
        score: game.score.total
      })
    );
  }

  bestScores.sort(
    (a, b) => b.score - a.score
  );

  const topFive =
    bestScores.slice(0, 5);

  localStorage.setItem(
    "bestScores",
    JSON.stringify(topFive)
  );

  const record = getDailyRecord();

  record.wins++;

  saveDailyRecord(record);

  // You Win! ポップアップ
  await showWinPopup();

  // 結果画面
  document.getElementById("result-title")
    .textContent = "You Win!";

  document.getElementById("result-message")
    .textContent = "おめでとう！";

  document.getElementById("result-turns")
    .textContent =
      `クリア：第${game.turn}ターン`;

  // 一時的に無効化
  showFinalScore();

  showScreen("result");
}


async function loseGame() {

  if (!game.inProgress) {
    return;
  }

  game.inProgress = false;

  const record = getDailyRecord();

  record.losses++;

  saveDailyRecord(record);

  // You Lose! ポップアップを表示
  await showLosePopup();

  // 結果画面
  document.getElementById("result-title")
    .textContent = "You Lose!";

  document.getElementById("result-message")
    .textContent =
      "残念！もう一度挑戦してみよう！";

  document.getElementById("result-turns")
    .textContent = `第${game.turn}ターン`;

  /*
   * You Lose! の場合は全項目0点
   */
  game.score.clear = 0;
  game.score.setNormal = 0;
  game.score.setColor = 0;
  game.score.setSuit = 0;
  game.score.speed = 0;
  game.score.oneShot = 0;
  game.score.lastShot = 0;
  game.score.deckRemaining = 0;
  game.score.total = 0;

  // 結果画面のスコアを表示
  showFinalScore();

  showScreen("result");
}


/* =========================================================
   ターン表示
========================================================= */

function showTurn() {

  if (game.finalTurn) {

    turnDisplay.innerHTML =
      `第${game.turn}ターン<br>（最終ターン）`;

  } else {

    turnDisplay.textContent =
      `第${game.turn}ターン`;
  }

  turnDisplay.classList.remove("turn-slide");

  void turnDisplay.offsetWidth;

  turnDisplay.classList.add("turn-slide");
}

async function showTurnPopup() {
  const popup = document.getElementById("turn-popup");

  if (!popup) return;

  if (game.finalTurn) {
    popup.textContent = `第${game.turn}ターン！`;
  } else {
    popup.textContent = `第${game.turn}ターン！`;
  }

  popup.classList.remove("show");

  // アニメーションを確実に再実行
  void popup.offsetWidth;

  popup.classList.add("show");

  await wait(1100);

  popup.classList.remove("show");
}

/* =========================================================
   ボタン表示
========================================================= */

function hideActionButtons() {

  drawButton.classList.add("hidden");
  turnButtons.classList.add("hidden");
  finalButtons.classList.add("hidden");
}


function showDrawButton() {

  hideActionButtons();

  drawButton.classList.remove("hidden");
}


function showTurnActionButtons() {

  hideActionButtons();

  turnButtons.classList.remove("hidden");

  updateConfirmButton();
}


function showFinalButtons() {

  hideActionButtons();

  finalButtons.classList.remove("hidden");

  updateConfirmButton();
}


function updateConfirmButton() {

  const validSets = getValidSets();

  const enabled = validSets.length > 0;

  confirmButton.disabled = !enabled;
  finalConfirmButton.disabled = !enabled;

  confirmButton.style.opacity =
    enabled ? "1" : "0.45";

  finalConfirmButton.style.opacity =
    enabled ? "1" : "0.45";
}


/* =========================================================
   メッセージ
========================================================= */

function showMessage(text, duration) {

  return new Promise(resolve => {

    setTimeout(() => {

      messageText.textContent = text;

      messageOverlay.classList.remove("hidden");

      /*
       * ポップ表示と同時に効果音
       */
      if (text === "10完成！") {
        playSound("complete10");
      } else if (text === "20完成！") {
        playSound("complete20");
      }

      setTimeout(() => {

        messageOverlay.classList.add("hidden");

        resolve();

      }, duration);

    }, 250);
  });
}


async function showSetLimitPopup() {
  const popup =
    document.getElementById("set-limit-popup");

  if (!popup) return;

  popup.classList.remove("show");

  // アニメーションを確実に再スタート
  void popup.offsetWidth;

  popup.classList.add("show");

  await wait(1200);

  popup.classList.remove("show");
}

function showWinPopup() {
  return new Promise(resolve => {
    const popup =
      document.getElementById("win-popup");

    if (!popup) {
      resolve();
      return;
    }

    popup.classList.remove("show");

    // アニメーションを確実に再スタート
    void popup.offsetWidth;

    popup.classList.add("show");

     /*
     * You Win! ポップアップと同時に勝利音
     */
    playSound("win");

    function handleClick() {
      popup.removeEventListener("click", handleClick);
      popup.classList.remove("show");

      resolve();
    }

    popup.addEventListener("click", handleClick);
  });
}

function showLosePopup() {
  return new Promise(resolve => {
    const popup =
      document.getElementById("lose-popup");

    if (!popup) {
      resolve();
      return;
    }

    popup.classList.remove("show");

     /*
     * You Lose! ポップアップと同時に敗北音
     */
    playSound("lose");

    // アニメーションを確実に再スタート
    void popup.offsetWidth;

    popup.classList.add("show");

    function handleClick() {
      popup.removeEventListener("click", handleClick);
      popup.classList.remove("show");

     

      resolve();
    }

    popup.addEventListener("click", handleClick);
  });
}


/* =========================================================
   待機
========================================================= */

function wait(ms) {

  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}


/* =========================================================
   新しいカードの強調
========================================================= */

function highlightNewestCard() {

  const cards =
    handArea.querySelectorAll(".hand-card");

  const newest = cards[cards.length - 1];

  if (!newest) {
    return;
  }

  newest.classList.add("new-card");

  setTimeout(() => {
    newest.classList.remove("new-card");
  }, 1000);
}


/* =========================================================
   画面描画
========================================================= */

function renderAll() {

  renderDeck();

  renderField();

  renderHand();

  renderGraveyard();

  updateConfirmButton();
}


/* =========================================================
   山札
========================================================= */

function renderDeck() {

  deckCount.textContent =
    `${game.deck.length}枚`;
}


/* =========================================================
   墓地
========================================================= */

function renderGraveyard() {

  if (game.graveyard.length === 0) {

    graveyardCard.textContent = "-";

    graveyardCard.className =
      "grave-card-empty";

    return;
  }

  const card =
    game.graveyard[game.graveyard.length - 1];

  graveyardCard.textContent =
    `${card.value}${card.suit}`;

  graveyardCard.className =
    `grave-card-empty ${card.color === "red"
      ? "card-red"
      : "card-black"}`;
}


/* =========================================================
   墓地履歴
========================================================= */

function openGraveyard() {

  graveyardHistory.innerHTML = "";

  game.graveyard.forEach(card => {

    const element =
      document.createElement("div");

    element.className =
      `history-card ${
        card.color === "red"
          ? "card-red"
          : "card-black"
      }`;

    element.innerHTML = `
      <div>${card.value}</div>
      <div>${card.suit}</div>
    `;

    graveyardHistory.appendChild(element);
  });

  graveyardOverlay.classList.remove("hidden");
}


/* =========================================================
   場札描画
========================================================= */

function renderField() {

  fieldArea.innerHTML = "";

  game.field.forEach((field, fieldIndex) => {

    const slot =
      document.createElement("div");

    slot.className = "field-slot";

    if (!field) {
      fieldArea.appendChild(slot);
      return;
    }


    /*
     * 場札本体
     */

    const base =
      createCardElement(
        field.base,
        "field-card-base"
      );

    slot.appendChild(base);


    /*
     * スタック
     */

    const stack =
      document.createElement("div");

    stack.className = "card-stack";

    field.stack.forEach((card, stackIndex) => {

      const element =
        createCardElement(
          card,
          "stacked-card"
        );

      // 画面幅に応じてカードの重なり量を自動調整
const screenWidth = window.innerWidth;

const stackOffset = Math.min(
  0.75,
  Math.max(
    0.44,
    0.44 + (screenWidth - 375) * (0.31 / (1024 - 375))
  )
);

element.style.top =
  `${(stackIndex + 1) * stackOffset * getCardWidth()}px`;

      element.dataset.fieldIndex =
        fieldIndex;

      element.dataset.stackIndex =
        stackIndex;

      stack.appendChild(element);

      addStackDragEvents(
        element,
        fieldIndex,
        stackIndex
      );
    });


    slot.appendChild(stack);


    /*
     * 合計表示
     */

    if (field.stack.length > 0) {

      const total =
        getStackSum(fieldIndex);

      const totalElement =
        document.createElement("div");

      totalElement.className =
        "stack-total";

      if (total === 10 || total === 20) {

        totalElement.classList.add("valid");

        totalElement.textContent =
          total;

      } else if (total > 20) {

        totalElement.classList.add("over");

        totalElement.textContent =
          total;
      }

      slot.appendChild(totalElement);
    }


    fieldArea.appendChild(slot);
  });
}


/* =========================================================
   手札描画
========================================================= */

function renderHand() {

  handArea.innerHTML = "";

  game.hand.forEach((card, index) => {

    const element =
      createCardElement(
        card,
        "hand-card"
      );

    element.dataset.handIndex = index;

    addHandDragEvents(element, index);

    handArea.appendChild(element);
  });
}


/* =========================================================
   カードHTML
========================================================= */

function createCardElement(card, extraClass = "") {

  const element =
    document.createElement("div");

  element.className =
    `playing-card ${
      card.color === "red"
        ? "card-red"
        : "card-black"
    } ${extraClass}`;

  /*
   * 右上
   */
  const topRight =
    document.createElement("div");

  topRight.className =
    "card-corner top-right";

  topRight.innerHTML = `
  <span>${card.value}</span>
  <span class="card-corner-suit">${card.suit}</span>
`;


  /*
   * 左下
   */
  const bottomLeft =
    document.createElement("div");

  bottomLeft.className =
    "card-corner bottom-left";

  bottomLeft.innerHTML = `
  <span>${card.value}</span>
  <span class="card-corner-suit">${card.suit}</span>
`;


  /*
   * 中央マーク
   */

    /*
   * 中央マーク
   */

  const center =
    document.createElement("div");

  center.className =
    "card-center";

  const grid =
    document.createElement("div");

  grid.className =
    "pip-grid";

  const pipRows =
    getPipRows(card.value);

  pipRows.forEach(rowCount => {

    const row =
      document.createElement("div");

    row.className =
      "pip-row";

    for (let i = 0; i < rowCount; i++) {

      const pip =
        document.createElement("span");

      pip.className =
        "pip";

      pip.textContent =
        card.suit;

      row.appendChild(pip);
    }

    grid.appendChild(row);
  });

  center.appendChild(grid);


  element.appendChild(topRight);
  element.appendChild(bottomLeft);
  element.appendChild(center);

  return element;
}


/* =========================================================
   マーク配置
   「各行に何個置くか」で指定する
========================================================= */

function getPipRows(value) {

  const patterns = {

    1: [1],

    2: [1, 1],

    3: [2, 1],

    4: [2, 2],

    5: [3, 2],

    6: [3, 3],

    7: [4, 3],

    8: [4, 4],

    9: [5, 4],

    10: [5, 5]

  };

  return patterns[value];
}

/* =========================================================
   カード幅取得
========================================================= */

function getCardWidth() {

  const root =
    document.documentElement;

  const value =
    getComputedStyle(root)
      .getPropertyValue("--card-width");

  return parseFloat(value) || 60;
}


/* =========================================================
   手札ドラッグ
========================================================= */

function addHandDragEvents(element, handIndex) {

  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;


  element.addEventListener(
    "pointerdown",
    event => {

      if (!game.inProgress) {
        return;
      }

      if (graveyardOverlay.classList.contains("hidden") === false) {
        return;
      }

      event.preventDefault();

      const rect =
        element.getBoundingClientRect();

      startX = event.clientX;
      startY = event.clientY;

      offsetX =
        event.clientX - rect.left;

      offsetY =
        event.clientY - rect.top;

      dragging = true;

      element.setPointerCapture(
        event.pointerId
      );

      element.classList.add("dragging");

      element.style.left =
        `${rect.left}px`;

      element.style.top =
        `${rect.top}px`;

      element.style.width =
        `${rect.width}px`;

      element.style.height =
        `${rect.height}px`;

      game.dragging = {
        type: "hand",
        card: game.hand[handIndex],
        handIndex,
        element
      };
    }
  );


  element.addEventListener(
    "pointermove",
    event => {

      if (!dragging) {
        return;
      }

      event.preventDefault();

      const x =
        event.clientX - offsetX;

      const y =
        event.clientY - offsetY;

      element.style.left =
        `${x}px`;

      element.style.top =
        `${y}px`;

      highlightDropTargets(
        event.clientX,
        event.clientY
      );
    }
  );


  element.addEventListener(
    "pointerup",
    event => {

      if (!dragging) {
        return;
      }

      dragging = false;

      clearDropTargets();

      const target =
        getFieldAtPoint(
          event.clientX,
          event.clientY
        );

      element.classList.remove("dragging");

      element.style.left = "";
      element.style.top = "";
      element.style.width = "";
      element.style.height = "";

      if (target !== -1) {

        addCardToField(
          handIndex,
          target
        );

      }

      game.dragging = null;

      renderAll();
    }
  );


  element.addEventListener(
    "pointercancel",
    () => {

      dragging = false;

      clearDropTargets();

      element.classList.remove("dragging");

      element.style.left = "";
      element.style.top = "";
      element.style.width = "";
      element.style.height = "";

      game.dragging = null;

      renderAll();
    }
  );
}


/* =========================================================
   場札から手札へドラッグ
========================================================= */

function addStackDragEvents(
  element,
  fieldIndex,
  stackIndex
) {

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;


  element.addEventListener(
    "pointerdown",
    event => {

      if (!game.inProgress) {
        return;
      }

      if (graveyardOverlay.classList.contains("hidden") === false) {
        return;
      }

      event.preventDefault();

      const rect =
        element.getBoundingClientRect();

      offsetX =
        event.clientX - rect.left;

      offsetY =
        event.clientY - rect.top;

      dragging = true;

      element.setPointerCapture(
        event.pointerId
      );

      element.classList.add("dragging");

      element.style.left =
        `${rect.left}px`;

      element.style.top =
        `${rect.top}px`;

      element.style.width =
        `${rect.width}px`;

      element.style.height =
        `${rect.height}px`;

      game.dragging = {
        type: "stack",
        fieldIndex,
        stackIndex,
        element
      };
    }
  );


  element.addEventListener(
    "pointermove",
    event => {

      if (!dragging) {
        return;
      }

      event.preventDefault();

      element.style.left =
        `${event.clientX - offsetX}px`;

      element.style.top =
        `${event.clientY - offsetY}px`;

      highlightDropTargets(
        event.clientX,
        event.clientY
      );
    }
  );


  element.addEventListener(
    "pointerup",
    event => {

      if (!dragging) {
        return;
      }

      dragging = false;

      clearDropTargets();

      element.classList.remove("dragging");

      element.style.left = "";
      element.style.top = "";
      element.style.width = "";
      element.style.height = "";

      /*
       * まず手札へのドロップを判定
       */
      const handRect =
        handArea.getBoundingClientRect();

      const insideHand =
        event.clientX >= handRect.left &&
        event.clientX <= handRect.right &&
        event.clientY >= handRect.top &&
        event.clientY <= handRect.bottom;

      if (insideHand) {

        removeStackCardToHand(
          fieldIndex,
          stackIndex
        );

        game.dragging = null;

        renderAll();

        return;
      }


      /*
       * 手札ではなければ、
       * 場札へのドロップを判定
       */
      const target =
        getFieldAtPoint(
          event.clientX,
          event.clientY
        );

      if (target !== -1) {

        moveStackCardToField(
          fieldIndex,
          stackIndex,
          target
        );
      }


      game.dragging = null;

      renderAll();
    }
  );


  element.addEventListener(
    "pointercancel",
    () => {

      dragging = false;

      clearDropTargets();

      element.classList.remove("dragging");

      element.style.left = "";
      element.style.top = "";
      element.style.width = "";
      element.style.height = "";

      game.dragging = null;

      renderAll();
    }
  );
}


/* =========================================================
   手札 → 場札
========================================================= */

function addCardToField(
  handIndex,
  fieldIndex
) {

  if (
    handIndex < 0 ||
    handIndex >= game.hand.length
  ) {
    return;
  }

  const field =
    game.field[fieldIndex];

  if (!field) {
    return;
  }

  /*
   * 20になっているセットには追加できない
   */
  const current =
    getStackSum(fieldIndex);

  if (current >= 20) {
    return;
  }

  const card =
    game.hand.splice(handIndex, 1)[0];

  field.stack.push(card);

  /*
   * カードを場札に置いた音
   */
  playSound("place");
}


/* =========================================================
   場札 → 手札
========================================================= */

function removeStackCardToHand(
  fieldIndex,
  stackIndex
) {

  const field =
    game.field[fieldIndex];

  if (!field) {
    return;
  }

  if (
    stackIndex < 0 ||
    stackIndex >= field.stack.length
  ) {
    return;
  }

  /*
   * 途中のカードでも直接手札へ戻せる
   */
  const card =
    field.stack.splice(stackIndex, 1)[0];

  if (!card) {
    return;
  }

  game.hand.push(card);
}


/* =========================================================
   場札 → 別の場札
========================================================= */

function moveStackCardToField(
  sourceFieldIndex,
  stackIndex,
  targetFieldIndex
) {

  /*
   * 同じ場札への移動は何もしない
   */
  if (
    sourceFieldIndex === targetFieldIndex
  ) {
    return;
  }

  const sourceField =
    game.field[sourceFieldIndex];

  const targetField =
    game.field[targetFieldIndex];

  if (!sourceField || !targetField) {
    return;
  }

  if (
    stackIndex < 0 ||
    stackIndex >= sourceField.stack.length
  ) {
    return;
  }

  /*
   * 移動するカード
   */
  const card =
    sourceField.stack[stackIndex];

  if (!card) {
    return;
  }

  /*
   * 移動先が20以上なら入れない
   */
  const targetTotal =
    getStackSum(targetFieldIndex);

  if (targetTotal >= 20) {
    return;
  }

  /*
   * 移動先に追加した場合、
   * 20を超えるなら移動させない
   */
  if (
    targetTotal + card.value > 20
  ) {
    return;
  }

  /*
   * 元のセットからカードを取り除く
   */
  sourceField.stack.splice(
    stackIndex,
    1
  );

  /*
   * 別のセットへ追加
   */
  targetField.stack.push(card);
}


/* =========================================================
   ドロップ先判定
========================================================= */

function getFieldAtPoint(x, y) {

  const slots =
    fieldArea.querySelectorAll(".field-slot");

  for (let i = 0; i < slots.length; i++) {

    const rect =
      slots[i].getBoundingClientRect();

    /*
     * 場札本体＋セット部分まで
     * ドロップ領域にする
     */

    const bottom =
      rect.bottom +
      getCardWidth() * 6;

    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= bottom
    ) {
      return i;
    }
  }

  return -1;
}


/* =========================================================
   ドロップ先の強調
========================================================= */

function highlightDropTargets(x, y) {

  clearDropTargets();

  const slots =
    fieldArea.querySelectorAll(".field-slot");

  slots.forEach((slot, index) => {

    const rect =
      slot.getBoundingClientRect();

    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom + getCardWidth() * 5
    ) {

      const field =
        game.field[index];

      if (!field) {
        return;
      }

      const total =
        getStackSum(index);

      if (total < 20) {
        slot.classList.add("target-valid");
      }
    }
  });
}


function clearDropTargets() {

  document
    .querySelectorAll(".target-valid")
    .forEach(element => {
      element.classList.remove("target-valid");
    });
}

/* =========================================================
   効果音設定画面
========================================================= */

const soundOptionButtons = {
  0: document.getElementById("sound-off-button"),
  0.3: document.getElementById("sound-small-button"),
  0.6: document.getElementById("sound-medium-button"),
  1: document.getElementById("sound-large-button")
};


/*
 * 現在の音量設定を画面に反映
 */
function updateSoundSettingUI() {

  Object.entries(soundOptionButtons).forEach(
    ([volume, button]) => {

      if (!button) {
        return;
      }

      if (Number(volume) === soundVolume) {
        button.classList.add("selected");
      } else {
        button.classList.remove("selected");
      }
    }
  );
}


/*
 * 音量設定ボタン
 */

document
  .getElementById("sound-off-button")
  ?.addEventListener("click", () => {

    setSoundVolume(0);

    updateSoundSettingUI();
  });


document
  .getElementById("sound-small-button")
  ?.addEventListener("click", () => {

    setSoundVolume(0.3);

    updateSoundSettingUI();

    playSound("decide");
  });


document
  .getElementById("sound-medium-button")
  ?.addEventListener("click", () => {

    setSoundVolume(0.6);

    updateSoundSettingUI();

    playSound("decide");
  });


document
  .getElementById("sound-large-button")
  ?.addEventListener("click", () => {

    setSoundVolume(1.0);

    updateSoundSettingUI();

    playSound("decide");
  });


/*
 * 設定画面を開いたときに現在の設定を表示
 */
updateSoundSettingUI();


/* =========================================================
   初期化
========================================================= */

updateDailyDisplay();
updateMenuTodaySummary();

showScreen("menu");
