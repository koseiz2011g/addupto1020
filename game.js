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
  settings: document.getElementById("settings-screen"),
  versusMenu: document.getElementById("versus-menu-screen"),
  battleTest: document.getElementById("battle-test-screen"),
  battleResult: document.getElementById("battle-result-screen")
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
    showScreen("versusMenu");
  });

  
/* 対戦メニューからゲームスタート */
document.getElementById("battle-start-button")
  .addEventListener("click", () => {
    console.log("対戦開始ボタンが押されました");
    console.log("battleGame:", typeof battleGame);
    startBattleGame();
    showScreen("battleTest");
  });

/* 対戦メニューからメインメニューへ戻る */
document.getElementById("versus-menu-back-button")
  .addEventListener("click", () => {
    showScreen("menu");
  });


/* 対戦終了の確認ポップアップ */
const battleExitOverlay =
  document.getElementById("battle-exit-overlay");

document.querySelector(".battle-menu-button")
  .addEventListener("click", () => {
    battleExitOverlay.classList.remove("hidden");
  });

/* キャンセル：対戦を続ける */
document.getElementById("battle-exit-cancel")
  .addEventListener("click", () => {
    battleExitOverlay.classList.add("hidden");
  });

/* OK：対戦メニューへ戻る */
document.getElementById("battle-exit-ok")
  .addEventListener("click", () => {
    battleExitOverlay.classList.add("hidden");
    showScreen("versusMenu");
  });

  
/* 対戦結果画面：メニューへ */
document.getElementById("battle-result-menu")
  .addEventListener("click", () => {
    showScreen("menu");
  });

