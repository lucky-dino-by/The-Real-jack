"use strict";

const CARD_IMAGE_PATH = "../Card Images/";
const STARTING_CASH = 200;
const STARTING_SHOP_CASH_TARGET = 2500;
const SHOP_TARGET_SCALE = 1.65;
const SHOP_TARGET_ROUNDING = 250;
const DEALER_STAND_TOTAL = 17;
const AUTO_DEAL_DELAY = 1500;
const TOP_CREDIT_HIGH_SCORE_KEY = "jack-top-credit-high-score";
const BASE_JOKERS_IN_DECK = 2;
const JOKERS_PER_BOOST = 2;

const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const game = {
  cash: STARTING_CASH,
  credits: 0,
  currentBet: 0,
  betChips: [],
  deck: [],
  playerHand: [],
  dealerHand: [],
  npcHands: [],
  dealerHoleCardHidden: true,
  roundActive: false,
  roundComplete: false,
  showIntro: true,
  gameOver: false,
  shopOpen: false,
  moneyEarnedSinceShop: 0,
  nextShopCashTarget: STARTING_SHOP_CASH_TARGET,
  topCreditScore: 0,
  topCreditHighScore: getStoredTopCreditHighScore(),
  shopChoices: [],
  stats: {
    handsPlayed: 0,
    moneyEarned: 0,
    moneyLost: 0,
    handsWon: 0,
    charlies: 0,
    blackjacks: 0,
    jokers: 0,
  },
  ownedUpgrades: {
    autoDeal: false,
    programmableBot: false,
    speedHacks: false,
    comboBoost: 0,
    creditDrip: false,
    charlieTraining: false,
    jokerBoost: 0,
    extraPlayers: 0,
  },
  automation: {
    autoDeal: false,
    autoBetSize: 50,
    programmableBot: false,
    standTarget: 17,
  },
  timers: [],
};

const elements = {
  table: document.querySelector(".table"),
  tableCenter: document.querySelector(".table-center"),
  cash: document.querySelector("#cash"),
  credits: document.querySelector("#credits"),
  hudCurrentBet: document.querySelector("#hud-current-bet"),
  cashUntilShop: document.querySelector("#cash-until-shop"),
  shopProgressFill: document.querySelector("#shop-progress-fill"),
  bankroll: document.querySelector("#bankroll"),
  tableCredits: document.querySelector("#table-credits"),
  currentBet: document.querySelector("#current-bet"),
  comboBanner: document.querySelector("#combo-banner"),
  message: document.querySelector("#message"),
  dealerCards: document.querySelector("#dealer-cards"),
  npcArea: document.querySelector("#npc-area"),
  playerCards: document.querySelector("#player-cards"),
  dealerScore: document.querySelector("#dealer-score"),
  playerScore: document.querySelector("#player-score"),
  betPile: document.querySelector("#bet-pile"),
  opponentBetPiles: document.querySelector("#opponent-bet-piles"),
  chipButtons: document.querySelectorAll(".chip-button"),
  clearBetButton: document.querySelector("#clear-bet-button"),
  dealButton: document.querySelector("#deal-button"),
  hitButton: document.querySelector("#hit-button"),
  standButton: document.querySelector("#stand-button"),
  newRoundButton: document.querySelector("#new-round-button"),
  shopModal: document.querySelector("#shop-modal"),
  shopCreditCount: document.querySelector("#shop-credit-count"),
  shopOptions: document.querySelector("#shop-options"),
  closeShopButton: document.querySelector("#close-shop-button"),
  gameOverScreen: document.querySelector("#game-over-screen"),
  gameOverSummary: document.querySelector("#game-over-summary"),
  restartRunButton: document.querySelector("#restart-run-button"),
  automationPanel: document.querySelector("#automation-panel"),
  autoDealControl: document.querySelector("#auto-deal-control"),
  autoBetControl: document.querySelector("#auto-bet-control"),
  autoDealToggle: document.querySelector("#auto-deal-toggle"),
  autoBetSize: document.querySelector("#auto-bet-size"),
  botControl: document.querySelector("#bot-control"),
  standTargetControl: document.querySelector("#stand-target-control"),
  botToggle: document.querySelector("#bot-toggle"),
  standTarget: document.querySelector("#stand-target"),
  statHandsPlayed: document.querySelector("#stat-hands-played"),
  statMoneyEarned: document.querySelector("#stat-money-earned"),
  statMoneyLost: document.querySelector("#stat-money-lost"),
  statWinPercent: document.querySelector("#stat-win-percent"),
  statCharlies: document.querySelector("#stat-charlies"),
  statBlackjacks: document.querySelector("#stat-blackjacks"),
  statJokers: document.querySelector("#stat-jokers"),
  statTopCreditScore: document.querySelector("#stat-top-credit-score"),
  statTopCreditHigh: document.querySelector("#stat-top-credit-high"),
  powerupList: document.querySelector("#powerup-list"),
};

