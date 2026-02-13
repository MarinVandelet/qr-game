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

export default function Game2() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [words, setWords] = useState(["", "", "", "", "", ""]);
  const [wordsResult, setWordsResult] = useState(null);
  const [puzzleResult, setPuzzleResult] = useState(null);

  const [unlocked, setUnlocked] = useState(false);
  const [wordsSolved, setWordsSolved] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [game3Unlocked, setGame3Unlocked] = useState(false);

  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [assignmentsMap, setAssignmentsMap] = useState({});

  useEffect(() => {
    socket.emit("joinRoom", code);
  }, [code]);

  useEffect(() => {
    socket.on("sessionState", (session) => {
      if (!session?.hasSession) return;

      const game2 = session.game2 || {};
      setUnlocked(Boolean(game2.unlocked));
      setWordsSolved(Boolean(game2.wordsSolved));
      setPuzzleSolved(Boolean(game2.puzzleSolved));
      setLeftItems(game2.leftItems || []);
      setRightItems(game2.rightItems || []);
      setAssignmentsMap(toAssignmentsMap(game2.puzzleAssignments));
      setGame3Unlocked(Boolean(session?.game3?.unlocked));

      if (Array.isArray(game2.wordEntries) && game2.wordEntries.length > 0) {
        setWords((prev) => {
          const nextWords = [...prev];
          game2.wordEntries.slice(0, 6).forEach((value, idx) => {
            nextWords[idx] = value || "";
          });
          return nextWords;
        });
      }
    });

    socket.on("game2Available", () => {
      setUnlocked(true);
    });

    socket.on("game2WordsResult", (payload) => {
      setWordsResult(payload);
      if (payload?.success) {
        setWordsSolved(true);
      }
    });

    socket.on("game2PuzzleResult", (payload) => {
      setPuzzleResult(payload);
      if (payload?.success) {
        setPuzzleSolved(true);
      }
    });

    socket.on("game2Complete", () => {
      setPuzzleSolved(true);
    });

    socket.on("game3Available", () => {
      setGame3Unlocked(true);
    });

    return () => {
      socket.off("sessionState");
      socket.off("game2Available");
      socket.off("game2WordsResult");
      socket.off("game2PuzzleResult");
      socket.off("game2Complete");
      socket.off("game3Available");
    };
  }, []);

  const step = useMemo(() => {
    if (!unlocked) return "LOCKED";
    if (!wordsSolved) return "WORDS";
    return "PUZZLE";
  }, [unlocked, wordsSolved]);

  const submitWords = () => {
    socket.emit("game2SubmitWords", {
      roomCode: code,
      words,
    });
  };

  const onChangeWord = (idx, value) => {
    const nextWords = [...words];
    nextWords[idx] = value;
    setWords(nextWords);
  };

  const onChangeAssignment = (leftId, rightId) => {
    setAssignmentsMap((prev) => ({
      ...prev,
      [leftId]: rightId,
    }));
  };

  const submitPuzzle = () => {
    const assignments = leftItems.map((item) => ({
      leftId: item.id,
      rightId: assignmentsMap[item.id] || "",
    }));

    socket.emit("game2SubmitPuzzle", {
      roomCode: code,
      assignments,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full rounded-2xl bg-white/10 p-6 md:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Jeu 2: QR Mots + Puzzle</h1>
          <span className="text-sm opacity-80">Salon {code}</span>
        </div>

        {step === "WORDS" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Etape 1: Saisir les 6 mots QR</h2>
            <p className="opacity-80 mb-5">
              Entrez les 6 mots trouves dans la salle. La validation est tolerante.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {words.map((word, idx) => (
                <input
                  key={idx}
                  value={word}
                  onChange={(event) => onChangeWord(idx, event.target.value)}
                  className="w-full rounded-xl px-4 py-3 bg-white text-blue-950 outline-none"
                  placeholder={`Mot ${idx + 1}`}
                />
              ))}
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
              <div className="mt-5 rounded-xl bg-white/10 p-4">
                <p className="font-semibold">
                  {wordsResult.success
                    ? "6 mots valides. Passez au puzzle."
                    : `Mots valides: ${wordsResult.validatedCount || 0}/6`}
                </p>
                {Array.isArray(wordsResult.missingLeftLabels) &&
                  wordsResult.missingLeftLabels.length > 0 && (
                    <p className="text-sm opacity-85 mt-2">
                      Metiers encore manquants: {wordsResult.missingLeftLabels.join(", ")}
                    </p>
                  )}
              </div>
            )}
          </div>
        )}

        {step === "PUZZLE" && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Etape 2: Associer metier et outil</h2>
            <p className="opacity-80 mb-5">
              Associez chaque metier MMI avec le bon outil/competence.
            </p>

            <div className="space-y-3">
              {leftItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center rounded-xl bg-white/10 p-3"
                >
                  <div className="font-medium">{item.label}</div>
                  <select
                    className="rounded-lg px-3 py-2 text-blue-950"
                    value={assignmentsMap[item.id] || ""}
                    onChange={(event) => onChangeAssignment(item.id, event.target.value)}
                  >
                    <option value="">Choisir une reponse</option>
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
              <div className="mt-5 rounded-xl bg-white/10 p-4">
                <p className="font-semibold">
                  {puzzleResult.success
                    ? "Puzzle reussi. Bravo !"
                    : `Associations correctes: ${puzzleResult.correctCount || 0}/${puzzleResult.total || 6}`}
                </p>
              </div>
            )}

            {puzzleSolved && (
              <div className="mt-4 rounded-xl bg-green-500/30 p-4 font-semibold">
                Jeu 2 termine. Equipe gagnante.
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
