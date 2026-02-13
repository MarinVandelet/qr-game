const express = require("express");
const cors = require("cors");
const db = require("./db");
const game2Config = require("./game2-config");
const game3Config = require("./game3-config");

const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const PORT = Number(process.env.PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((value) => value.trim())
  : "*";

const io = new Server(http, {
  cors: {
    origin: corsOrigin,
  },
});

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend OK" });
});

app.post("/api/player", (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) {
    return res.status(400).json({ error: "Nom et prenom requis" });
  }

  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO players (firstName, lastName, createdAt)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(firstName, lastName, now);

  res.json({
    id: result.lastInsertRowid,
    firstName,
    lastName,
    createdAt: now,
  });
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

app.post("/api/room/create", (req, res) => {
  const { playerId } = req.body;

  if (!playerId) return res.status(400).json({ error: "playerId requis" });

  let code = generateRoomCode();
  const check = db.prepare("SELECT * FROM rooms WHERE code = ?");
  while (check.get(code)) code = generateRoomCode();

  const now = new Date().toISOString();

  const roomStmt = db.prepare(`
    INSERT INTO rooms (code, ownerId, createdAt)
    VALUES (?, ?, ?)
  `);

  const roomResult = roomStmt.run(code, playerId, now);

  db.prepare(`
    INSERT INTO room_players (playerId, roomId, isOwner, joinedAt)
    VALUES (?, ?, 1, ?)
  `).run(playerId, roomResult.lastInsertRowid, now);

  res.json({ roomId: roomResult.lastInsertRowid, code, ownerId: playerId });
});

app.post("/api/room/join", (req, res) => {
  const { playerId, code } = req.body;

  if (!playerId || !code) {
    return res.status(400).json({ error: "playerId et code requis" });
  }

  const room = db.prepare("SELECT * FROM rooms WHERE code = ?").get(code);
  if (!room) return res.status(404).json({ error: "Salon introuvable" });

  const now = new Date().toISOString();

  const exists = db
    .prepare("SELECT * FROM room_players WHERE playerId = ? AND roomId = ?")
    .get(playerId, room.id);

  if (!exists) {
    db.prepare(`
      INSERT INTO room_players (playerId, roomId, isOwner, joinedAt)
      VALUES (?, ?, 0, ?)
    `).run(playerId, room.id, now);
  }

  res.json({
    roomId: room.id,
    code: room.code,
    ownerId: room.ownerId,
  });
});

app.get("/api/room/players/:code", (req, res) => {
  const { code } = req.params;

  const room = db.prepare("SELECT * FROM rooms WHERE code = ?").get(code);
  if (!room) return res.status(404).json({ error: "Room not found" });

  const players = db
    .prepare(`
      SELECT players.id, firstName, lastName
      FROM room_players
      JOIN players ON players.id = room_players.playerId
      WHERE room_players.roomId = ?
    `)
    .all(room.id);

  res.json({ players, ownerId: room.ownerId });
});

const QUESTIONS = [
  {
    questionText: "A quoi sert ce logiciel (VScode) ?",
    imageUrl: "/questions/vscode.png",
    answers: ["Oriente HTML", "Heberger", "Maintenance", "Developper"],
    correctIndex: 3,
  },
  {
    questionText: "A quoi correspond ce logo ?",
    imageUrl: "/questions/logohtml.png",
    answers: ["Yell5", "HTML", "JetBrains", "SQL"],
    correctIndex: 1,
  },
  {
    questionText: "A quoi correspond ce logo ?",
    imageUrl: "/questions/logocss.png",
    answers: ["CSS", "Node.js", "TScript", "BlueStack"],
    correctIndex: 0,
  },
  {
    questionText: "A quoi correspond ce logo ?",
    imageUrl: "/questions/logojs.png",
    answers: ["JSite", "Ruby", "JavaScript", "PHP"],
    correctIndex: 2,
  },
  {
    questionText: "A quoi correspond ce logo ?",
    imageUrl: "/questions/logopy.png",
    answers: ["Reverze", "Vercel", "Snake", "Python"],
    correctIndex: 3,
  },
  {
    questionText: "Ou dois-je ecrire mon code ?",
    imageUrl: "/questions/code.png",
    answers: ["Title", "html", "Body", "Head"],
    correctIndex: 2,
  },
];

const GAME4_QUESTIONS = [
  {
    questionText: "A quoi servait Internet au depart ?",
    answers: [
      "A jouer en ligne",
      "A regarder des films",
      "A echanger des informations entre chercheurs",
      "A faire des achats",
    ],
    correctIndex: 2,
  },
  {
    questionText: "Qui etaient les premiers utilisateurs d'Internet ?",
    answers: [
      "Les chercheurs et universitaires",
      "Les adolescents",
      "Les entreprises",
      "Les gamers",
    ],
    correctIndex: 0,
  },
  {
    questionText: "Comment s'appelait le premier reseau a l'origine d'Internet ?",
    answers: ["INTRANET", "WIFI-NET", "WEBNET", "ARPANET"],
    correctIndex: 3,
  },
  {
    questionText: "Avant Internet, comment communiquait-on surtout a distance ?",
    answers: [
      "Par email",
      "Par courrier et telephone",
      "Par SMS",
      "Par reseaux sociaux",
    ],
    correctIndex: 1,
  },
  {
    questionText: "Quel objet est devenu indispensable pour aller sur Internet ?",
    answers: ["Le smartphone", "La television", "La radio", "Le CD"],
    correctIndex: 0,
  },
  {
    questionText: "Quel est le moteur de recherche le plus utilise ?",
    answers: ["Google", "Yahoo", "Bing", "Safari"],
    correctIndex: 0,
  },
];

const ROOM_STATES = {};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeWord(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function isApproximateMatch(input, expected) {
  if (!input || !expected) return false;
  const threshold = Math.max(1, Math.floor(expected.length * 0.25));
  return levenshteinDistance(input, expected) <= threshold;
}

const GAME2_PAIRS = game2Config.map((pair) => {
  const acceptedWords = new Set(
    pair.acceptedWords.map((value) => normalizeWord(value))
  );

  return {
    ...pair,
    acceptedWords,
    rightLabelNormalized: normalizeWord(pair.rightLabel),
  };
});

const GAME2_ACCEPTED_TO_PAIR = new Map();
for (const pair of GAME2_PAIRS) {
  pair.acceptedWords.forEach((word) => {
    GAME2_ACCEPTED_TO_PAIR.set(word, pair.id);
  });
}

function findGame2PairId(normalizedInput) {
  if (!normalizedInput) return null;

  const exactPairId = GAME2_ACCEPTED_TO_PAIR.get(normalizedInput);
  if (exactPairId) return exactPairId;

  const candidateIds = new Set();

  for (const pair of GAME2_PAIRS) {
    if (isApproximateMatch(normalizedInput, pair.rightLabelNormalized)) {
      candidateIds.add(pair.id);
      continue;
    }

    for (const acceptedWord of pair.acceptedWords) {
      if (isApproximateMatch(normalizedInput, acceptedWord)) {
        candidateIds.add(pair.id);
        break;
      }
    }
  }

  if (candidateIds.size === 1) {
    return [...candidateIds][0];
  }

  return null;
}

const GAME3_RIDDLES = game3Config.map((item, index) => ({
  id: item.id || index + 1,
  answer: item.answer,
  acceptedWords: item.acceptedWords.map((value) => normalizeWord(value)),
}));

function createInitialGame2State() {
  return {
    unlocked: false,
    entryOpened: false,
    introAccepted: false,
    startedAt: null,
    completedAt: null,
    wordEntries: [],
    wordValidationEntries: [],
    validatedWords: [],
    wordsSolved: false,
    puzzleAssignments: [],
    puzzleLocks: {},
    puzzleSolved: false,
    leftItems: GAME2_PAIRS.map((pair) => ({ id: pair.id, label: pair.leftLabel })),
    rightItems: shuffle(
      GAME2_PAIRS.map((pair) => ({ id: pair.id, label: pair.rightLabel }))
    ),
  };
}

function createInitialGame3State(players) {
  const firstPlayer = players[0] || null;

  return {
    unlocked: false,
    introAccepted: false,
    startedAt: null,
    completedAt: null,
    completed: false,
    currentIndex: 0,
    turnIndex: 0,
    activePlayerId: firstPlayer ? firstPlayer.id : null,
    activePlayerName: firstPlayer ? firstPlayer.firstName : "",
    solvedEntries: [],
    total: GAME3_RIDDLES.length,
  };
}

function createInitialGame4State() {
  return {
    unlocked: false,
    startedAt: null,
    completedAt: null,
    started: false,
    ended: false,
    phase: "IDLE",
    questionIndex: 0,
    currentQuestion: null,
    score: 0,
    activePlayerId: null,
    activePlayerName: "",
    chosenIndex: null,
    correctIndex: null,
    answered: false,
  };
}

function getSessionState(roomCode) {
  const state = ROOM_STATES[roomCode];
  if (!state) {
    return {
      roomCode,
      hasSession: false,
    };
  }

  return {
    roomCode,
    hasSession: true,
    ownerId: state.ownerId || null,
    quiz: {
      started: true,
      phase: state.phase,
      questionIndex: state.questionIndex,
      currentQuestion: state.currentQuestion,
      score: state.score,
      quizEnded: state.quizEnded,
      success: state.success,
    },
    game2: {
      unlocked: state.game2.unlocked,
      entryOpened: state.game2.entryOpened,
      introAccepted: state.game2.introAccepted,
      startedAt: state.game2.startedAt,
      completedAt: state.game2.completedAt,
      wordEntries: state.game2.wordEntries,
      wordValidationEntries: state.game2.wordValidationEntries,
      validatedWords: state.game2.validatedWords,
      wordsSolved: state.game2.wordsSolved,
      puzzleAssignments: state.game2.puzzleAssignments,
      puzzleLocks: state.game2.puzzleLocks,
      puzzleSolved: state.game2.puzzleSolved,
      leftItems: state.game2.leftItems,
      rightItems: state.game2.rightItems,
    },
    game3: {
      unlocked: state.game3.unlocked,
      introAccepted: state.game3.introAccepted,
      startedAt: state.game3.startedAt,
      completedAt: state.game3.completedAt,
      completed: state.game3.completed,
      currentIndex: state.game3.currentIndex,
      turnIndex: state.game3.turnIndex,
      activePlayerId: state.game3.activePlayerId,
      activePlayerName: state.game3.activePlayerName,
      solvedEntries: state.game3.solvedEntries,
      total: state.game3.total,
    },
    game4: {
      unlocked: state.game4.unlocked,
      startedAt: state.game4.startedAt,
      completedAt: state.game4.completedAt,
      started: state.game4.started,
      ended: state.game4.ended,
      phase: state.game4.phase,
      questionIndex: state.game4.questionIndex,
      currentQuestion: state.game4.currentQuestion,
      score: state.game4.score,
      activePlayerId: state.game4.activePlayerId,
      activePlayerName: state.game4.activePlayerName,
      chosenIndex: state.game4.chosenIndex,
      correctIndex: state.game4.correctIndex,
    },
    finalResults: state.finalResults,
  };
}

function emitSessionStateToRoom(roomCode) {
  io.to(roomCode).emit("sessionState", getSessionState(roomCode));
}

function emitSessionStateToSocket(socket, roomCode) {
  socket.emit("sessionState", getSessionState(roomCode));
}

function isRoomOwner(roomCode, playerId) {
  if (!roomCode || !playerId) return false;
  const state = ROOM_STATES[roomCode];
  if (state?.ownerId) {
    return Number(state.ownerId) === Number(playerId);
  }

  const room = db.prepare("SELECT ownerId FROM rooms WHERE code = ?").get(roomCode);
  if (!room) return false;
  return Number(room.ownerId) === Number(playerId);
}

function emitOwnerOnlyError(socket) {
  socket.emit("ownerActionDenied", {
    message: "Seul le proprietaire de la partie peut lancer cette etape.",
  });
}

function buildWordValidation(words) {
  const uniqueMatchedPairIds = new Set();
  const seenNormalizedWords = new Set();

  const entries = (words || []).slice(0, 6).map((rawInput) => {
    const input = String(rawInput || "");
    const normalized = normalizeWord(input);

    if (!normalized) {
      return {
        input,
        normalized,
        status: "empty",
        pairId: null,
        matchedLabel: null,
      };
    }

    if (seenNormalizedWords.has(normalized)) {
      return {
        input,
        normalized,
        status: "duplicate",
        pairId: null,
        matchedLabel: null,
      };
    }

    seenNormalizedWords.add(normalized);

    const pairId = findGame2PairId(normalized);
    if (!pairId) {
      return {
        input,
        normalized,
        status: "invalid",
        pairId: null,
        matchedLabel: null,
      };
    }

    if (uniqueMatchedPairIds.has(pairId)) {
      return {
        input,
        normalized,
        status: "duplicate",
        pairId: null,
        matchedLabel: null,
      };
    }

    uniqueMatchedPairIds.add(pairId);
    const pair = GAME2_PAIRS.find((item) => item.id === pairId);

    return {
      input,
      normalized,
      status: "valid",
      pairId,
      matchedLabel: pair.rightLabel,
    };
  });

  const missingPairs = GAME2_PAIRS.filter(
    (pair) => !uniqueMatchedPairIds.has(pair.id)
  );

  return {
    entries,
    success: uniqueMatchedPairIds.size === GAME2_PAIRS.length,
    uniqueMatchedPairIds: [...uniqueMatchedPairIds],
    missingLeftLabels: missingPairs.map((pair) => pair.leftLabel),
  };
}

function advanceGame3Turn(state) {
  if (!state.players.length) return;

  state.game3.turnIndex = (state.game3.turnIndex + 1) % state.players.length;
  const activePlayer = state.players[state.game3.turnIndex];
  state.game3.activePlayerId = activePlayer.id;
  state.game3.activePlayerName = activePlayer.firstName;
}

function validateGame3Word(input, riddle) {
  const normalizedInput = normalizeWord(input);
  if (!normalizedInput) {
    return { ok: false, normalizedInput };
  }

  const exact = riddle.acceptedWords.includes(normalizedInput);
  if (exact) {
    return { ok: true, normalizedInput };
  }

  const close = riddle.acceptedWords.some((word) =>
    isApproximateMatch(normalizedInput, word)
  );

  return { ok: close, normalizedInput };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeTimePoints(startedAt, completedAt, maxPoints, targetSec, maxSec) {
  if (!startedAt || !completedAt) return 0;
  const durationSec = Math.max(0, Math.floor((completedAt - startedAt) / 1000));

  if (durationSec <= targetSec) return maxPoints;
  if (durationSec >= maxSec) return 0;

  const ratio = 1 - (durationSec - targetSec) / (maxSec - targetSec);
  return Math.round(clamp(ratio, 0, 1) * maxPoints);
}

function buildFinalResults(state) {
  const quiz1Points = Math.round((state.score / QUESTIONS.length) * 40);
  const game4Points = Math.round((state.game4.score / GAME4_QUESTIONS.length) * 40);

  const game2TimePoints = computeTimePoints(
    state.game2.startedAt,
    state.game2.completedAt,
    10,
    180,
    900
  );

  const game3TimePoints = computeTimePoints(
    state.game3.startedAt,
    state.game3.completedAt,
    10,
    240,
    1200
  );

  const total = clamp(
    quiz1Points + game4Points + game2TimePoints + game3TimePoints,
    0,
    100
  );

  return {
    total,
    breakdown: {
      quiz1Points,
      game4Points,
      game2TimePoints,
      game3TimePoints,
    },
    raw: {
      quiz1Score: state.score,
      quiz1Total: QUESTIONS.length,
      game4Score: state.game4.score,
      game4Total: GAME4_QUESTIONS.length,
      game2DurationSec:
        state.game2.startedAt && state.game2.completedAt
          ? Math.max(0, Math.floor((state.game2.completedAt - state.game2.startedAt) / 1000))
          : null,
      game3DurationSec:
        state.game3.startedAt && state.game3.completedAt
          ? Math.max(0, Math.floor((state.game3.completedAt - state.game3.startedAt) / 1000))
          : null,
    },
  };
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (roomCode) => {
    if (!roomCode) return;
    const nextRoom = String(roomCode);

    if (socket.data?.activeRoom && socket.data.activeRoom !== nextRoom) {
      socket.leave(socket.data.activeRoom);
    }

    socket.join(nextRoom);
    socket.data.activeRoom = nextRoom;
    emitSessionStateToSocket(socket, nextRoom);
  });

  socket.on("startGame", (roomCode) => {
    if (!roomCode) return;
    startQuiz(roomCode);
  });

  socket.on("startQuizFromIntro", (payload) => {
    const roomCode =
      payload && typeof payload === "object" ? payload.roomCode : payload;
    const playerId =
      payload && typeof payload === "object" ? payload.playerId : null;
    if (!roomCode) return;
    startQuizFromIntro(roomCode, playerId, socket);
  });

  socket.on("startGame4", (payload) => {
    const roomCode =
      payload && typeof payload === "object" ? payload.roomCode : payload;
    const playerId =
      payload && typeof payload === "object" ? payload.playerId : null;
    if (!roomCode) return;
    startGame4(roomCode, playerId, socket);
  });

  socket.on("enterGame2FromQuizEnd", ({ roomCode, playerId }) => {
    const state = ROOM_STATES[roomCode];
    if (!state || !state.game2.unlocked) return;
    if (!isRoomOwner(roomCode, playerId)) return emitOwnerOnlyError(socket);

    state.game2.entryOpened = true;
    io.to(roomCode).emit("game2EntryOpened", { ok: true });
    emitSessionStateToRoom(roomCode);
  });

  socket.on("game2StartFromIntro", ({ roomCode, playerId }) => {
    const state = ROOM_STATES[roomCode];
    if (!state || !state.game2.unlocked) return;
    if (!isRoomOwner(roomCode, playerId)) return emitOwnerOnlyError(socket);

    state.game2.introAccepted = true;
    io.to(roomCode).emit("game2IntroStarted", { ok: true });
    emitSessionStateToRoom(roomCode);
  });

  socket.on("game3StartFromIntro", ({ roomCode, playerId }) => {
    const state = ROOM_STATES[roomCode];
    if (!state || !state.game3.unlocked) return;
    if (!isRoomOwner(roomCode, playerId)) return emitOwnerOnlyError(socket);

    state.game3.introAccepted = true;
    io.to(roomCode).emit("game3IntroStarted", { ok: true });
    emitSessionStateToRoom(roomCode);
  });

  socket.on("answer", ({ roomCode, chosenIndex }) => {
    const state = ROOM_STATES[roomCode];
    if (!state || state.quizEnded) return;

    const q = QUESTIONS[state.questionIndex];
    if (!q) return;

    if (chosenIndex === q.correctIndex) state.score += 1;

    io.to(roomCode).emit("answerResult", {
      correctIndex: q.correctIndex,
      chosenIndex,
    });

    emitSessionStateToRoom(roomCode);
  });

  socket.on("game2SubmitWords", ({ roomCode, words }) => {
    const state = ROOM_STATES[roomCode];
    if (!state || !state.game2.unlocked) {
      return socket.emit("game2WordsResult", {
        success: false,
        error: "Jeu 2 indisponible",
      });
    }

    const validation = buildWordValidation(words);

    state.game2.wordEntries = validation.entries.map((entry) => entry.input);
    state.game2.wordValidationEntries = validation.entries;
    state.game2.entryOpened = true;
    state.game2.introAccepted = true;
    state.game2.validatedWords = validation.entries
      .filter((entry) => entry.status === "valid")
      .map((entry) => entry.normalized);
    state.game2.wordsSolved = validation.success;

    io.to(roomCode).emit("game2WordsResult", {
      success: validation.success,
      entries: validation.entries,
      validatedCount: validation.uniqueMatchedPairIds.length,
      missingLeftLabels: validation.missingLeftLabels,
      canStartPuzzle: validation.success,
      validatedWords: state.game2.validatedWords,
    });

    emitSessionStateToRoom(roomCode);
  });

  socket.on("game2SubmitPuzzle", ({ roomCode, assignments }) => {
    const state = ROOM_STATES[roomCode];
    if (!state || !state.game2.unlocked) {
      return socket.emit("game2PuzzleResult", {
        success: false,
        error: "Jeu 2 indisponible",
      });
    }

    if (!state.game2.wordsSolved) {
      return socket.emit("game2PuzzleResult", {
        success: false,
        error: "Vous devez valider les 6 mots avant le puzzle",
      });
    }

    const sanitizedAssignments = Array.isArray(assignments) ? assignments : [];
    const byLeftId = new Map();
    for (const item of sanitizedAssignments) {
      if (!item || !item.leftId || !item.rightId) continue;
      byLeftId.set(String(item.leftId), String(item.rightId));
    }

    const details = GAME2_PAIRS.map((pair) => {
      const chosenRightId = byLeftId.get(pair.id) || null;
      const isCorrect = chosenRightId === pair.id;

      return {
        leftId: pair.id,
        expectedRightId: pair.id,
        chosenRightId,
        isCorrect,
      };
    });

    const correctCount = details.filter((item) => item.isCorrect).length;
    const success = correctCount === GAME2_PAIRS.length;

    state.game2.puzzleAssignments = details
      .filter((item) => item.chosenRightId)
      .map((item) => ({
        leftId: item.leftId,
        rightId: item.chosenRightId,
      }));

    const nextLocks = { ...(state.game2.puzzleLocks || {}) };
    for (const item of details) {
      if (item.isCorrect) {
        nextLocks[item.leftId] = true;
      }
    }
    state.game2.puzzleLocks = nextLocks;

    state.game2.puzzleSolved =
      success ||
      Object.values(state.game2.puzzleLocks).filter(Boolean).length === GAME2_PAIRS.length;

    io.to(roomCode).emit("game2PuzzleResult", {
      success,
      details,
      correctCount,
      total: GAME2_PAIRS.length,
    });

    if (state.game2.puzzleSolved) {
      state.game2.completedAt = Date.now();
      io.to(roomCode).emit("game2Complete", {
        success: true,
      });

      state.game3.unlocked = true;
      state.game3.introAccepted = false;
      state.game3.startedAt = Date.now();
      io.to(roomCode).emit("game3Available", {
        unlocked: true,
      });
    }

    emitSessionStateToRoom(roomCode);
  });

  socket.on("game2SetPuzzleChoice", ({ roomCode, leftId, rightId }) => {
    const state = ROOM_STATES[roomCode];
    if (!state || !state.game2.unlocked) return;
    if (!state.game2.wordsSolved || state.game2.puzzleSolved) return;

    const validLeftIds = new Set(GAME2_PAIRS.map((pair) => pair.id));
    if (!validLeftIds.has(String(leftId))) return;

    const safeLeftId = String(leftId);
    const safeRightId = String(rightId || "");
    if (state.game2.puzzleLocks?.[safeLeftId]) return;

    const byLeftId = new Map();
    for (const item of state.game2.puzzleAssignments || []) {
      if (item?.leftId) byLeftId.set(String(item.leftId), String(item.rightId || ""));
    }

    if (!safeRightId) {
      byLeftId.delete(safeLeftId);
    } else {
      byLeftId.set(safeLeftId, safeRightId);
    }

    state.game2.puzzleAssignments = [...byLeftId.entries()].map(([lId, rId]) => ({
      leftId: lId,
      rightId: rId,
    }));

    let justLocked = false;
    if (safeRightId && safeLeftId === safeRightId) {
      state.game2.puzzleLocks[safeLeftId] = true;
      justLocked = true;
    }

    const correctCount = Object.values(state.game2.puzzleLocks || {}).filter(Boolean).length;
    const total = GAME2_PAIRS.length;
    const solved = correctCount === total;

    if (solved) {
      state.game2.puzzleSolved = true;
      state.game2.completedAt = Date.now();
    }

    io.to(roomCode).emit("game2PuzzleProgress", {
      assignments: state.game2.puzzleAssignments,
      puzzleLocks: state.game2.puzzleLocks,
      leftId: safeLeftId,
      rightId: safeRightId,
      justLocked,
      isCorrectSelection: safeRightId === safeLeftId,
      correctCount,
      total,
      success: solved,
    });

    if (solved) {
      io.to(roomCode).emit("game2Complete", { success: true });
      state.game3.unlocked = true;
      state.game3.introAccepted = false;
      state.game3.startedAt = Date.now();
      io.to(roomCode).emit("game3Available", { unlocked: true });
    }

    emitSessionStateToRoom(roomCode);
  });

  socket.on("game3SubmitWord", ({ roomCode, playerId, word }) => {
    const state = ROOM_STATES[roomCode];
    if (!state || !state.game3.unlocked) {
      return socket.emit("game3Progress", {
        success: false,
        error: "Jeu 3 indisponible",
      });
    }

    if (state.game3.completed) {
      return socket.emit("game3Progress", {
        success: false,
        error: "Jeu 3 deja termine",
      });
    }

    if (Number(playerId) !== Number(state.game3.activePlayerId)) {
      return socket.emit("game3Progress", {
        success: false,
        error: `Ce n'est pas votre tour. Tour de ${state.game3.activePlayerName}`,
      });
    }

    const currentRiddle = GAME3_RIDDLES[state.game3.currentIndex];
    if (!currentRiddle) {
      return socket.emit("game3Progress", {
        success: false,
        error: "Enigme introuvable",
      });
    }

    const result = validateGame3Word(word, currentRiddle);

    if (!result.ok) {
      io.to(roomCode).emit("game3Progress", {
        success: false,
        completed: false,
        currentIndex: state.game3.currentIndex,
        total: state.game3.total,
        message: "Mauvais mot, reessayez.",
        activePlayerId: state.game3.activePlayerId,
        activePlayerName: state.game3.activePlayerName,
      });
      return;
    }

    state.game3.solvedEntries.push({
      riddleId: currentRiddle.id,
      answer: currentRiddle.answer,
      enteredWord: word,
      byPlayerId: Number(playerId),
    });

    if (state.game3.currentIndex === state.game3.total - 1) {
      state.game3.completed = true;
      state.game3.completedAt = Date.now();

      io.to(roomCode).emit("game3Progress", {
        success: true,
        completed: true,
        currentIndex: state.game3.currentIndex,
        total: state.game3.total,
        message: "Bravo, les 10 enigmes sont validees.",
        activePlayerId: state.game3.activePlayerId,
        activePlayerName: state.game3.activePlayerName,
      });

      io.to(roomCode).emit("game3Complete", {
        success: true,
      });

      state.game4.unlocked = true;
      io.to(roomCode).emit("game4Available", {
        unlocked: true,
      });

      emitSessionStateToRoom(roomCode);
      return;
    }

    state.game3.currentIndex += 1;
    state.game3.introAccepted = true;
    advanceGame3Turn(state);

    io.to(roomCode).emit("game3Progress", {
      success: true,
      completed: false,
      currentIndex: state.game3.currentIndex,
      total: state.game3.total,
      message: "Bonne reponse. Enigme suivante.",
      activePlayerId: state.game3.activePlayerId,
      activePlayerName: state.game3.activePlayerName,
    });

    emitSessionStateToRoom(roomCode);
  });

  socket.on("game4Answer", ({ roomCode, playerId, chosenIndex }) => {
    const state = ROOM_STATES[roomCode];
    if (!state || !state.game4.started || state.game4.ended) return;
    if (Number(playerId) !== Number(state.game4.activePlayerId)) return;
    if (state.game4.phase !== "ANSWER") return;

    state.game4.chosenIndex = chosenIndex;

    io.to(roomCode).emit("game4AnswerResult", {
      chosenIndex,
      correctIndex: null,
    });

    emitSessionStateToRoom(roomCode);
  });
});

async function startQuiz(roomCode) {
  const room = db.prepare("SELECT * FROM rooms WHERE code = ?").get(roomCode);
  if (!room) return;

  const players = db
    .prepare(`
      SELECT players.id, firstName, lastName
      FROM room_players
      JOIN players ON players.id = room_players.playerId
      WHERE room_players.roomId = ?
    `)
    .all(room.id);

  if (players.length === 0) return;

  ROOM_STATES[roomCode] = {
    ownerId: room.ownerId,
    questionIndex: 0,
    score: 0,
    players,
    phase: "INTRO",
    currentQuestion: null,
    quizEnded: false,
    success: false,
    game2: createInitialGame2State(),
    game3: createInitialGame3State(players),
    game4: createInitialGame4State(),
    finalResults: null,
  };

  io.to(roomCode).emit("gameStart");

  io.to(roomCode).emit("phase", {
    type: "INTRO",
    duration: 0,
    startTime: Date.now(),
  });

  emitSessionStateToRoom(roomCode);
}

function startQuizFromIntro(roomCode, playerId, socket) {
  const state = ROOM_STATES[roomCode];
  if (!state || state.quizEnded) return;
  if (state.phase !== "INTRO") return;
  if (!isRoomOwner(roomCode, playerId)) return emitOwnerOnlyError(socket);

  state.phase = "LOADING";
  emitSessionStateToRoom(roomCode);
  runQuiz(roomCode);
}

async function startGame4(roomCode, playerId, socket) {
  const state = ROOM_STATES[roomCode];
  if (!state || !state.game4.unlocked || state.game4.started) return;
  if (!isRoomOwner(roomCode, playerId)) return emitOwnerOnlyError(socket);

  state.game4.started = true;
  state.game4.startedAt = Date.now();
  state.game4.ended = false;
  state.game4.score = 0;
  state.game4.questionIndex = 0;
  state.game4.phase = "LOADING";
  state.game4.answered = false;
  state.game4.chosenIndex = null;
  state.game4.correctIndex = null;

  io.to(roomCode).emit("game4Start", {
    started: true,
  });

  emitSessionStateToRoom(roomCode);

  runGame4(roomCode);
}

async function runGame4(roomCode) {
  const state = ROOM_STATES[roomCode];
  if (!state) return;

  for (let i = 0; i < GAME4_QUESTIONS.length; i += 1) {
    const q = GAME4_QUESTIONS[i];

    state.game4.questionIndex = i;
    state.game4.currentQuestion = q;
    state.game4.phase = "LOADING";
    state.game4.answered = false;
    state.game4.chosenIndex = null;
    state.game4.correctIndex = null;

    io.to(roomCode).emit("game4Phase", {
      type: "LOADING",
      questionIndex: i,
      duration: 800,
      startTime: Date.now(),
    });

    io.to(roomCode).emit("game4QuestionData", {
      questionText: q.questionText,
      answers: q.answers,
    });

    emitSessionStateToRoom(roomCode);
    await wait(850);

    state.game4.phase = "THINK";
    io.to(roomCode).emit("game4Phase", {
      type: "THINK",
      questionIndex: i,
      duration: 10000,
      startTime: Date.now(),
    });

    emitSessionStateToRoom(roomCode);
    await wait(10000);

    const responder = state.players[i % state.players.length];
    state.game4.activePlayerId = responder.id;
    state.game4.activePlayerName = responder.firstName;
    state.game4.phase = "ANSWER";

    io.to(roomCode).emit("game4Phase", {
      type: "ANSWER",
      questionIndex: i,
      activePlayerId: responder.id,
      activePlayerName: responder.firstName,
      duration: 20000,
      startTime: Date.now(),
    });

    emitSessionStateToRoom(roomCode);
    await wait(20000);

    state.game4.phase = "RESULT";
    state.game4.correctIndex = q.correctIndex;
    if (state.game4.chosenIndex === q.correctIndex) {
      state.game4.score += 1;
    }

    io.to(roomCode).emit("game4Phase", {
      type: "RESULT",
      questionIndex: i,
      correctIndex: q.correctIndex,
      duration: 5000,
      startTime: Date.now(),
    });

    io.to(roomCode).emit("game4AnswerResult", {
      chosenIndex: state.game4.chosenIndex,
      correctIndex: q.correctIndex,
    });

    emitSessionStateToRoom(roomCode);
    await wait(5000);
  }

  state.game4.phase = "END";
  state.game4.ended = true;
  state.game4.completedAt = Date.now();
  state.finalResults = buildFinalResults(state);

  io.to(roomCode).emit("game4End", {
    score: state.game4.score,
    success: state.game4.score >= 4,
    total: GAME4_QUESTIONS.length,
    finalResults: state.finalResults,
  });

  emitSessionStateToRoom(roomCode);
}

async function runQuiz(roomCode) {
  const state = ROOM_STATES[roomCode];
  if (!state) return;

  for (let i = 0; i < QUESTIONS.length; i += 1) {
    const q = QUESTIONS[i];
    state.questionIndex = i;
    state.phase = "LOADING";
    state.currentQuestion = q;

    io.to(roomCode).emit("phase", {
      type: "LOADING",
      questionIndex: i,
      duration: 800,
      startTime: Date.now(),
    });

    emitSessionStateToRoom(roomCode);

    await wait(800);

    io.to(roomCode).emit("questionData", {
      questionText: q.questionText,
      imageUrl: q.imageUrl,
      answers: q.answers,
    });

    await wait(50);

    state.phase = "THINK";
    io.to(roomCode).emit("phase", {
      type: "THINK",
      questionIndex: i,
      duration: 10000,
      startTime: Date.now(),
    });

    emitSessionStateToRoom(roomCode);

    await wait(10000);

    const responder = state.players[i % state.players.length];

    state.phase = "ANSWER";
    io.to(roomCode).emit("phase", {
      type: "ANSWER",
      questionIndex: i,
      activePlayerId: responder.id,
      activePlayerName: responder.firstName,
      duration: 20000,
      startTime: Date.now(),
    });

    emitSessionStateToRoom(roomCode);

    await wait(20000);

    state.phase = "RESULT";
    io.to(roomCode).emit("phase", {
      type: "RESULT",
      questionIndex: i,
      correctIndex: q.correctIndex,
      duration: 5000,
      startTime: Date.now(),
    });

    emitSessionStateToRoom(roomCode);

    await wait(5000);
  }

  state.quizEnded = true;
  state.phase = "END";
  state.success = state.score >= 4;

  io.to(roomCode).emit("quizEnd", {
    score: state.score,
    success: state.success,
  });

  state.game2.unlocked = true;
  state.game2.entryOpened = false;
  state.game2.introAccepted = false;
  state.game2.startedAt = Date.now();
  io.to(roomCode).emit("game2Available", {
    unlocked: true,
  });

  emitSessionStateToRoom(roomCode);
}

http.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