const shopPool = [
  {
    id: "autoDeal",
    name: "Auto-Deal",
    cost: 3,
    description: "Unlocks a toggle and Auto-Bet Size input. Deals the next hand after 1.5 seconds.",
    available: () => !game.ownedUpgrades.autoDeal,
    buy: () => {
      game.ownedUpgrades.autoDeal = true;
      game.automation.autoDeal = true;
    },
  },
  {
    id: "programmableBot",
    name: "Programmable Bot",
    cost: 4,
    description: "Unlocks a bot toggle and Stand Target input. The bot hits until your target.",
    available: () => !game.ownedUpgrades.programmableBot,
    buy: () => {
      game.ownedUpgrades.programmableBot = true;
      game.automation.programmableBot = true;
    },
  },
  {
    id: "speedHacks",
    name: "Speed Hacks",
    cost: 3,
    description: "Speeds up card, chip, message, and transition animations.",
    available: () => !game.ownedUpgrades.speedHacks,
    buy: () => {
      game.ownedUpgrades.speedHacks = true;
      document.body.classList.add("speed-mode");
    },
  },
  {
    id: "comboBoost",
    name: "Combo Upgrade",
    cost: 5,
    description: "Raises combo Cash multipliers. Exact 21 becomes stronger, and Charlie scales too.",
    available: () => true,
    buy: () => {
      game.ownedUpgrades.comboBoost += 1;
    },
  },
  {
    id: "creditDrip",
    name: "Credit Drip",
    cost: 4,
    description: "Adds +1 Credit to every future winning hand.",
    available: () => !game.ownedUpgrades.creditDrip,
    buy: () => {
      game.ownedUpgrades.creditDrip = true;
    },
  },
  {
    id: "charlieTraining",
    name: "Charlie Training",
    cost: 4,
    description: "Charlie now triggers at 4+ cards and earns +1 bonus Credit.",
    available: () => !game.ownedUpgrades.charlieTraining,
    buy: () => {
      game.ownedUpgrades.charlieTraining = true;
    },
  },
  {
    id: "jokerBoost",
    name: "Joker Magnet",
    cost: 4,
    description: "Adds more Jokers to future decks, making Joker support hands more common.",
    available: () => true,
    buy: () => {
      game.ownedUpgrades.jokerBoost += 1;
    },
  },
  {
    id: "extraPlayer",
    name: "Add Player",
    cost: 6,
    description: "Adds another matching player. They play like the dealer, cannot draw Jokers, and match your chips.",
    available: () => true,
    buy: () => {
      game.ownedUpgrades.extraPlayers += 1;
    },
  },
];

function createDeck() {
  const standardCards = suits.flatMap((suit) =>
    ranks.map((rank) => ({
      rank,
      suit,
      value: getCardValue(rank),
      imageName: getCardImageName(rank, suit),
    })),
  );
  const jokerCount = BASE_JOKERS_IN_DECK + game.ownedUpgrades.jokerBoost * JOKERS_PER_BOOST;
  const jokers = Array.from({ length: jokerCount }, (_, index) => ({
    rank: "Joker",
    suit: index % 2 === 0 ? "Black" : "Red",
    value: 0,
    imageName: index % 2 === 0 ? "black_joker.png" : "red_joker.png",
    isJoker: true,
  }));

  return [...standardCards, ...jokers];
}

function getCardImageName(rank, suit) {
  const suitName = suit.toLowerCase();
  const faceCardNames = { J: "jack", Q: "queen", K: "king" };

  if (rank === "A") {
    return `ace_of_${suitName}.png`;
  }

  if (faceCardNames[rank]) {
    return `${faceCardNames[rank]}_of_${suitName}2.png`;
  }

  return `${rank}_of_${suitName}.png`;
}

function getCardValue(rank) {
  if (rank === "A") {
    return 11;
  }

  if (["J", "Q", "K"].includes(rank)) {
    return 10;
  }

  return Number(rank);
}

function shuffleDeck(deck) {
  const shuffledDeck = [...deck];

  for (let index = shuffledDeck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledDeck[index], shuffledDeck[swapIndex]] = [shuffledDeck[swapIndex], shuffledDeck[index]];
  }

  return shuffledDeck;
}

