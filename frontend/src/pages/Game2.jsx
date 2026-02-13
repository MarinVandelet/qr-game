import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";

function toAssignmentsMap(assignments) {
  const map = {};
  (assignments || []).forEach((item) => {
    if (item?.leftId && item?.rightId) {
      map[item.leftId] = item.rightId;
    }
  });
  return map;
}

function normalizeWord(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export default function Game2() {
  const { code } = useParams();
  const navigate = useNavigate();
  const isDevPreview = import.meta.env.DEV && code === "test";

  const [words, setWords] = useState(["", "", "", "", "", ""]);
  const [wordsResult, setWordsResult] = useState(null);
  const [puzzleResult, setPuzzleResult] = useState(null);

  const [unlocked, setUnlocked] = useState(false);
  const [wordsSolved, setWordsSolved] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [game3Unlocked, setGame3Unlocked] = useState(false);
  const [introAccepted, setIntroAccepted] = useState(false);
  const [ownerId, setOwnerId] = useState(null);
  const [ownerOnlyMessage, setOwnerOnlyMessage] = useState("");

  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [puzzleLocks, setPuzzleLocks] = useState({});
  const [validatedWords, setValidatedWords] = useState([]);
  const [wordValidationEntries, setWordValidationEntries] = useState([]);

  const devPairs = [
    { id: "web-dev", leftLabel: "Développeur web", rightLabel: "HTML" },
    { id: "graphic-designer", leftLabel: "Graphiste", rightLabel: "Photoshop" },
    { id: "video-editor", leftLabel: "Monteur vidéo", rightLabel: "Premiere Pro" },
    { id: "ux-designer", leftLabel: "UX UI designer", rightLabel: "Figma" },
    { id: "community-manager", leftLabel: "Community manager", rightLabel: "Canva" },
    { id: "developer-backend", leftLabel: "Développeur backend", rightLabel: "Node.js" },
  ];
  const devAcceptedToPair = useMemo(() => {
    const map = new Map();
    map.set("html", "web-dev");
    map.set("photoshop", "graphic-designer");
    map.set("premiere pro", "video-editor");
    map.set("premiere", "video-editor");
    map.set("figma", "ux-designer");
    map.set("canva", "community-manager");
    map.set("node", "developer-backend");
    map.set("node js", "developer-backend");
    map.set("node.js", "developer-backend");
    map.set("nodejs", "developer-backend");
    return map;
  }, []);

  useEffect(() => {
    socket.emit("joinRoom", code);
  }, [code]);

  useEffect(() => {
    if (!isDevPreview) return;
    setUnlocked(true);
    setLeftItems(devPairs.map((pair) => ({ id: pair.id, label: pair.leftLabel })));
    setRightItems(devPairs.map((pair) => ({ id: pair.id, label: pair.rightLabel })));
  }, [isDevPreview]);

  useEffect(() => {
    socket.on("sessionState", (session) => {
      if (!session?.hasSession) return;
      setOwnerId(session.ownerId || null);

      const game2 = session.game2 || {};
      setUnlocked(Boolean(game2.unlocked));
      setIntroAccepted(Boolean(game2.introAccepted));
      setWordsSolved(Boolean(game2.wordsSolved));
      setPuzzleSolved(Boolean(game2.puzzleSolved));
      setLeftItems(game2.leftItems || []);
      setRightItems(game2.rightItems || []);
      setAssignmentsMap(toAssignmentsMap(game2.puzzleAssignments));
      setPuzzleLocks(game2.puzzleLocks || {});
      setGame3Unlocked(Boolean(session?.game3?.unlocked));
      setValidatedWords(game2.validatedWords || []);
      setWordValidationEntries(game2.wordValidationEntries || []);

      if (Array.isArray(game2.wordEntries) && game2.wordEntries.length > 0) {
        setWords((prev) => {
          const nextWords = [...prev];
          game2.wordEntries.slice(0, 6).forEach((value, idx) => {
            nextWords[idx] = value || "";
          });
          return nextWords;
        });

        if (game2.wordEntries.some((value) => String(value || "").trim())) {
          setIntroAccepted(true);
        }
      }

      if (game2.wordsSolved) setIntroAccepted(true);
    });

    socket.on("game2Available", () => {
      setUnlocked(true);
    });

    socket.on("game2WordsResult", (payload) => {
      setWordsResult(payload);
      if (payload?.success) {
        setWordsSolved(true);
        setIntroAccepted(true);
      }
      if (Array.isArray(payload?.validatedWords)) {
        setValidatedWords(payload.validatedWords);
      }
      if (Array.isArray(payload?.entries)) {
        setWordValidationEntries(payload.entries);
      }
    });

    socket.on("game2PuzzleResult", (payload) => {
      setPuzzleResult(payload);
      if (payload?.success) {
        setPuzzleSolved(true);
      }
    });

    socket.on("game2PuzzleProgress", (payload) => {
      if (Array.isArray(payload?.assignments)) {
        setAssignmentsMap(toAssignmentsMap(payload.assignments));
      }
      if (payload?.puzzleLocks) {
        setPuzzleLocks(payload.puzzleLocks);
      }
      setPuzzleResult({
        success: Boolean(payload?.success),
        correctCount: payload?.correctCount || 0,
        total: payload?.total || 6,
      });
      if (payload?.success) setPuzzleSolved(true);
    });

    socket.on("game2Complete", () => {
      setPuzzleSolved(true);
    });

    socket.on("game2IntroStarted", () => {
      setIntroAccepted(true);
      setOwnerOnlyMessage("");
    });

    socket.on("ownerActionDenied", (payload) => {
      setOwnerOnlyMessage(
        payload?.message || "Seul le propriétaire de la partie peut lancer."
      );
    });

    socket.on("game3Available", () => {
      setGame3Unlocked(true);
    });

    return () => {
      socket.off("sessionState");
      socket.off("game2Available");
      socket.off("game2WordsResult");
      socket.off("game2PuzzleResult");
      socket.off("game2PuzzleProgress");
      socket.off("game2Complete");
      socket.off("game3Available");
      socket.off("game2IntroStarted");
      socket.off("ownerActionDenied");
    };
  }, []);

  const playerId = Number(localStorage.getItem("playerId"));
  const isOwner = ownerId && Number(ownerId) === Number(playerId);

  const lockedIndices = useMemo(
    () => words.map((_, idx) => wordValidationEntries[idx]?.status === "valid"),
    [words, wordValidationEntries]
  );

  const step = useMemo(() => {
    if (!unlocked) return "LOCKED";
    if (!introAccepted) return "INTRO";
    if (!wordsSolved) return "WORDS";
    return "PUZZLE";
  }, [unlocked, introAccepted, wordsSolved]);

  const submitWords = () => {
    if (isDevPreview) {
      const seenWords = new Set();
      const seenPairs = new Set();
      const entries = words.map((input) => {
        const normalized = normalizeWord(input);
        if (!normalized) {
          return {
            input,
            normalized,
            status: "empty",
          };
        }
        if (seenWords.has(normalized)) {
          return {
            input,
            normalized,
            status: "duplicate",
          };
        }
        seenWords.add(normalized);
        const pairId = devAcceptedToPair.get(normalized);
        if (!pairId) {
          return {
            input,
            normalized,
            status: "invalid",
          };
        }
        if (seenPairs.has(pairId)) {
          return {
            input,
            normalized,
            status: "duplicate",
          };
        }
        seenPairs.add(pairId);
        return {
          input,
          normalized,
          status: "valid",
          pairId,
        };
      });

      const validated = entries
        .filter((entry) => entry.status === "valid")
        .map((entry) => entry.normalized);
      const success = seenPairs.size === devPairs.length;
      const missingLeftLabels = devPairs
        .filter((pair) => !seenPairs.has(pair.id))
        .map((pair) => pair.leftLabel);

      setValidatedWords(validated);
      setWordsResult({
        success,
        entries,
        validatedCount: seenPairs.size,
        missingLeftLabels,
        validatedWords: validated,
      });
      setWordValidationEntries(entries);
      if (success) setWordsSolved(true);
      setIntroAccepted(true);
      return;
    }

    socket.emit("game2SubmitWords", {
      roomCode: code,
      words,
    });
  };

  const onChangeWord = (idx, value) => {
    if (lockedIndices[idx]) return;
    const nextWords = [...words];
    nextWords[idx] = value;
    setWords(nextWords);
  };

  const onChangeAssignment = (leftId, rightId) => {
    if (puzzleLocks[leftId]) return;
    setAssignmentsMap((prev) => ({
      ...prev,
      [leftId]: rightId,
    }));

    if (isDevPreview) {
      if (leftId === rightId) {
        setPuzzleLocks((prev) => ({ ...prev, [leftId]: true }));
      }
      return;
    }

    if (!isDevPreview) {
      socket.emit("game2SetPuzzleChoice", {
        roomCode: code,
        leftId,
        rightId,
      });
    }
  };

  const submitPuzzle = () => {
    if (isDevPreview) {
      const correctCount = leftItems.filter(
        (item) => assignmentsMap[item.id] === item.id
      ).length;
      const success = correctCount === leftItems.length;
      setPuzzleResult({
        success,
        correctCount,
        total: leftItems.length,
      });
      if (success) {
        setPuzzleSolved(true);
        setGame3Unlocked(true);
      }
      return;
    }

    const assignments = leftItems.map((item) => ({
      leftId: item.id,
      rightId: assignmentsMap[item.id] || "",
    }));

    socket.emit("game2SubmitPuzzle", {
      roomCode: code,
      assignments,
    });
  };

  const startGame2FromIntro = () => {
    if (isDevPreview) {
      setIntroAccepted(true);
      return;
    }

    if (!isOwner) {
      setOwnerOnlyMessage(
        "Seul le propriétaire de la partie peut lancer l'épreuve."
      );
      return;
    }

    setOwnerOnlyMessage("");
    socket.emit("game2StartFromIntro", {
      roomCode: code,
      playerId,
    });
  };

  if (step === "LOCKED") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full rounded-2xl bg-white/10 p-8 text-center">
          <h1 className="text-3xl font-bold">Jeu 2</h1>
          <p className="mt-4 opacity-90">Le Jeu 2 n&apos;est pas encore disponible.</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate(`/game/${code}`)}
            className="mt-6 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold"
          >
            Retour au Quiz
          </motion.button>
        </div>
      </div>
    );
  }

  if (step === "INTRO") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-700 via-indigo-700 to-blue-900 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl w-full rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md p-7 md:p-10"
        >
          <p className="uppercase text-xs tracking-[0.25em] opacity-80">Épreuve 2</p>
          <h1 className="text-3xl md:text-4xl font-black mt-2">Chasse aux mots QR</h1>
          <p className="mt-4 text-white/90 leading-relaxed">
            Trouvez 6 mots cachés dans la salle avec les QR codes, puis associez-les aux métiers MMI.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/10 p-4">Validation tolérante: casse et accents sont gérés.</div>
            <div className="rounded-xl bg-white/10 p-4">Chaque mot validé se verrouille automatiquement en vert.</div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: isOwner || isDevPreview ? 1.03 : 1 }}
            onClick={startGame2FromIntro}
            className="mt-6 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold"
          >
            {isOwner || isDevPreview ? "Commencer l'épreuve 2" : "Attendre le chef de salle"}
          </motion.button>
          {ownerOnlyMessage && (
            <p className="mt-3 text-sm opacity-90">{ownerOnlyMessage}</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#1d4ed8_0%,#1e3a8a_40%,#312e81_100%)] text-white flex items-center justify-center p-4">
      <div className="max-w-5xl w-full rounded-3xl bg-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-black">Jeu 2: QR Mots + Puzzle</h1>
          <span className="text-sm opacity-80">Salon {code}</span>
        </div>

        {step === "WORDS" && (
          <div>
            <h2 className="text-xl font-bold mb-2">Étape 1: Saisir les 6 mots QR</h2>
            <p className="opacity-80 mb-5">
              Les mots validés deviennent verts et verrouillés automatiquement.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {words.map((word, idx) => {
                const locked = lockedIndices[idx];
                return (
                  <div key={idx} className="rounded-xl bg-white/5 p-2 border border-white/10">
                    <input
                      value={word}
                      onChange={(event) => onChangeWord(idx, event.target.value)}
                      className={`w-full rounded-xl px-4 py-3 outline-none transition ${
                        locked
                          ? "bg-emerald-400 text-emerald-950 font-semibold"
                          : "bg-white text-blue-950"
                      }`}
                      placeholder={`Mot ${idx + 1}`}
                      disabled={locked}
                    />
                  </div>
                );
              })}
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={submitWords}
              className="mt-6 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold"
            >
              Valider les mots
            </motion.button>

            {wordsResult && (
              <div className="mt-5 rounded-xl bg-white/10 p-4 border border-white/20">
                <p className="font-semibold">
                  {wordsResult.success
                    ? "6 mots validés. Passez au puzzle."
                    : `Mots validés: ${wordsResult.validatedCount || 0}/6`}
                </p>
                {Array.isArray(wordsResult.missingLeftLabels) &&
                  wordsResult.missingLeftLabels.length > 0 && (
                    <p className="text-sm opacity-85 mt-2">
                      Métiers encore manquants: {wordsResult.missingLeftLabels.join(", ")}
                    </p>
                  )}
              </div>
            )}
          </div>
        )}

        {step === "PUZZLE" && (
          <div>
            <h2 className="text-xl font-bold mb-2">Étape 2: Associer métier et outil</h2>
            <p className="opacity-80 mb-5">
              Associez chaque métier MMI avec le bon outil/compétence.
            </p>

            <div className="space-y-3">
              {leftItems.map((item) => (
                <div
                  key={item.id}
                  className={`grid grid-cols-1 md:grid-cols-2 gap-3 items-center rounded-xl p-4 border ${
                    puzzleLocks[item.id]
                      ? "bg-emerald-500/30 border-emerald-200/40"
                      : "bg-white/10 border-white/20"
                  }`}
                >
                  <div className="font-semibold">{item.label}</div>
                  <select
                    className={`rounded-lg px-3 py-2 text-blue-950 ${
                      puzzleLocks[item.id] ? "bg-emerald-200 font-semibold" : ""
                    }`}
                    value={assignmentsMap[item.id] || ""}
                    onChange={(event) => onChangeAssignment(item.id, event.target.value)}
                    disabled={Boolean(puzzleLocks[item.id])}
                  >
                    <option value="">Choisir une réponse</option>
                    {rightItems.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={submitPuzzle}
              className="mt-6 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold"
            >
              Valider le puzzle
            </motion.button>

            {puzzleResult && (
              <div className="mt-5 rounded-xl bg-white/10 p-4 border border-white/20">
                <p className="font-semibold">
                  {puzzleResult.success
                    ? "Puzzle réussi. Bravo !"
                    : `Associations correctes: ${puzzleResult.correctCount || 0}/${puzzleResult.total || 6}`}
                </p>
              </div>
            )}

            {puzzleSolved && (
              <div className="mt-4 rounded-xl bg-emerald-500/30 p-4 font-semibold border border-emerald-300/30">
                Jeu 2 terminé. Equipe gagnante.
              </div>
            )}

            {puzzleSolved && game3Unlocked && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => navigate(`/game3/${code}`)}
                className="mt-4 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold"
              >
                Continuer vers Jeu 3
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