/* 対戦結果画面：もう一度対戦 */
document.getElementById("battle-result-replay")
  .addEventListener("click", () => {
    startBattleGame();
    showScreen("battleTest");
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
   2人対戦ゲーム状態
========================================================= */

const battleGame = {

  inProgress: false,

  /*
   * 共有山札
   */
  deck: [],

  /*
   * 共有場札
   */
  field: [],

  /*
   * 共有墓地
   */
  graveyard: [],

    /*
   * 決定対象として選択したセットの場札番号
   * 最大2セット
   */
  selectedSets: [],

  /*
   * プレイヤー
   */
  players: [
    {
      hand: []
    },
    {
      hand: []
    }
  ],

  /*
   * 現在の手番
   * 0 = 左プレイヤー
   * 1 = 右プレイヤー
   */
  currentPlayer: 0,

  /*
   * ターン数
   */
  turn: 1,

  /*
   * ドラッグ中のカード
   */
  dragging: null,

  /*
   * 山札が0になった後の
   * 最終ターン判定
   */
  lastTurn: false,

  hasDrawn: false,

  isPassing: false,

  /*
   * 最初のプレイヤーが
   * 初回ターンで手札0枚になった場合
   */
  firstPlayerCleared: false
};

/* =========================================================
   2人対戦：カード作成
========================================================= */

function createBattleDeck() {

  const suits = [
    { symbol: "♠", color: "black" },
    { symbol: "♣", color: "black" },
    { symbol: "♥", color: "red" },
    { symbol: "♦", color: "red" }
  ];

  const deck = [];

  suits.forEach(suit => {

    for (let value = 1; value <= 10; value++) {

      deck.push({
        value,
        suit: suit.symbol,
        color: suit.color
      });

    }

  });

  return deck;
}


/* =========================================================
   2人対戦：シャッフル
========================================================= */

function shuffleBattleDeck(deck) {

  for (let i = deck.length - 1; i > 0; i--) {

    const j =
      Math.floor(Math.random() * (i + 1));

    [deck[i], deck[j]] =
      [deck[j], deck[i]];
  }

  return deck;
}


/* =========================================================
   2人対戦：ゲーム開始
========================================================= */

function startBattleGame() {

  /*
   * 40枚を作ってシャッフル
   */
  const deck =
    shuffleBattleDeck(
      createBattleDeck()
    );


  /*
   * ゲーム状態を初期化
   */
  battleGame.deck = deck;

  battleGame.field = [];

  battleGame.graveyard = [];

    battleGame.selectedSets = [];

  battleGame.players[0].hand = [];

  battleGame.players[1].hand = [];

  battleGame.currentPlayer = 0;

  battleGame.hasDrawn = false;

  battleGame.turn = 1;

  battleGame.dragging = null;

  battleGame.lastTurn = false;

  battleGame.firstPlayerCleared = false;

  battleGame.inProgress = true;


  /*
   * 場札4枚
   */
  for (let i = 0; i < 4; i++) {

    const card =
      battleGame.deck.pop();

    battleGame.field.push({
      base: card,
      stack: []
    });
  }


  /*
   * プレイヤー1に5枚
   */
  for (let i = 0; i < 5; i++) {

    battleGame.players[0].hand.push(
      battleGame.deck.pop()
    );
  }


  /*
   * プレイヤー2に5枚
   */
  for (let i = 0; i < 5; i++) {

    battleGame.players[1].hand.push(
      battleGame.deck.pop()
    );
  }

  


  renderBattle();
}


/* =========================================================
   2人対戦：場札の合計
========================================================= */

function getBattleStackSum(fieldIndex) {

  const field =
    battleGame.field[fieldIndex];

  if (!field) {
    return 0;
  }

  return field.base.value +
    field.stack.reduce(
      (sum, card) =>
        sum + card.value,
      0
    );
}

function getBattleCardHeight() {

  const layout =
    document.querySelector(
      "#battle-test-screen .battle-horizontal-layout"
    );

  if (!layout) {
    return 80;
  }

  const height =
    parseFloat(
      getComputedStyle(layout)
        .getPropertyValue(
          "--battle-card-height"
        )
    );

  if (!Number.isFinite(height)) {
    return 80;
  }

  return height;
}


function addBattleCardToField(
  playerIndex,
  handIndex,
  fieldIndex
) {

  /*
   * 現在の手番でなければ置けない
   */
  if (
    battleGame.currentPlayer !==
    playerIndex
  ) {
    return;
  }

  const hand =
    battleGame.players[
      playerIndex
    ].hand;

  const field =
    battleGame.field[fieldIndex];

  if (!field) {
    return;
  }

  const card =
    hand[handIndex];

  if (!card) {
    return;
  }

  /*
   * 現在の合計
   */
    const current =
    getBattleStackSum(
      fieldIndex
    );

  const next =
    current + card.value;

  /*
   * 手札から取り出す
   */
  hand.splice(
    handIndex,
    1
  );

  /*
   * 場札に重ねる
   */
  field.stack.push(card);

  /*
   * 効果音
   */
  playSound("place");

  /*
   * 画面更新
   */
  renderBattle();
}


function addBattleStackDragEvents(
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
      if (
        !battleGame.inProgress ||
        battleGame.dragging
      ) {
        return;
      }

      event.preventDefault();

      document
  .querySelectorAll(
    "#battle-test-screen .battle-hand"
  )
  .forEach(hand => {
    hand.classList.remove(
      "battle-hand-target-valid"
    );
  });

      const rect =
        element.getBoundingClientRect();

      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;

      dragging = true;

      element.setPointerCapture(
        event.pointerId
      );

      element.classList.add("dragging");

      element.style.position = "fixed";
      element.style.left = `${rect.left}px`;
      element.style.top = `${rect.top}px`;
      element.style.width = `${rect.width}px`;
      element.style.height = `${rect.height}px`;
      element.style.zIndex = "1000";

      battleGame.dragging = {
    type: "stack",
    fieldIndex,
    stackIndex,
    card:
    battleGame.field[fieldIndex]
      .stack[stackIndex],
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

    // 移動先のカード置き場を光らせ、矢印を表示する
    highlightBattleStackDropTargets(
  event.clientX,
  event.clientY,
  fieldIndex,
  stackIndex
);

highlightBattleHandDropTarget(
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

      element.classList.remove("dragging");

      document
  .querySelectorAll(
    "#battle-test-screen .battle-hand"
  )
  .forEach(hand => {
    hand.classList.remove(
      "battle-hand-target-valid"
    );
  });

      const playerIndex =
        battleGame.currentPlayer;

      const handAreas =
        document.querySelectorAll(
          "#battle-test-screen .battle-hand"
        );

      const handArea =
        handAreas[playerIndex];

      let moved = false;

      // ① 自分の手札へ戻す
      if (handArea) {
        const rect =
          handArea.getBoundingClientRect();

        const insideHand =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        if (insideHand) {
          const field =
            battleGame.field[fieldIndex];

          if (
            field &&
            field.stack[stackIndex]
          ) {
            const card =
              field.stack.splice(
                stackIndex,
                1
              )[0];

            battleGame.players[
              playerIndex
            ].hand.push(card);

            playSound("place");
            moved = true;
          }
        }
      }

      // ② 手札でなければ、別の場札への移動を判定
      if (!moved) {
        const target =
          getBattleFieldAtPoint(
            event.clientX,
            event.clientY
          );

        if (
          target !== -1 &&
          target !== fieldIndex
        ) {
          const source =
            battleGame.field[fieldIndex];

          const destination =
            battleGame.field[target];

          if (
            source &&
            destination &&
            source.stack[stackIndex]
          ) {
            const card =
              source.stack.splice(
                stackIndex,
                1
              )[0];

            destination.stack.push(card);

            playSound("place");
            moved = true;
          }
        }
      }

      // ③ ドラッグ表示を解除して再描画
      battleGame.dragging = null;

      renderBattle();
    }
  );

  element.addEventListener(
    "pointercancel",
    () => {
      if (!dragging) {
        return;
      }

      dragging = false;

      element.classList.remove("dragging");

      document
  .querySelectorAll(
    "#battle-test-screen .battle-hand"
  )
  .forEach(hand => {
    hand.classList.remove(
      "battle-hand-target-valid"
    );
  });

      battleGame.dragging = null;

      renderBattle();
    }
  );
}


/* =========================================================
   2人対戦：場札の位置判定
========================================================= */


function getBattleFieldAtPoint(x, y) {
  const fieldArea = document.querySelector(
    "#battle-test-screen .battle-field"
  );

  if (!fieldArea) {
    return -1;
  }

  const slots = Array.from(
    fieldArea.querySelectorAll(".battle-field-slot")
  );

  // 指の位置にある場札を探す
  // 複数の判定範囲が重なった場合は、
  // 実際に指が入っているスロット本体を優先する
  for (let i = 0; i < slots.length; i++) {
    const rect = slots[i].getBoundingClientRect();

    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      return i;
    }
  }

  // スロット本体に入っていない場合は、
  // 重なったカード部分も判定対象にする
  for (let i = 0; i < slots.length; i++) {
    const rect = slots[i].getBoundingClientRect();
    const bottom =
      rect.bottom + getBattleCardHeight() * 3;

    if (
      x >= rect.left &&
      x <= rect.right &&
      y > rect.bottom &&
      y <= bottom
    ) {
      return i;
    }
  }

  return -1;
}



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
    if (!screen) return;

    screen.classList.remove("active");
    screen.classList.add("hidden");
  });

  const targetScreen = screens[name];

  if (!targetScreen) {
    console.error("画面が見つかりません:", name);
    return;
  }

  targetScreen.classList.remove("hidden");
  targetScreen.classList.add("active");
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
   ひとり用・2人用で共通利用