function calculateHandTotal(hand) {
  let total = hand.reduce((sum, card) => sum + card.value, 0);
  let aces = hand.filter((card) => card.rank === "A").length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function drawCard({ allowJoker = true } = {}) {
  if (game.deck.length === 0) {
    game.deck = shuffleDeck(createDeck());
  }

  let attempts = game.deck.length;

  while (attempts > 0) {
    const card = game.deck.pop();

    if (allowJoker || !card.isJoker) {
      return card;
    }

    game.deck.unshift(card);
    attempts -= 1;
  }

  game.deck = shuffleDeck(createDeck().filter((card) => !card.isJoker));
  return game.deck.pop();
}

function formatMoney(amount) {
  return `$${amount.toLocaleString()}`;
}

function getStoredTopCreditHighScore() {
  const storedScore = window.localStorage.getItem(TOP_CREDIT_HIGH_SCORE_KEY);
  return Number(storedScore) || 0;
}

function saveTopCreditHighScore(score) {
  window.localStorage.setItem(TOP_CREDIT_HIGH_SCORE_KEY, String(score));
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cardImageSrc(card) {
  return `${CARD_IMAGE_PATH}${card.imageName}`;
}

function handHasJoker(hand) {
  return hand.some((card) => card.isJoker);
}

function replayAnimation(element, animationClass) {
  element.classList.remove(animationClass);
  void element.offsetWidth;
  element.classList.add(animationClass);
}

function updateTextWithScroll(element, nextText) {
  if (element.textContent === nextText) {
    return;
  }

  element.textContent = nextText;
  replayAnimation(element, "number-scroll");
}

function queueTimer(callback, delay) {
  const adjustedDelay = game.ownedUpgrades.speedHacks ? Math.max(180, delay * 0.45) : delay;
  const timer = window.setTimeout(() => {
    game.timers = game.timers.filter((timerId) => timerId !== timer);
    callback();
  }, adjustedDelay);

  game.timers.push(timer);
  return timer;
}

function clearTimers() {
  game.timers.forEach((timer) => window.clearTimeout(timer));
  game.timers = [];
}

function renderChipRack() {
  elements.chipButtons.forEach((button) => {
    const denomination = Number(button.dataset.chip);
    const label = document.createElement("span");

    label.className = "chip-value";
    label.textContent = `$${denomination}`;
    button.replaceChildren(label);
  });
}

function renderBetPile() {
  elements.betPile.replaceChildren();

  game.betChips.forEach((denomination, index) => {
    const chip = document.createElement("span");
    const layer = index % 14;

    chip.className = "pile-chip";
    chip.dataset.chip = String(denomination);
    chip.textContent = `$${denomination}`;
    chip.style.setProperty("--pile-x", `${(layer % 5) * 8 - 16}px`);
    chip.style.setProperty("--pile-y", `${Math.floor(layer / 5) * -9 - index * 0.7}px`);
    chip.style.setProperty("--pile-r", `${(index % 6) * 7 - 17}deg`);
    chip.style.setProperty("--pile-delay", `${Math.min(index * 24, 240)}ms`);

    elements.betPile.append(chip);
  });
}

function createChipStack(container, labelText) {
  const label = document.createElement("span");

  label.className = "opponent-pile-label";
  label.textContent = labelText;
  container.append(label);

  game.betChips.forEach((denomination, index) => {
    const chip = document.createElement("span");
    const layer = index % 14;

    chip.className = "pile-chip opponent-chip";
    chip.dataset.chip = String(denomination);
    chip.textContent = `$${denomination}`;
    chip.style.setProperty("--pile-x", `${(layer % 5) * 8 - 16}px`);
    chip.style.setProperty("--pile-y", `${Math.floor(layer / 5) * -9 - index * 0.7}px`);
    chip.style.setProperty("--pile-r", `${(index % 6) * 7 - 17}deg`);
    chip.style.setProperty("--pile-delay", `${Math.min(index * 18, 180)}ms`);
    container.append(chip);
  });
}

function renderOpponentBetPiles() {
  elements.opponentBetPiles.replaceChildren();

  if (game.betChips.length === 0) {
    return;
  }

  const dealerPile = document.createElement("div");
  dealerPile.className = "opponent-pile";
  createChipStack(dealerPile, "Dealer Match");
  elements.opponentBetPiles.append(dealerPile);

  game.npcHands.forEach((_, index) => {
    const pile = document.createElement("div");
    pile.className = "opponent-pile";
    createChipStack(pile, `P${index + 2} Match`);
    elements.opponentBetPiles.append(pile);
  });
}

function renderHand(container, hand, hideSecondCard = false) {
  container.replaceChildren();

  hand.forEach((card, index) => {
    const isHiddenHoleCard = hideSecondCard && index === 1;

    if (isHiddenHoleCard) {
      const cardBack = document.createElement("div");

      cardBack.className = "card card-back";
      cardBack.setAttribute("aria-label", "Hidden dealer card");
      cardBack.style.animationDelay = `${index * 90}ms`;
      container.append(cardBack);
      return;
    }

    const cardImage = document.createElement("img");

    cardImage.className = "card";
    cardImage.src = cardImageSrc(card);
    cardImage.alt = `${card.rank} of ${card.suit}`;
    cardImage.style.animationDelay = `${index * 90}ms`;
    container.append(cardImage);
  });
}

function renderNpcHands() {
  elements.npcArea.replaceChildren();
  elements.npcArea.classList.toggle("hidden", game.npcHands.length === 0);

  game.npcHands.forEach((hand, index) => {
    const panel = document.createElement("article");
    const heading = document.createElement("div");
    const title = document.createElement("h2");
    const score = document.createElement("span");
    const cards = document.createElement("div");

    panel.className = "npc-hand";
    heading.className = "hand-heading npc-heading";
    title.textContent = `Player ${index + 2}`;
    score.className = "score-pill npc-score";
    score.textContent = `Score: ${calculateHandTotal(hand)}`;
    cards.className = "cards npc-cards";
    heading.append(title, score);
    panel.append(heading, cards);
    elements.npcArea.append(panel);
    renderHand(cards, hand);
  });
}

function renderScores() {
  const playerTotal = calculateHandTotal(game.playerHand);
  const dealerTotal = game.dealerHoleCardHidden
    ? calculateHandTotal(game.dealerHand.slice(0, 1))
    : calculateHandTotal(game.dealerHand);

  updateTextWithScroll(elements.playerScore, `Score: ${playerTotal}`);
  updateTextWithScroll(
    elements.dealerScore,
    game.dealerHoleCardHidden ? `Showing: ${dealerTotal}` : `Score: ${dealerTotal}`,
  );
}

function renderTableShape() {
  const opponents = 1 + game.ownedUpgrades.extraPlayers;
  const shape = opponents <= 1 ? "rectangle" : opponents === 2 ? "triangle" : opponents === 3 ? "square" : "polygon";

  elements.tableCenter.classList.remove("shape-rectangle", "shape-triangle", "shape-square", "shape-polygon");
  elements.tableCenter.classList.add(`shape-${shape}`);
  elements.tableCenter.style.setProperty("--shape-sides", String(opponents + 1));
}

function renderShopProgress() {
  const cashUntilShop = Math.max(game.nextShopCashTarget - game.moneyEarnedSinceShop, 0);
  const progress = (game.moneyEarnedSinceShop / game.nextShopCashTarget) * 100;

  updateTextWithScroll(elements.cashUntilShop, formatMoney(cashUntilShop));
  elements.shopProgressFill.style.width = `${clampNumber(progress, 0, 100)}%`;
}

function renderStats() {
  const winPercent =
    game.stats.handsPlayed === 0 ? 0 : Math.round((game.stats.handsWon / game.stats.handsPlayed) * 100);

  updateTextWithScroll(elements.statHandsPlayed, String(game.stats.handsPlayed));
  updateTextWithScroll(elements.statMoneyEarned, formatMoney(game.stats.moneyEarned));
  updateTextWithScroll(elements.statMoneyLost, formatMoney(game.stats.moneyLost));
  updateTextWithScroll(elements.statWinPercent, `${winPercent}%`);
  updateTextWithScroll(elements.statCharlies, String(game.stats.charlies));
  updateTextWithScroll(elements.statBlackjacks, String(game.stats.blackjacks));
  updateTextWithScroll(elements.statJokers, String(game.stats.jokers));
  updateTextWithScroll(elements.statTopCreditScore, String(game.topCreditScore));
  updateTextWithScroll(elements.statTopCreditHigh, String(game.topCreditHighScore));
}

function getOwnedPowerups() {
  const powerups = [];

  if (game.ownedUpgrades.autoDeal) {
    powerups.push(["Auto-Deal", "Automatically starts a new hand using your Auto-Bet Size."]);
  }

  if (game.ownedUpgrades.programmableBot) {
    powerups.push(["Programmable Bot", "Automatically hits until your custom Stand Target, then stands."]);
  }

  if (game.ownedUpgrades.speedHacks) {
    powerups.push(["Speed Hacks", "Shortens dealer delays and speeds up CSS animations."]);
  }

  if (game.ownedUpgrades.comboBoost > 0) {
    powerups.push(["Combo Upgrade", `Adds +${game.ownedUpgrades.comboBoost} to most combo multipliers. Suited Blackjack scales faster.`]);
  }

  if (game.ownedUpgrades.creditDrip) {
    powerups.push(["Credit Drip", "Adds +1 Credit to every future winning hand."]);
  }

  if (game.ownedUpgrades.charlieTraining) {
    powerups.push(["Charlie Training", "Charlie wins earn +1 bonus Credit."]);
  }

  if (game.ownedUpgrades.jokerBoost > 0) {
    powerups.push(["Joker Magnet", `Adds ${game.ownedUpgrades.jokerBoost * JOKERS_PER_BOOST} extra Jokers to each deck.`]);
  }

  if (game.ownedUpgrades.extraPlayers > 0) {
    powerups.push(["Added Players", `${game.ownedUpgrades.extraPlayers} extra matching player(s) play dealer rules and add matched chips.`]);
  }

  return powerups;
}

function renderPowerups() {
  const powerups = getOwnedPowerups();
  elements.powerupList.replaceChildren();

  if (powerups.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No powerups yet.";
    elements.powerupList.append(empty);
    return;
  }

  powerups.forEach(([name, description]) => {
    const item = document.createElement("article");
    const title = document.createElement("strong");
    const copy = document.createElement("p");

    item.className = "powerup-item";
    title.textContent = name;
    copy.textContent = description;
    item.append(title, copy);
    elements.powerupList.append(item);
  });
}

function renderAutomationPanel() {
  const hasControls = game.ownedUpgrades.autoDeal || game.ownedUpgrades.programmableBot;

  elements.automationPanel.classList.toggle("hidden", !hasControls);
  elements.autoDealControl.classList.toggle("hidden", !game.ownedUpgrades.autoDeal);
  elements.autoBetControl.classList.toggle("hidden", !game.ownedUpgrades.autoDeal);
  elements.botControl.classList.toggle("hidden", !game.ownedUpgrades.programmableBot);
  elements.standTargetControl.classList.toggle("hidden", !game.ownedUpgrades.programmableBot);

  elements.autoDealToggle.checked = game.automation.autoDeal;
  elements.autoBetSize.value = String(game.automation.autoBetSize);
  elements.botToggle.checked = game.automation.programmableBot;
  elements.standTarget.value = String(game.automation.standTarget);
}

function renderShopOptions() {
  elements.shopOptions.replaceChildren();

  game.shopChoices.forEach((upgrade) => {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const button = document.createElement("button");
    const canAfford = game.credits >= upgrade.cost;

    card.className = "shop-option";
    title.textContent = upgrade.name;
    description.textContent = upgrade.description;
    button.type = "button";
    button.className = "secondary-button";
    button.textContent = canAfford ? `Buy - ${upgrade.cost} Credits` : `Need ${upgrade.cost} Credits`;
    button.disabled = !canAfford;
    button.addEventListener("click", () => buyUpgrade(upgrade.id));

    card.append(title, description, button);
    elements.shopOptions.append(card);
  });
}

function renderModals() {
  elements.shopModal.classList.toggle("hidden", !game.shopOpen);
  elements.gameOverScreen.classList.toggle("hidden", !game.gameOver);
  updateTextWithScroll(elements.shopCreditCount, String(game.credits));
  elements.gameOverSummary.textContent = `Run ended with a Top Credit score of ${game.topCreditScore}. High score: ${game.topCreditHighScore}.`;
}

function updateScreenMode() {
  document.body.classList.toggle("intro-mode", game.showIntro);
  document.body.classList.toggle("speed-mode", game.ownedUpgrades.speedHacks);
}

function render() {
  updateScreenMode();
  updateTextWithScroll(elements.cash, formatMoney(game.cash));
  updateTextWithScroll(elements.bankroll, formatMoney(game.cash));
  updateTextWithScroll(elements.credits, String(game.credits));
  updateTextWithScroll(elements.tableCredits, String(game.credits));
  updateTextWithScroll(elements.currentBet, formatMoney(game.currentBet));
  updateTextWithScroll(elements.hudCurrentBet, formatMoney(game.currentBet));

  renderShopProgress();
  renderStats();
  renderPowerups();
  renderTableShape();
  renderHand(elements.playerCards, game.playerHand);
  renderHand(elements.dealerCards, game.dealerHand, game.dealerHoleCardHidden);
  renderNpcHands();
  renderBetPile();
  renderOpponentBetPiles();
  renderScores();
  renderShopOptions();
  renderAutomationPanel();
  renderModals();
  updateControls();
}

function setMessage(message, isResultMessage = false) {
  elements.message.textContent = message;

  if (isResultMessage) {
    replayAnimation(elements.message, "message-rush");
  }
}

function showComboBanner(text) {
  elements.comboBanner.textContent = text;

  if (text) {
    replayAnimation(elements.comboBanner, "combo-pop");
  }
}

function updateControls() {
  const canAdjustBet = !game.roundActive && !game.roundComplete && !game.shopOpen && !game.gameOver;
  const canAddChips = canAdjustBet && game.cash > 0;
  const canDeal = canAdjustBet && game.currentBet > 0;
  const canAct = game.roundActive && !game.shopOpen && !game.gameOver;

  elements.chipButtons.forEach((button) => {
    const denomination = Number(button.dataset.chip);
    button.disabled = !canAddChips || denomination > game.cash;
  });

  elements.clearBetButton.disabled = !canAdjustBet || game.currentBet === 0;
  elements.dealButton.disabled = !canDeal;
  elements.hitButton.disabled = !canAct || game.automation.programmableBot;
  elements.standButton.disabled = !canAct || game.automation.programmableBot;
  elements.newRoundButton.disabled = !game.roundComplete || game.shopOpen || game.gameOver;
  elements.newRoundButton.textContent = game.cash <= 0 ? "Game Over" : "New Round";
}

function playIntroToGameTransition(onGameShown) {
  document.body.classList.remove("intro-fall");
  elements.table.classList.remove("game-fall");
  void elements.table.offsetWidth;
  document.body.classList.add("intro-fall");

  queueTimer(() => {
    game.showIntro = false;
    render();
    elements.table.classList.add("game-fall");

    queueTimer(() => {
      document.body.classList.remove("intro-fall");
      elements.table.classList.remove("game-fall");
      onGameShown();
    }, 760);
  }, 620);
}

function placeBet(amount) {
  if (game.roundActive || game.roundComplete || game.shopOpen || game.gameOver || amount > game.cash) {
    return;
  }

  game.cash -= amount;
  game.currentBet += amount;
  game.betChips.push(amount);
  setMessage("Bet locked in. Deal when ready.");
  render();
}

function clearBet() {
  if (game.roundActive || game.roundComplete || game.shopOpen || game.gameOver) {
    return;
  }

  game.cash += game.currentBet;
  game.currentBet = 0;
  game.betChips = [];
  setMessage("Place your bet to begin.");
  render();
}

function startRound() {
  if (game.currentBet === 0 || game.roundActive || game.shopOpen || game.gameOver) {
    return;
  }

  clearTimers();
  game.deck = shuffleDeck(createDeck());
  game.playerHand = [drawCard(), drawCard()];
  game.dealerHand = [drawCard({ allowJoker: false }), drawCard({ allowJoker: false })];
  game.npcHands = Array.from({ length: game.ownedUpgrades.extraPlayers }, () => [
    drawCard({ allowJoker: false }),
    drawCard({ allowJoker: false }),
  ]);
  game.dealerHoleCardHidden = true;
  game.roundActive = true;
  game.roundComplete = false;
  showComboBanner("");
  setMessage("Hit or stand.");

  const afterDeal = () => {
    render();
    if (game.automation.programmableBot) {
      runBotTurn();
    }
  };

  if (game.showIntro) {
    playIntroToGameTransition(afterDeal);
    return;
  }

  afterDeal();
}

function hit() {
  if (!game.roundActive || game.shopOpen || game.gameOver) {
    return;
  }

  game.playerHand.push(drawCard());
  const total = calculateHandTotal(game.playerHand);

  if (total > 21) {
    finishRound("Player busts. Dealer wins.", "loss");
    return;
  }

  setMessage("Nice draw. Hit or stand?");
  render();
}

function stand() {
  if (!game.roundActive || game.shopOpen || game.gameOver) {
    return;
  }

  game.dealerHoleCardHidden = false;
  render();
  dealerPlay();
}

function dealerPlay() {
  if (!game.roundActive) {
    return;
  }

  if (calculateHandTotal(game.dealerHand) < DEALER_STAND_TOTAL) {
    queueTimer(() => {
      game.dealerHand.push(drawCard({ allowJoker: false }));
      render();
      dealerPlay();
    }, 520);
    return;
  }

  playNpcHands(0);
}

function playNpcHands(index) {
  if (index >= game.npcHands.length) {
    settleRound();
    return;
  }

  if (calculateHandTotal(game.npcHands[index]) < DEALER_STAND_TOTAL) {
    queueTimer(() => {
      game.npcHands[index].push(drawCard({ allowJoker: false }));
      render();
      playNpcHands(index);
    }, 420);
    return;
  }

  playNpcHands(index + 1);
}

function settleRound() {
  const playerTotal = calculateHandTotal(game.playerHand);
  const dealerTotal = calculateHandTotal(game.dealerHand);

  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    finishRound("You beat the dealer!", "win", countBeatenOpponents(playerTotal));
    return;
  }

  if (playerTotal < dealerTotal) {
    finishRound("Dealer wins this round.", "loss");
    return;
  }

  finishRound("Push twist. Bet lost, +1 Credit.", "push");
}

function countBeatenOpponents(playerTotal) {
  const opponents = [game.dealerHand, ...game.npcHands];

  return opponents.filter((hand) => {
    const opponentTotal = calculateHandTotal(hand);
    return opponentTotal > 21 || playerTotal > opponentTotal;
  }).length;
}

function getComboResult(outcome) {
  if (outcome !== "win") {
    return {
      label: "",
      cashMultiplier: 1,
      creditGain: outcome === "push" ? 1 : 0,
    };
  }

  const boost = game.ownedUpgrades.comboBoost;
  const hasSuitedBlackjack = isSuitedBlackjack(game.playerHand);

  if (hasSuitedBlackjack) {
    return {
      label: `SUITED BLACKJACK! ${10 + boost * 2}x!`,
      cashMultiplier: 10 + boost * 2,
      creditGain: 5,
    };
  }

  if (game.playerHand.length >= 4) {
    return {
      label: `CHARLIE! ${3 + boost}x!`,
      cashMultiplier: 3 + boost,
      creditGain: 1 + (game.ownedUpgrades.charlieTraining ? 1 : 0) + (game.ownedUpgrades.creditDrip ? 1 : 0),
    };
  }

  if (calculateHandTotal(game.playerHand) === 21) {
    return {
      label: `EXACT 21! ${2 + boost}x!`,
      cashMultiplier: 2 + boost,
      creditGain: 1 + (game.ownedUpgrades.creditDrip ? 1 : 0),
    };
  }

  return {
    label: "",
    cashMultiplier: 1,
    creditGain: 1 + (game.ownedUpgrades.creditDrip ? 1 : 0),
  };
}

function isSuitedBlackjack(hand) {
  if (hand.length !== 2) {
    return false;
  }

  const [first, second] = hand;
  const hasAce = first.rank === "A" || second.rank === "A";
  const hasTenValue = first.value === 10 || second.value === 10;

  return hasAce && hasTenValue && first.suit === second.suit;
}

function finishRound(message, outcome, opponentsBeaten = 0) {
  const combo = getComboResult(outcome);
  const hasJoker = handHasJoker(game.playerHand);
  const jokerProtected = hasJoker && outcome !== "win";
  const matchCount = Math.max(opponentsBeaten, outcome === "win" ? 1 : 0);
  const baseCashWon = outcome === "win" ? game.currentBet + game.currentBet * combo.cashMultiplier * matchCount : 0;
  const cashWon = hasJoker && outcome === "win" ? baseCashWon * 2 : baseCashWon;
  const isCharlie = outcome === "win" && game.playerHand.length >= 4;
  const isBlackjackOr21 = outcome === "win" && calculateHandTotal(game.playerHand) === 21;

  game.roundActive = false;
  game.roundComplete = true;
  game.dealerHoleCardHidden = false;
  game.cash += cashWon;
  if (jokerProtected) {
    game.cash += game.currentBet;
  }
  game.credits += combo.creditGain;
  game.topCreditScore += combo.creditGain;
  game.topCreditHighScore = Math.max(game.topCreditHighScore, game.topCreditScore);
  saveTopCreditHighScore(game.topCreditHighScore);
  game.stats.handsPlayed += 1;
  game.stats.moneyEarned += cashWon;
  game.stats.moneyLost += outcome === "win" || jokerProtected ? 0 : game.currentBet;
  game.moneyEarnedSinceShop += cashWon;
  game.stats.jokers += game.playerHand.filter((card) => card.isJoker).length;

  if (outcome === "win") {
    game.stats.handsWon += 1;
  }

  if (isCharlie) {
    game.stats.charlies += 1;
  }

  if (isBlackjackOr21) {
    game.stats.blackjacks += 1;
  }

  if (hasJoker && outcome === "win") {
    showComboBanner(combo.label ? `${combo.label} JOKER 2x!` : "JOKER DOUBLE!");
  } else if (hasJoker && outcome !== "win") {
    showComboBanner("JOKER PROTECT!");
  } else if (combo.label) {
    showComboBanner(combo.label);
  } else if (outcome === "push") {
    showComboBanner("+1 CREDIT");
  } else {
    showComboBanner("");
  }

  setMessage(buildResultMessage(message, outcome, cashWon, combo.creditGain, jokerProtected, matchCount), true);
  render();
  handlePostRound();
}

function buildResultMessage(message, outcome, cashWon, creditGain, jokerProtected = false, matchCount = 1) {
  if (outcome === "win") {
    const matchText = matchCount > 1 ? ` across ${matchCount} matched opponents` : "";
    return `${message} Won ${formatMoney(cashWon)}${matchText} and +${creditGain} Credit${creditGain === 1 ? "" : "s"}.`;
  }

  if (outcome === "push") {
    return jokerProtected ? `Joker protected your bet. +${creditGain} Credit.` : `${message} +${creditGain} Credit.`;
  }

  return jokerProtected ? "Joker protected your bet. No Cash lost." : message;
}

function handlePostRound() {
  if (game.cash <= 0) {
    queueTimer(showGameOver, 900);
    return;
  }

  if (game.moneyEarnedSinceShop >= game.nextShopCashTarget) {
    queueTimer(openShop, 900);
    return;
  }

  scheduleAutoDeal();
}

function resetRound() {
  if (game.cash <= 0) {
    showGameOver();
    return;
  }

  game.currentBet = 0;
  game.betChips = [];
  game.playerHand = [];
  game.dealerHand = [];
  game.npcHands = [];
  game.dealerHoleCardHidden = true;
  game.roundActive = false;
  game.roundComplete = false;
  showComboBanner("");
  setMessage("Place your bet to begin.");
  render();
  scheduleAutoDeal();
}

function showGameOver() {
  clearTimers();
  game.gameOver = true;
  game.shopOpen = false;
  render();
}

function restartRun() {
  clearTimers();
  game.cash = STARTING_CASH;
  game.credits = 0;
  game.currentBet = 0;
  game.betChips = [];
  game.deck = [];
  game.playerHand = [];
  game.dealerHand = [];
  game.npcHands = [];
  game.dealerHoleCardHidden = true;
  game.roundActive = false;
  game.roundComplete = false;
  game.showIntro = true;
  game.gameOver = false;
  game.shopOpen = false;
  game.moneyEarnedSinceShop = 0;
  game.nextShopCashTarget = STARTING_SHOP_CASH_TARGET;
  game.topCreditScore = 0;
  game.shopChoices = [];
  game.stats = {
    handsPlayed: 0,
    moneyEarned: 0,
    moneyLost: 0,
    handsWon: 0,
    charlies: 0,
    blackjacks: 0,
    jokers: 0,
  };
  game.ownedUpgrades = {
    autoDeal: false,
    programmableBot: false,
    speedHacks: false,
    comboBoost: 0,
    creditDrip: false,
    charlieTraining: false,
    jokerBoost: 0,
    extraPlayers: 0,
  };
  game.automation = {
    autoDeal: false,
    autoBetSize: 50,
    programmableBot: false,
    standTarget: 17,
  };
  document.body.classList.remove("speed-mode");
  showComboBanner("");
  setMessage("Place your bet to begin.");
  render();
}

function openShop() {
  if (game.gameOver) {
    return;
  }

  game.shopOpen = true;
  game.shopChoices = getShopChoices();
  render();
}

function closeShop() {
  game.shopOpen = false;
  game.moneyEarnedSinceShop = 0;
  game.nextShopCashTarget = getNextShopTarget(game.nextShopCashTarget);
  game.currentBet = 0;
  game.betChips = [];
  game.playerHand = [];
  game.dealerHand = [];
  game.npcHands = [];
  game.dealerHoleCardHidden = true;
  game.roundComplete = false;
  showComboBanner("");
  setMessage("Shop closed. Place your bet.");
  render();
  scheduleAutoDeal();
}

function getNextShopTarget(currentTarget) {
  return Math.round((currentTarget * SHOP_TARGET_SCALE) / SHOP_TARGET_ROUNDING) * SHOP_TARGET_ROUNDING;
}

function getShopChoices() {
  const available = shopPool.filter((upgrade) => upgrade.available());
  const shuffled = available.sort(() => Math.random() - 0.5);
  const choices = shuffled.slice(0, 3);
  const repeatableComboUpgrade = shopPool.find((upgrade) => upgrade.id === "comboBoost");

  while (choices.length < 3 && repeatableComboUpgrade) {
    choices.push(repeatableComboUpgrade);
  }

  return choices;
}

function buyUpgrade(upgradeId) {
  const upgrade = shopPool.find((candidate) => candidate.id === upgradeId);

  if (!upgrade || game.credits < upgrade.cost || !upgrade.available()) {
    return;
  }

  game.credits -= upgrade.cost;
  upgrade.buy();
  game.shopChoices = game.shopChoices.filter((candidate) => candidate.id !== upgradeId);
  setMessage(`${upgrade.name} purchased.`);
  render();
}

function scheduleAutoDeal() {
  if (!game.ownedUpgrades.autoDeal || !game.automation.autoDeal || game.roundActive || game.shopOpen || game.gameOver) {
    return;
  }

  if (game.roundComplete) {
    queueTimer(resetRound, AUTO_DEAL_DELAY);
    return;
  }

  const betSize = clampNumber(game.automation.autoBetSize, 1, game.cash);

  if (game.currentBet === 0 && betSize > 0 && game.cash > 0) {
    queueTimer(() => {
      placeBet(Math.min(betSize, game.cash));
      queueTimer(startRound, 180);
    }, AUTO_DEAL_DELAY);
  }
}

function runBotTurn() {
  if (!game.roundActive || !game.automation.programmableBot) {
    return;
  }

  const playerTotal = calculateHandTotal(game.playerHand);

  if (playerTotal < game.automation.standTarget) {
    queueTimer(() => {
      hit();
      runBotTurn();
    }, 420);
    return;
  }

  queueTimer(stand, 420);
}

function syncAutomationSettings() {
  game.automation.autoDeal = elements.autoDealToggle.checked;
  game.automation.autoBetSize = Math.max(1, Number(elements.autoBetSize.value) || 1);
  game.automation.programmableBot = elements.botToggle.checked;
  game.automation.standTarget = clampNumber(Number(elements.standTarget.value) || 17, 12, 21);
  render();
  scheduleAutoDeal();
}

function bindEvents() {
  elements.chipButtons.forEach((button) => {
    button.addEventListener("click", () => placeBet(Number(button.dataset.chip)));
  });

  elements.clearBetButton.addEventListener("click", clearBet);
  elements.dealButton.addEventListener("click", startRound);
  elements.hitButton.addEventListener("click", hit);
  elements.standButton.addEventListener("click", stand);
  elements.newRoundButton.addEventListener("click", resetRound);
  elements.closeShopButton.addEventListener("click", closeShop);
  elements.restartRunButton.addEventListener("click", restartRun);
  elements.autoDealToggle.addEventListener("change", syncAutomationSettings);
  elements.autoBetSize.addEventListener("change", syncAutomationSettings);
  elements.botToggle.addEventListener("change", syncAutomationSettings);
  elements.standTarget.addEventListener("change", syncAutomationSettings);
}

function init() {
  renderChipRack();
  bindEvents();
  render();
}

init();
