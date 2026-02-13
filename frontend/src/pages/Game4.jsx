import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";

const PHASES = {
  LOADING: "LOADING",
  THINK: "THINK",
  ANSWER: "ANSWER",
  RESULT: "RESULT",
  END: "END",
};

export default function Game4() {
  const { code } = useParams();
  const navigate = useNavigate();
  const playerId = Number(localStorage.getItem("playerId"));

  const [unlocked, setUnlocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [finalResults, setFinalResults] = useState(null);

  const [phase, setPhase] = useState(PHASES.LOADING);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState(null);

  const [activePlayerId, setActivePlayerId] = useState(null);
  const [activePlayerName, setActivePlayerName] = useState("");

  const [chosenIndex, setChosenIndex] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);

  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(6);

  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(1);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((v) => v + 1), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.emit("joinRoom", code);
  }, [code]);

  useEffect(() => {
    socket.on("sessionState", (session) => {
      if (!session?.hasSession) return;
      const game4 = session.game4 || {};

      setUnlocked(Boolean(game4.unlocked));
      setStarted(Boolean(game4.started));
      setEnded(Boolean(game4.ended));

      if (typeof game4.questionIndex === "number") {
        setQuestionIndex(game4.questionIndex);
      }
      if (game4.currentQuestion) {
        setQuestion(game4.currentQuestion);
      }
      if (game4.phase) {
        setPhase(game4.phase);
      }

      setActivePlayerId(game4.activePlayerId || null);
      setActivePlayerName(game4.activePlayerName || "");
      setChosenIndex(
        typeof game4.chosenIndex === "number" ? game4.chosenIndex : null
      );
      setCorrectIndex(
        typeof game4.correctIndex === "number" ? game4.correctIndex : null
      );
      setScore(Number(game4.score || 0));
      if (session?.finalResults) {
        setFinalResults(session.finalResults);
        if (game4.ended) {
          navigate(`/final/${code}`, { state: { finalResults: session.finalResults } });
        }
      }
    });

    socket.on("game4Available", () => setUnlocked(true));
    socket.on("game4Start", () => setStarted(true));

    socket.on("game4QuestionData", (payload) => {
      setQuestion(payload);
      setChosenIndex(null);
      setCorrectIndex(null);
    });

    socket.on("game4Phase", (payload) => {
      setPhase(payload.type);
      if (typeof payload.questionIndex === "number") {
        setQuestionIndex(payload.questionIndex);
      }
      setActivePlayerId(payload.activePlayerId || null);
      setActivePlayerName(payload.activePlayerName || "");
      setDuration(payload.duration || 1);
      setStartTime(payload.startTime || null);
    });

    socket.on("game4AnswerResult", (payload) => {
      setChosenIndex(
        typeof payload.chosenIndex === "number" ? payload.chosenIndex : null
      );
      setCorrectIndex(
        typeof payload.correctIndex === "number" ? payload.correctIndex : null
      );
    });

    socket.on("game4End", (payload) => {
      setEnded(true);
      setPhase(PHASES.END);
      setScore(Number(payload.score || 0));
      setTotal(Number(payload.total || 6));
      setFinalResults(payload.finalResults || null);
      navigate(`/final/${code}`, { state: { finalResults: payload.finalResults || null } });
    });

    return () => {
      socket.off("sessionState");
      socket.off("game4Available");
      socket.off("game4Start");
      socket.off("game4QuestionData");
      socket.off("game4Phase");
      socket.off("game4AnswerResult");
      socket.off("game4End");
    };
  }, []);

  const computeProgress = () => {
    if (!startTime) return 1;
    const elapsed = Date.now() - startTime;
    const p = 1 - elapsed / duration;
    return Math.max(0, Math.min(1, p));
  };

  const progress = computeProgress();

  const isMyTurn = Number(playerId) === Number(activePlayerId);

  const launchGame4 = () => {
    socket.emit("startGame4", code);
  };

  const sendAnswer = (index) => {
    if (!isMyTurn || phase !== PHASES.ANSWER) return;
    setChosenIndex(index);
    socket.emit("game4Answer", {
      roomCode: code,
      playerId,
      chosenIndex: index,
    });
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 to-cyan-700 text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full rounded-2xl bg-white/10 p-8 text-center">
          <h1 className="text-3xl font-bold">Jeu 4</h1>
          <p className="mt-4 opacity-90">Le Jeu 4 sera disponible apres le Jeu 3.</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => navigate(`/game3/${code}`)}
            className="mt-6 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold"
          >
            Retour au Jeu 3
          </motion.button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 to-cyan-700 text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full rounded-2xl bg-white/10 p-8 text-center">
          <h1 className="text-3xl font-bold">Jeu 4 - Quiz Final</h1>
          <p className="mt-4 opacity-90">6 questions, sans images.</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            onClick={launchGame4}
            className="mt-6 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold"
          >
            Lancer le Jeu 4
          </motion.button>
        </div>
      </div>
    );
  }

  if (ended && !finalResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 to-cyan-700 text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full rounded-2xl bg-white/10 p-8 text-center">
          <h1 className="text-3xl font-bold">Fin du Jeu 4</h1>
          <p className="mt-4 text-xl">Score equipe: {score}/{total}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 to-cyan-700 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white/10 rounded-3xl shadow-2xl p-6 md:p-8 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 text-sm opacity-90">
          <span>Salon: {code}</span>
          <span>Question {questionIndex + 1} / 6</span>
        </div>

        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full ${
              phase === PHASES.THINK
                ? "bg-yellow-300"
                : phase === PHASES.ANSWER
                ? "bg-green-400"
                : "bg-red-400"
            }`}
            style={{ width: `${progress * 100}%`, transition: "width 0.1s linear" }}
          />
        </div>

        {question && (
          <h1 className="text-2xl md:text-3xl font-extrabold mb-5 text-center">
            {question.questionText}
          </h1>
        )}

        {phase === PHASES.THINK && (
          <p className="text-center text-lg opacity-85">Reflechissez...</p>
        )}
        {phase === PHASES.ANSWER && (
          <p className="text-center text-lg opacity-85 mb-4">
            C&apos;est au tour de <b>{activePlayerName}</b>
          </p>
        )}
        {phase === PHASES.RESULT && (
          <p className="text-center text-lg opacity-85 mb-4">Resultat...</p>
        )}

        {question && (
          <div className="space-y-3 mt-4">
            {phase === PHASES.ANSWER &&
              question.answers.map((ans, i) => {
                const isSelected = chosenIndex === i;
                return (
                  <motion.button
                    key={i}
                    whileTap={isMyTurn ? { scale: 0.96 } : {}}
                    onClick={() => sendAnswer(i)}
                    disabled={!isMyTurn}
                    className={`w-full py-3 rounded-xl text-left px-4 font-semibold shadow ${
                      isSelected
                        ? "bg-blue-400 text-blue-900"
                        : "bg-white/80 text-blue-900"
                    } disabled:opacity-50`}
                  >
                    {String.fromCharCode(65 + i)}) {ans}
                  </motion.button>
                );
              })}

            {phase === PHASES.RESULT &&
              question.answers.map((ans, i) => {
                const good = i === correctIndex;
                const bad = chosenIndex === i && !good;
                return (
                  <div
                    key={i}
                    className={`w-full py-3 rounded-xl px-4 font-semibold shadow text-left ${
                      good
                        ? "bg-green-400 text-green-900"
                        : bad
                        ? "bg-red-400 text-red-900"
                        : "bg-white/80 text-blue-900"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}) {ans}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
