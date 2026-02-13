import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";

export default function Game3() {
  const { code } = useParams();
  const navigate = useNavigate();
  const playerId = Number(localStorage.getItem("playerId"));

  const [unlocked, setUnlocked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [total, setTotal] = useState(10);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [activePlayerName, setActivePlayerName] = useState("");
  const [inputWord, setInputWord] = useState("");
  const [feedback, setFeedback] = useState("");
  const [solvedEntries, setSolvedEntries] = useState([]);
  const [game4Unlocked, setGame4Unlocked] = useState(false);

  useEffect(() => {
    socket.emit("joinRoom", code);
  }, [code]);

  useEffect(() => {
    socket.on("sessionState", (session) => {
      if (!session?.hasSession) return;

      const game3 = session.game3 || {};
      setUnlocked(Boolean(game3.unlocked));
      setCompleted(Boolean(game3.completed));
      setCurrentIndex(Number(game3.currentIndex || 0));
      setTotal(Number(game3.total || 10));
      setActivePlayerId(game3.activePlayerId || null);
      setActivePlayerName(game3.activePlayerName || "");
      setSolvedEntries(game3.solvedEntries || []);
      setGame4Unlocked(Boolean(session?.game4?.unlocked));
    });

    socket.on("game3Available", () => {
      setUnlocked(true);
    });

    socket.on("game3Progress", (payload) => {
      if (payload?.error) {
        setFeedback(payload.error);
        return;
      }

      setCompleted(Boolean(payload.completed));
      if (typeof payload.currentIndex === "number") {
        setCurrentIndex(payload.currentIndex);
      }
      if (typeof payload.total === "number") {
        setTotal(payload.total);
      }
      setActivePlayerId(payload.activePlayerId || null);
      setActivePlayerName(payload.activePlayerName || "");
      setFeedback(payload.message || "");

      if (payload.success) {
        setInputWord("");
      }
    });

    socket.on("game3Complete", () => {
      setCompleted(true);
      setFeedback("Jeu 3 termine. Bravo.");
    });

    socket.on("game4Available", () => {
      setGame4Unlocked(true);
    });

    return () => {
      socket.off("sessionState");
      socket.off("game3Available");
      socket.off("game3Progress");
      socket.off("game3Complete");
      socket.off("game4Available");
    };
  }, []);

  const isMyTurn = useMemo(() => {
    if (!activePlayerId) return false;
    return Number(playerId) === Number(activePlayerId);
  }, [activePlayerId, playerId]);

  const submitWord = () => {
    socket.emit("game3SubmitWord", {
      roomCode: code,
      playerId,
      word: inputWord,
    });
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-700 to-cyan-800 text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full rounded-2xl bg-white/10 p-8 text-center">
          <h1 className="text-3xl font-bold">Jeu 3</h1>
          <p className="mt-4 opacity-90">Le Jeu 3 sera disponible apres le Jeu 2.</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate(`/game2/${code}`)}
            className="mt-6 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold"
          >
            Retour au Jeu 2
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 to-cyan-800 text-white flex items-center justify-center p-4">
      <div className="max-w-3xl w-full rounded-2xl bg-white/10 p-6 md:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl md:text-3xl font-bold">Jeu 3: Enigmes</h1>
          <span className="text-sm opacity-80">Salon {code}</span>
        </div>

        <div className="rounded-xl bg-white/10 p-4 mb-4">
          <p className="text-lg font-semibold">Enigme {Math.min(currentIndex + 1, total)} / {total}</p>
          <p className="text-sm opacity-85 mt-2">
            {completed
              ? "Toutes les enigmes sont validees."
              : `Tour de: ${activePlayerName || "..."}`}
          </p>
        </div>

        {!completed && (
          <div className="rounded-xl bg-white/10 p-4">
            <label className="block text-sm opacity-85 mb-2">Entrez le mot de l&apos;enigme en cours</label>
            <input
              type="text"
              value={inputWord}
              onChange={(event) => setInputWord(event.target.value)}
              className="w-full rounded-xl px-4 py-3 bg-white text-blue-950 outline-none"
              placeholder="Votre reponse"
              disabled={!isMyTurn}
            />

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: isMyTurn ? 1.03 : 1 }}
              onClick={submitWord}
              disabled={!isMyTurn}
              className="mt-4 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              Valider le mot
            </motion.button>

            {!isMyTurn && (
              <p className="text-sm opacity-80 mt-3">Attendez votre tour pour saisir un mot.</p>
            )}
          </div>
        )}

        {feedback && (
          <div className="mt-4 rounded-xl bg-white/10 p-4 text-sm font-medium">{feedback}</div>
        )}

        <div className="mt-4 rounded-xl bg-white/10 p-4">
          <p className="font-semibold">Progression: {solvedEntries.length}/{total}</p>
        </div>

        {completed && game4Unlocked && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate(`/game4/${code}`)}
            className="mt-4 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold"
          >
            Continuer vers Jeu 4
          </motion.button>
        )}
      </div>
    </div>
  );
}
