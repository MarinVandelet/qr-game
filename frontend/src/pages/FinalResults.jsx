import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";

export default function FinalResults() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [finalResults, setFinalResults] = useState(location.state?.finalResults || null);

  useEffect(() => {
    socket.emit("joinRoom", code);

    socket.on("sessionState", (session) => {
      if (session?.finalResults) {
        setFinalResults(session.finalResults);
      }
    });

    return () => {
      socket.off("sessionState");
    };
  }, [code]);

  if (!finalResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-emerald-700 text-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full rounded-2xl bg-white/10 p-8 text-center">
          <h1 className="text-3xl font-bold">Resultats finaux</h1>
          <p className="mt-4 opacity-90">Calcul du score en cours...</p>
        </div>
      </div>
    );
  }

  const { total, breakdown, raw } = finalResults;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-emerald-700 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full rounded-3xl bg-white/10 backdrop-blur-md p-6 md:p-8 shadow-2xl"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-center">Fin de parcours</h1>
        <p className="text-center opacity-90 mt-2">Salon {code}</p>

        <div className="mt-6 rounded-2xl bg-white/15 p-5 text-center">
          <p className="text-sm uppercase tracking-wider opacity-80">Score final</p>
          <p className="text-6xl font-black mt-1">{total}<span className="text-2xl">/100</span></p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-xl bg-white/10 p-4 flex items-center justify-between">
            <span>Quiz 1</span>
            <span className="font-bold">{breakdown.quiz1Points}/40 ({raw.quiz1Score}/{raw.quiz1Total})</span>
          </div>
          <div className="rounded-xl bg-white/10 p-4 flex items-center justify-between">
            <span>Jeu 2 (temps)</span>
            <span className="font-bold">{breakdown.game2TimePoints}/10 ({raw.game2DurationSec ?? "-"}s)</span>
          </div>
          <div className="rounded-xl bg-white/10 p-4 flex items-center justify-between">
            <span>Jeu 3 (temps)</span>
            <span className="font-bold">{breakdown.game3TimePoints}/10 ({raw.game3DurationSec ?? "-"}s)</span>
          </div>
          <div className="rounded-xl bg-white/10 p-4 flex items-center justify-between">
            <span>Quiz 4</span>
            <span className="font-bold">{breakdown.game4Points}/40 ({raw.game4Score}/{raw.game4Total})</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate("/menu")}
          className="mt-6 w-full bg-white text-slate-900 py-3 rounded-xl font-semibold"
        >
          Retour au menu
        </motion.button>
      </motion.div>
    </div>
  );
}