========================================================= */

function addHandDragEvents(
  element,
  handIndex,
  options = {}
) {

  /*
   * デフォルトは現在のひとり用
   *
   * 2人用では後から、
   * 「どの手札か」「どの場札か」などを
   * options で差し替える。
   */

  const getHand =
    options.getHand ||
    (() => game.hand);

  const isActive =
    options.isActive ||
    (() => game.inProgress);

  const getDraggingState =
    options.getDraggingState ||
    (() => game);

  const highlightTargets =
    options.highlightDropTargets ||
    highlightDropTargets;

  const clearTargets =
    options.clearDropTargets ||
    clearDropTargets;

  const getFieldAt =
    options.getFieldAtPoint ||
    getFieldAtPoint;

  const addCard =
    options.addCardToField ||
    addCardToField;


  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;


  element.addEventListener(
    "pointerdown",
    event => {

      if (!isActive()) {
        return;
      }

      if (
        graveyardOverlay.classList.contains("hidden") === false
      ) {
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


      /*
       * 現在の手札を取得
       */
      const hand =
        getHand();

      const card =
        hand[handIndex];

      /*
       * ドラッグ中の情報
       */
      const draggingState =
        getDraggingState();

      draggingState.dragging = {
        type: "hand",
        card,
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


      /*
       * ドロップ可能な場札を強調
       */
      highlightTargets(
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

      clearTargets();

      const target =
        getFieldAt(
          event.clientX,
          event.clientY
        );

      element.classList.remove("dragging");

      element.style.left = "";
      element.style.top = "";
      element.style.width = "";
      element.style.height = "";


      /*
       * 有効な場札にドロップ
       */
      if (target !== -1) {

        addCard(
          handIndex,
          target
        );
      }


      const draggingState =
        getDraggingState();

      draggingState.dragging = null;

      renderAll();
    }
  );


  element.addEventListener(
    "pointercancel",
    () => {

      dragging = false;

      clearTargets();

      element.classList.remove("dragging");

      element.style.left = "";
      element.style.top = "";
      element.style.width = "";
      element.style.height = "";

      const draggingState =
        getDraggingState();

      draggingState.dragging = null;

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

    highlightBattleStackDropTargets(
      event.clientX,
      event.clientY,
      fieldIndex,
      stackIndex
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
   ひとり用・2人用で共通利用
========================================================= */

function addCardToField(
  handIndex,
  fieldIndex,
  options = {}
) {

  /*
   * デフォルトは現在のひとり用
   */

  const getHand =
    options.getHand ||
    (() => game.hand);

  const getField =
    options.getField ||
    (index => game.field[index]);

  const getSum =
    options.getStackSum ||
    getStackSum;


  /*
   * 手札を取得
   */

  const hand =
    getHand();

  if (
    handIndex < 0 ||
    handIndex >= hand.length
  ) {
    return;
  }


  /*
   * 場札を取得
   */

  const field =
    getField(fieldIndex);

  if (!field) {
    return;
  }


  /*
   * 20になっているセットには追加できない
   */

  const current =
    getSum(fieldIndex);

  if (current >= 20) {
    return;
  }


  /*
   * 手札からカードを取り出す
   */

  const card =
    hand.splice(handIndex, 1)[0];

  if (!card) {
    return;
  }


  /*
   * 場札のセットへ追加
   */

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
   ひとり用・2人用で共通利用
========================================================= */

function getFieldAtPoint(
  x,
  y,
  fieldAreaElement = fieldArea,
  slotSelector = ".field-slot"
) {
  const slots =
    fieldAreaElement.querySelectorAll(
      slotSelector
    );

  for (let i = 0; i < slots.length; i++) {

    const rect =
      slots[i].getBoundingClientRect();

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
   ひとり用・2人用で共通利用
========================================================= */

function highlightDropTargets(
  x,
  y,
  options = {}
) {
  const targetFieldArea =
    options.fieldArea ||
    fieldArea;

  const getField =
    options.getField ||
    (index => game.field[index]);

  const getSum =
    options.getStackSum ||
    getStackSum;

  const slotSelector =
    options.slotSelector ||
    ".field-slot";

  clearDropTargets(targetFieldArea);

  const slots =
    targetFieldArea.querySelectorAll(
      slotSelector
    );

  slots.forEach((slot, index) => {

    const rect =
      slot.getBoundingClientRect();

    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom +
        getCardWidth() * 5
    ) {

      const field =
        getField(index);

      if (!field) {
        return;
      }

      const total =
        getSum(index);

      if (total < 20) {
        slot.classList.add(
          "target-valid"
        );
      }
    }
  });
}


/* =========================================================
   ドロップ先の強調を解除
========================================================= */

function clearDropTargets(
  targetFieldArea = fieldArea
) {

  targetFieldArea
    .querySelectorAll(".target-valid")
    .forEach(element => {

      element.classList.remove(
        "target-valid"
      );
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
    2人対戦：カード描画
 ========================================================= */

 function renderBattleCard(card, extraClass = "") {

   const element =
     createCardElement(
       card,
       extraClass
     );

   return element;
 }


// 対戦モードの墓地を表示
function renderBattleGraveyard() {
  const grave = document.querySelector(
    "#battle-test-screen .battle-grave-card"
  );

  if (!grave) return;

  if (battleGame.graveyard.length === 0) {
    grave.textContent = "－";
    grave.className = "battle-grave-card";
    return;
  }

  const card =
    battleGame.graveyard[battleGame.graveyard.length - 1];

  grave.textContent = `${card.value}${card.suit}`;
  grave.className =
    `battle-grave-card ${
      card.color === "red" ? "card-red" : "card-black"
    }`;
}



// 対戦モードの墓地一覧を開く
function openBattleGraveyard() {
  const overlay = document.getElementById(
    "battle-graveyard-overlay"
  );

  const history = document.getElementById(
    "battle-graveyard-history"
  );

  if (!overlay || !history) return;

  history.replaceChildren();

  if (battleGame.graveyard.length === 0) {
    const message = document.createElement("p");
    message.textContent = "墓地にカードはありません";
    history.appendChild(message);
  } else {
    battleGame.graveyard.forEach(card => {
      const element = document.createElement("div");

      element.className =
        `battle-grave-history-card ${
          card.color === "red" ? "card-red" : "card-black"
        }`;

      element.innerHTML = `
        <div>${card.value}</div>
        <div>${card.suit}</div>
      `;

      history.appendChild(element);
    });
  }

  overlay.classList.remove("hidden");
}

// 対戦モードの墓地一覧を閉じる
function closeBattleGraveyard() {
  const overlay = document.getElementById(
    "battle-graveyard-overlay"
  );

  if (overlay) {
    overlay.classList.add("hidden");
  }
}

 
function toggleBattleSetSelection(fieldIndex) {
  if (!battleGame.inProgress) {
    return;
  }

  const field = battleGame.field[fieldIndex];

  if (!field || field.stack.length === 0) {
    return;
  }

  const total =
    field.base.value +
    field.stack.reduce(
      (sum, card) => sum + card.value,
      0
    );

  // 合計が10または20でないセットは選択できない
  if (total !== 10 && total !== 20) {
    return;
  }

  const selectedIndex =
    battleGame.selectedSets.indexOf(fieldIndex);

  if (selectedIndex !== -1) {
    // 選択済みなら解除
    battleGame.selectedSets.splice(selectedIndex, 1);
  } else {
    // 最大2セットまで
    if (battleGame.selectedSets.length >= 2) {
      return;
    }

    battleGame.selectedSets.push(fieldIndex);
  }

  renderBattleField();
}


 /* =========================================================
    2人対戦：場札描画
 ========================================================= */

 function renderBattleField() {

   const battleField =
     document.querySelector(
       "#battle-test-screen .battle-field"
     );

   if (!battleField) {
     return;
   }

   battleField.innerHTML = "";

   battleGame.field.forEach(
     (field, fieldIndex) => {

       if (!field) {
         return;
       }

       const slot =
         document.createElement("div");

       slot.className =
         "battle-field-slot";

       if (battleGame.selectedSets.includes(fieldIndex)) {
         slot.classList.add("battle-set-selected");
       }

       /*
        * 場札本体
        */
       const base =
         renderBattleCard(
           field.base,
           "battle-field-card"
         );

       slot.appendChild(base);

       base.addEventListener("click", () => {
         toggleBattleSetSelection(fieldIndex);
         });


       /*
        * セット作成中のカード
        */
       const stack =
         document.createElement("div");

       stack.className =
         "battle-building-set";


       field.stack.forEach(
         (card, stackIndex) => {

           const element =
  renderBattleCard(
    card,
    "battle-set-card"
  );

element.style.top =
  `calc(var(--battle-card-height) * ${0.30 * (stackIndex + 1)})`;

element.style.zIndex =
  String(stackIndex + 2);

stack.appendChild(element);

addBattleStackDragEvents(
  element,
  fieldIndex,
  stackIndex
);
         }
       );


       if (field.stack.length > 0) {
         slot.appendChild(stack);
       }


       /*
        * 合計表示
        */
             if (field.stack.length > 0) {

        const total =
          field.base.value +
          field.stack.reduce(
            (sum, card) =>
              sum + card.value,
            0
          );

        const totalElement =
          document.createElement("div");

        totalElement.className =
          "battle-stack-total";

        if (total === 10 || total === 20) {

          totalElement.classList.add("valid");
          totalElement.textContent = total;

        } else if (total > 20) {

          totalElement.classList.add("over");
          totalElement.textContent = total;

        }

        slot.appendChild(totalElement);

      }


       battleField.appendChild(slot);
     }
   );
 }


 /* =========================================================
   2人対戦：手札描画
========================================================= */

function renderBattleHands() {

  const handAreas =
    document.querySelectorAll(
      "#battle-test-screen .battle-hand"
    );

  if (handAreas.length < 2) {
    return;
  }

  handAreas.forEach(
    (handArea, playerIndex) => {

      handArea.innerHTML = "";

      const hand =
        battleGame.players[
          playerIndex
        ].hand;

      hand.forEach(
        (card, handIndex) => {

          const element =
            renderBattleCard(
              card,
              "battle-hand-card"
            );

          handArea.appendChild(
            element
          );

          addHandDragEvents(
            element,
            handIndex,
            {
              getHand: () =>
                battleGame.players[
                  playerIndex
                ].hand,

              isActive: () =>
  battleGame.inProgress &&
  battleGame.currentPlayer === playerIndex &&
  battleGame.hasDrawn,

              getDraggingState: () =>
                battleGame,

            highlightDropTargets:
  (x, y) => {

    highlightBattleDropTargets(
      x,
      y,
      playerIndex
    );

  },

              clearDropTargets:
  clearBattleDropTargets,

              getFieldAtPoint:
  (x, y) => {

    return getBattleFieldAtPoint(
      x,
      y
    );
  },

              addCardToField:
                (index, fieldIndex) => {

                  addBattleCardToField(
                    playerIndex,
                    index,
                    fieldIndex
                  );
                }
            }
          );
        }
      );
    }
  );
}


/* =========================================================
   2人対戦：ドロップ可能な場札を光らせる
========================================================= */

function highlightBattleDropTargets(
  x,
  y,
  playerIndex
) {
  clearBattleDropTargets();

  const fieldArea =
    document.querySelector(
      "#battle-test-screen .battle-field"
    );

  if (!fieldArea) {
    return;
  }

  const dragging =
    battleGame.dragging;

  if (
    !dragging ||
    !dragging.card
  ) {
    return;
  }

  const fieldIndex =
    getBattleFieldAtPoint(x, y);

  if (fieldIndex === -1) {
    return;
  }

  const field =
    battleGame.field[fieldIndex];

  if (!field) {
    return;
  }

  const current =
    getBattleStackSum(fieldIndex);

  const next =
    current + dragging.card.value;

  

  const slots =
    fieldArea.querySelectorAll(
      ".battle-field-slot"
    );

  const slot =
    slots[fieldIndex];

  if (!slot) {
    return;
  }

  // 有効な場札を光らせる
  slot.classList.add(
    "battle-target-valid"
  );

  // ↓を表示
  const arrow =
    document.createElement("div");

  arrow.className =
    "battle-drop-arrow";

  arrow.textContent = "↓";

  slot.appendChild(arrow);
}

function highlightBattleStackDropTargets(
  x,
  y,
  sourceFieldIndex,
  stackIndex
) {
  clearBattleDropTargets();

  const fieldArea =
    document.querySelector(
      "#battle-test-screen .battle-field"
    );

  if (!fieldArea) return;

  const source =
    battleGame.field[sourceFieldIndex];

  if (
    !source ||
    !source.stack[stackIndex]
  ) {
    return;
  }

  const card =
    source.stack[stackIndex];

  const targetIndex =
    getBattleFieldAtPoint(x, y);

  if (targetIndex === -1) return;

  // 移動元自身は対象にしない
  if (targetIndex === sourceFieldIndex) {
    return;
  }

  const slots =
    fieldArea.querySelectorAll(
      ".battle-field-slot"
    );

  const slot = slots[targetIndex];

  if (!slot) return;

  // 移動先の合計を計算
  const current =
    getBattleStackSum(targetIndex);

  // 移動元から取り除いた後の合計を考慮
  const next = current + card.value;

  slot.classList.add(
    "battle-target-valid"
  );

  const arrow =
    document.createElement("div");

  arrow.className =
    "battle-drop-arrow";

  arrow.textContent = "↓";

  slot.appendChild(arrow);
}


function highlightBattleHandDropTarget(x, y) {
  const playerIndex = battleGame.currentPlayer;

  const handAreas = document.querySelectorAll(
    "#battle-test-screen .battle-hand"
  );

  const handArea = handAreas[playerIndex];

  if (!handArea) return;

  const rect = handArea.getBoundingClientRect();

  const insideHand =
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom;

  if (insideHand) {
    handArea.classList.add("battle-hand-target-valid");
  } else {
    handArea.classList.remove("battle-hand-target-valid");
  }
}

/* =========================================================
   2人対戦：ドロップ先表示を消す
========================================================= */

function clearBattleDropTargets() {

  const fieldArea =
    document.querySelector(
      "#battle-test-screen .battle-field"
    );

  if (!fieldArea) {
    return;
  }

  fieldArea
    .querySelectorAll(
      ".battle-target-valid"
    )
    .forEach(slot => {

      slot.classList.remove(
        "battle-target-valid"
      );
    });

  fieldArea
    .querySelectorAll(
      ".battle-drop-arrow"
    )
    .forEach(arrow => {

      arrow.remove();
    });
}

/* =========================================================
   2人対戦：そのカードを置いた後の合計
========================================================= */

function getBattleNextSum(
  fieldIndex,
  card
) {

  const current =
    getBattleStackSum(fieldIndex);

  if (!card) {
    return current;
  }

  return current + card.value;
}

/* =========================================================
    2人対戦：ターン表示
 ========================================================= */
function updateBattleTurnDisplay() {
  const turnDisplay = document.querySelector(
    "#battle-test-screen .battle-turn-display"
  );

  if (!turnDisplay) return;

  const playerNumber = battleGame.currentPlayer + 1;

  turnDisplay.textContent =
    `第${battleGame.turn}ターン　プレイヤー${playerNumber}の番`;
}



let battleTurnPopupTimer = null;

function showBattleTurnPopup(isLastTurn = false) {
  const popup = document.getElementById(
    "battle-turn-popup"
  );

  if (!popup) return;

  const playerNumber = battleGame.currentPlayer + 1;

  popup.textContent = isLastTurn
    ? `最終ターン\n第${battleGame.turn}ターン\nプレイヤー${playerNumber}の番`
    : `第${battleGame.turn}ターン\nプレイヤー${playerNumber}の番`;

  popup.classList.remove("show");

  // 連続して呼ばれた場合、前のタイマーを解除
  if (battleTurnPopupTimer !== null) {
    clearTimeout(battleTurnPopupTimer);
  }

  // 再表示時にもアニメーションが働くようにする
  void popup.offsetWidth;

  popup.classList.add("show");

  battleTurnPopupTimer = setTimeout(() => {
    popup.classList.remove("show");
    battleTurnPopupTimer = null;
  }, 1200);
}


 /* =========================================================
    2人対戦：画面全体
 ========================================================= */

function renderBattle() {
  renderBattleField();
  renderBattleHands();
  renderBattleControls();
  renderBattleGraveyard();
  updateBattleTurnDisplay();

  const deckCount = document.querySelector(
    "#battle-test-screen .battle-deck-count"
  );

  if (deckCount) {
    deckCount.textContent = battleGame.deck.length;
  }
}

// 対戦モードの墓地ボタン操作
document.addEventListener("DOMContentLoaded", () => {
  const graveButton = document.querySelector(
    "#battle-test-screen .battle-grave-card"
  );

  const closeButton = document.getElementById(
    "battle-close-graveyard-button"
  );

  if (graveButton) {
    graveButton.addEventListener("click", openBattleGraveyard);
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeBattleGraveyard);
  }
});


function renderBattleControls() {
  const areas = document.querySelectorAll(
    "#battle-test-screen .battle-player-area"
  );

  areas.forEach((area, playerIndex) => {
    const isActive =
      battleGame.inProgress &&
      battleGame.currentPlayer === playerIndex;

    const drawButton = area.querySelector(".battle-draw");
    const passButton = area.querySelector(".battle-pass");
    const confirmButton = area.querySelector(".battle-confirm");

    if (drawButton) {
      drawButton.style.display =
        isActive && !battleGame.hasDrawn ? "" : "none";
    }

    if (passButton) {
      passButton.style.display =
        isActive && battleGame.hasDrawn ? "" : "none";
    }

    if (confirmButton) {
      confirmButton.style.display =
        isActive && battleGame.hasDrawn ? "" : "none";
    }
  });
}


 
async function confirmBattleSets() {
  if (!battleGame.inProgress) return;

  const playerIndex = battleGame.currentPlayer;
  const hand = battleGame.players[playerIndex].hand;

  // 選択したセットを確認
  
const selected = [...battleGame.selectedSets];

if (selected.length === 0) {
  await showMessage(
    "セットの一番上のカードをタップしてください",
    1200
  );
  return;
}

if (selected.length > 2) {
  return;
}


  const setInfos = [];

  for (const fieldIndex of selected) {
    const field = battleGame.field[fieldIndex];
    if (!field || field.stack.length === 0) return;

    const total =
      field.base.value +
      field.stack.reduce((sum, card) => sum + card.value, 0);

    if (total !== 10 && total !== 20) return;

    setInfos.push({ fieldIndex, total });
  }

  // 決定音
  playSound("decide");

  // 完成したセットを順番に処理
  for (const setInfo of setInfos) {
    const field = battleGame.field[setInfo.fieldIndex];
    if (!field) continue;

    // 完成ポップアップと効果音
    await showMessage(`${setInfo.total}完成！`, 1000);

    // 場札と重ねたカードを墓地へ移動
    battleGame.graveyard.push(field.base);

    for (const card of field.stack) {
      battleGame.graveyard.push(card);
      playSound("grave");
      renderBattle();
      await wait(120);
    }

    // この場札を補充対象にする
    battleGame.field[setInfo.fieldIndex] = null;
    renderBattle();
    await wait(150);
  }

  battleGame.selectedSets = [];

  // 空いた場札を山札から補充
  for (let i = 0; i < battleGame.field.length; i++) {
    if (battleGame.field[i] !== null) continue;
    if (battleGame.deck.length === 0) break;

    const card = battleGame.deck.pop();
    if (card) {
      battleGame.field[i] = {
        base: card,
        stack: []
      };
      renderBattle();
      await wait(220);
    }
  }

  
  renderBattle();

  
  // 未完成のセットに残ったカードを手札に戻す
  battleGame.field.forEach(field => {
    if (!field || !field.stack || field.stack.length === 0) return;

    hand.push(...field.stack);
    field.stack = [];
  });

  battleGame.selectedSets = [];
  renderBattle();

  // 未完成カードを戻した後で勝利判定
  
if (hand.length === 0) {
  // プレイヤー1が最初のターンで上がった場合
  if (
    playerIndex === 0 &&
    battleGame.turn === 1 &&
    !battleGame.firstPlayerCleared
  ) {
    battleGame.firstPlayerCleared = true;

    await showMessage(
      "プレイヤー1が上がりました！プレイヤー2の挑戦です",
      1500
    );

    await endBattleTurn();
    return;
  }

  // プレイヤー1が最初のターンで上がり、
  // プレイヤー2も次のターンで上がった場合
  if (battleGame.firstPlayerCleared && playerIndex === 1) {
    showBattleResult(
  null,
  "両プレイヤーが最初のターンで上がったから"
);
return;
  }

  // 通常の勝利
  showBattleResult(
  playerIndex,
  "先に手札をなくしたから"
);
return;
}

await endBattleTurn();


}




function drawBattleCard(playerIndex, count = 1) {
  if (!battleGame.inProgress) return 0;
  if (playerIndex !== battleGame.currentPlayer) return 0;
  if (count === 1 && battleGame.hasDrawn) return 0;

  const hand = battleGame.players[playerIndex].hand;
  let drawn = 0;

  for (let i = 0; i < count; i++) {
    if (battleGame.deck.length === 0) break;

    const card = battleGame.deck.pop();
    if (!card) break;

    hand.push(card);
    drawn++;
  }

  // 山札がなくても、ドロー操作を完了した扱いにする
  if (count === 1) {
    battleGame.hasDrawn = true;
  }

  renderBattle();
  return drawn;
}



async function passBattleTurn() {
  if (!battleGame.inProgress || battleGame.isPassing) return;

  battleGame.isPassing = true;

  try {

  const playerIndex = battleGame.currentPlayer;

  // パスを選択したことを表示
  await showMessage("パスが選択されました", 700);

  // ペナルティを表示
  await showMessage("ペナルティ", 700);

  // 引く枚数を決める（最大2枚）
  const drawCount = Math.min(2, battleGame.deck.length);

  if (drawCount === 2) {
    playSound("penalty");
    await showMessage("2ドロー", 900);
  } else if (drawCount === 1) {
    playSound("penalty");
    await showMessage(
      "山札が1枚しかないので、1ドロー",
      1000
    );
  } else {
    await showMessage(
      "山札がないので、0ドロー",
      1000
    );
  }

  // ポップアップ終了後にまとめてドロー
  if (drawCount > 0) {
    drawBattleCard(playerIndex, drawCount);
    await wait(250);
  }

  // ターンを終了
   await endBattleTurn();
  } finally {
    battleGame.isPassing = false;
  }
}




function showBattleResult(winnerIndex, reason) {
  battleGame.inProgress = false;

  const battleScreen = document.getElementById("battle-test-screen");
  const resultScreen = document.getElementById("battle-result-screen");

  if (!battleScreen || !resultScreen) {
    console.error("対戦結果画面のHTMLが見つかりません。");
    return;
  }

  const hand1 = battleGame.players[0].hand.length;
  const hand2 = battleGame.players[1].hand.length;

  document.getElementById("battle-result-turn").textContent =
    battleGame.turn;
  document.getElementById("battle-result-hand1").textContent = hand1;
  document.getElementById("battle-result-hand2").textContent = hand2;
  document.getElementById("battle-result-reason-text").textContent =
    reason;

  const outcome1 = document.getElementById("battle-result-outcome1");
  const outcome2 = document.getElementById("battle-result-outcome2");

  outcome1.className = "battle-result-outcome";
  outcome2.className = "battle-result-outcome";

  if (winnerIndex === null) {
    outcome1.textContent = "引き分け！";
    outcome2.textContent = "引き分け！";
    outcome1.classList.add("draw");
    outcome2.classList.add("draw");
  } else {
    const winner = winnerIndex === 0 ? outcome1 : outcome2;
    const loser = winnerIndex === 0 ? outcome2 : outcome1;

    winner.textContent = "勝利！";
    winner.classList.add("win");

    loser.textContent = "敗北…";
    loser.classList.add("lose");
  }

  renderBattle();

  showScreen("battleResult");
}


async function endBattleTurn() {
  if (!battleGame.inProgress) return;

  // 未完成のカードを現在のプレイヤーの手札に戻す
  const hand = battleGame.players[battleGame.currentPlayer].hand;

  battleGame.field.forEach(field => {
    if (!field || !field.stack || field.stack.length === 0) return;

    hand.push(...field.stack);
    field.stack = [];
  });

  battleGame.selectedSets = [];
  renderBattle();

  // 先攻が最初のターンで上がった場合の特別ルール
  if (
    battleGame.firstPlayerCleared &&
    battleGame.currentPlayer === 1
  ) {
    showBattleResult(
  0,
  "プレイヤー1が先に上がり、プレイヤー2が上がれなかったから"
);
return;
  }

  
  // 最終ターンが終了した場合、手札の枚数で判定
  if (battleGame.lastTurn) {
    const hand1 = battleGame.players[0].hand.length;
    const hand2 = battleGame.players[1].hand.length;

    if (hand1 < hand2) {
      showBattleResult(
        0,
        "残り枚数が少なかったから"
      );
    } else if (hand2 < hand1) {
      showBattleResult(
        1,
        "残り枚数が少なかったから"
      );
    } else {
      showBattleResult(
        null,
        "残り枚数が同じだったから"
      );
    }

    return;
  }


  // 次のプレイヤーへ交代
  battleGame.currentPlayer = 1 - battleGame.currentPlayer;
  battleGame.turn++;
  battleGame.hasDrawn = false;

  // 山札が0枚なら、今始まるターンを最終ターンにする
  
  // 山札が0枚なら、今始まるターンを最終ターンにする
  if (battleGame.deck.length === 0) {
    battleGame.lastTurn = true;
    renderBattle();
    showBattleTurnPopup(true);
    await showMessage("最終ターンです", 1000);
    renderBattle();
    return;
  }

  renderBattle();
  showBattleTurnPopup();

}







document
  .querySelectorAll("#battle-test-screen .battle-player-area")
  .forEach((playerArea, playerIndex) => {
    const drawButton = playerArea.querySelector(".battle-draw");
    const passButton = playerArea.querySelector(".battle-pass");
    const confirmButton = playerArea.querySelector(".battle-confirm");

    
if (drawButton) {
  drawButton.addEventListener("click", async () => {
    if (battleGame.currentPlayer !== playerIndex) return;

    const drawn = drawBattleCard(playerIndex, 1);

    if (drawn === 0 && battleGame.inProgress) {
      await showMessage("0ドロー", 800);
    }
  });
}


    if (passButton) {
      passButton.addEventListener("click", () => {
        if (battleGame.currentPlayer !== playerIndex) return;
        passBattleTurn();
      });
    }

    if (confirmButton) {
      confirmButton.addEventListener("click", () => {
        if (battleGame.currentPlayer !== playerIndex) return;
        confirmBattleSets();
      });
    }
  });




/* =========================================================
   初期化
========================================================= */

updateDailyDisplay();
updateMenuTodaySummary();

showScreen("menu");
