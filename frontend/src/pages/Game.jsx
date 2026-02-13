import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";

const QUESTION_PHASES = {
  INTRO: "INTRO",
  THINK: "THINK",
  ANSWER: "ANSWER",
  RESULT: "RESULT",
  END: "END",
};

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState(QUESTION_PHASES.THINK);
  const [questionIndex, setQuestionIndex] = useState(0);

  const [question, setQuestion] = useState(null);

  const [activePlayerId, setActivePlayerId] = useState(null);
  const [activePlayerName, setActivePlayerName] = useState("");

  const [chosenIndex, setChosenIndex] = useState(null);
  const [correctIndex, setCorrectIndex] = useState(null);

  const [quizEnded, setQuizEnded] = useState(false);
  const [score, setScore] = useState(0);
  const [success, setSuccess] = useState(false);
  const [game2Unlocked, setGame2Unlocked] = useState(false);
  const [introLaunched, setIntroLaunched] = useState(false);

  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(1);

  const [, setForce] = useState(0);

  const playerId = Number(localStorage.getItem("playerId"));

  useEffect(() => {
    const interval = setInterval(() => setForce((x) => x + 1), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.emit("joinRoom", code);
  }, [code]);

  useEffect(() => {
    socket.on("questionData", (q) => {
      setQuestion(q);
      setChosenIndex(null);
      setCorrectIndex(null);
    });

    socket.on("phase", (data) => {
      setPhase(data.type);
      setQuestionIndex(data.questionIndex || 0);
      setActivePlayerId(data.activePlayerId || null);
      setActivePlayerName(data.activePlayerName || "");
      setDuration(data.duration || 1);
      setStartTime(data.startTime || null);
    });

    socket.on("answerResult", (data) => {
      setCorrectIndex(data.correctIndex);
      setChosenIndex(data.chosenIndex);
    });

    socket.on("quizEnd", (data) => {
      setQuizEnded(true);
      setScore(data.score);
      setSuccess(data.success);
      setPhase(QUESTION_PHASES.END);
    });

    socket.on("game2Available", () => {
      setGame2Unlocked(true);
    });

    socket.on("sessionState", (session) => {
      if (!session?.hasSession) return;

      const quizState = session.quiz || {};

      if (quizState.currentQuestion) {
        setQuestion(quizState.currentQuestion);
      }

      if (typeof quizState.questionIndex === "number") {
        setQuestionIndex(quizState.questionIndex);
      }

      if (quizState.phase) {
        setPhase(quizState.phase);
      }

      if (quizState.quizEnded) {
        setQuizEnded(true);
        setScore(quizState.score || 0);
        setSuccess(Boolean(quizState.success));
      }

      if (session?.game2?.unlocked) {
        setGame2Unlocked(true);
      }
    });

    return () => {
      socket.off("questionData");
      socket.off("phase");
      socket.off("answerResult");
      socket.off("quizEnd");
      socket.off("game2Available");
      socket.off("sessionState");
    };
  }, []);

  const computeProgress = () => {
    if (!startTime) return 1;
    const elapsed = Date.now() - startTime;
    let progress = 1 - elapsed / duration;
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
    return progress;
  };

  const progress = computeProgress();

  const sendAnswer = (index) => {
    if (playerId !== activePlayerId) return;
    setChosenIndex(index);
    socket.emit("answer", {
      roomCode: code,
      playerId,
      chosenIndex: index,
    });
  };

  const launchQuizFromIntro = () => {
    if (introLaunched) return;
    setIntroLaunched(true);
    socket.emit("startQuizFromIntro", code);
  };

  if (quizEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-800 flex items-center justify-center p-6 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/20 p-10 rounded-3xl backdrop-blur-md shadow-xl text-center max-w-lg w-full"
        >
          <h1 className="text-3xl font-bold mb-4">Fin du Quiz</h1>

          <p className="text-xl opacity-90 mb-2">
            Score de l&apos;equipe : <b>{score}/6</b>
          </p>

          <p className="text-xl opacity-90 mb-6">
            {success
              ? "Quiz valide. Le Jeu 2 est disponible."
              : "Quiz termine. Passez au Jeu 2."}
          </p>

          {game2Unlocked ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(`/game2/${code}`)}
              className="bg-white text-blue-800 px-6 py-3 rounded-xl shadow-lg font-bold w-full"
            >
              Continuer vers Jeu 2
            </motion.button>
          ) : (
            <p className="text-sm opacity-80">Deblocage du Jeu 2 en cours...</p>
          )}
        </motion.div>
      </div>
    );
  }

  if (phase === "LOADING") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 to-purple-700 flex items-center justify-center p-4 text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xl opacity-90"
        >
          Preparation de la question...
        </motion.div>
      </div>
    );
  }

  if (phase === QUESTION_PHASES.INTRO) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-blue-700 to-cyan-600 flex items-center justify-center p-4 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-7 md:p-10"
        >
          <p className="uppercase text-xs tracking-[0.25em] opacity-80">Épreuve 1</p>
          <h1 className="text-3xl md:text-4xl font-black mt-2">Quiz découverte</h1>
          <p className="mt-4 text-white/90 leading-relaxed">
            6 questions. Une seule personne répond par tour. Observez l&apos;image, échangez
            rapidement, puis validez la meilleure réponse au bon moment.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-white/10 p-3">Temps de réflexion: 10s</div>
            <div className="rounded-xl bg-white/10 p-3">Temps de réponse: 20s</div>
            <div className="rounded-xl bg-white/10 p-3">Objectif: débloquer l&apos;épreuve 2</div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: introLaunched ? 1 : 1.03 }}
            onClick={launchQuizFromIntro}
            disabled={introLaunched}
            className="mt-6 bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold disabled:opacity-60"
          >
            {introLaunched ? "Lancement..." : "Commencer l'épreuve 1"}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-purple-700 flex items-center justify-center p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between mb-4 text-sm opacity-90">
          <span>Salon : {code}</span>
          <span>Question {questionIndex + 1} / 6</span>
        </div>

        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full ${
              phase === QUESTION_PHASES.THINK
                ? "bg-yellow-300"
                : phase === QUESTION_PHASES.ANSWER
                ? "bg-green-400"
                : "bg-red-400"
            }`}
            style={{
              width: `${progress * 100}%`,
              transition: "width 0.1s linear",
            }}
          />
        </div>

        {question && (
          <>
            <h1 className="text-2xl md:text-3xl font-extrabold mb-3 text-center">
              {question.questionText}
            </h1>

            {question.imageUrl && (
              <div className="bg-white rounded-2xl p-4 flex items-center justify-center shadow-inner mb-6">
                <img src={question.imageUrl} alt="" className="max-h-40 object-contain" />
              </div>
            )}
          </>
        )}

        {phase === QUESTION_PHASES.THINK && (
          <p className="text-center text-lg opacity-80">
            Reflechis... les reponses arrivent bientot.
          </p>
        )}

        {phase === QUESTION_PHASES.ANSWER && (
          <p className="text-center text-lg opacity-80 mb-4">
            C&apos;est au tour de <b>{activePlayerName}</b>
          </p>
        )}

        {phase === QUESTION_PHASES.RESULT && (
          <p className="text-center text-lg opacity-80 mb-4">Resultat...</p>
        )}

        {question && (
          <div className="mt-6 space-y-4">
            {phase === QUESTION_PHASES.ANSWER &&
              question.answers.map((ans, i) => {
                const isSelected = chosenIndex === i;

                return (
                  <motion.button
                    key={i}
                    whileTap={playerId === activePlayerId ? { scale: 0.95 } : {}}
                    onClick={() => sendAnswer(i)}
                    disabled={playerId !== activePlayerId}
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

            {phase === QUESTION_PHASES.RESULT &&
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
      </motion.div>
    </div>
  );
}

