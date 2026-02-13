import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiAward, FiClock, FiHome, FiTarget } from "react-icons/fi";
import { socket } from "../socket";

export default function FinalResults() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [finalResults, setFinalResults] = useState(location.state?.finalResults || null);

  useEffect(() => {
    socket.emit("joinRoom", code);
    socket.on("sessionState", (session) => {
      if (session?.finalResults) setFinalResults(session.finalResults);
    });

    return () => socket.off("sessionState");
  }, [code]);

  if (!finalResults) {
    return (
      <div className="app-shell text-white">
        <div className="glass-card max-w-xl p-8 text-center">
          <h1 className="text-3xl font-bold">Résultats finaux</h1>
          <p className="soft-text mt-3">Calcul du score en cours...</p>
        </div>
      </div>
    );
  }

  const { total, breakdown, raw } = finalResults;

  return (
    <div className="app-shell text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-2xl p-6 md:p-8"
      >
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl md:text-4xl font-extrabold">Fin de parcours</h1>
          <span className="badge">Salon {code}</span>
        </div>

        <div className="rounded-2xl bg-white/15 border border-white/20 p-5 text-center">
          <p className="text-sm uppercase tracking-wider soft-text">Score final</p>
          <p className="text-6xl font-black mt-1 inline-flex items-end gap-2">
            {total}
            <span className="text-2xl soft-text">/100</span>
          </p>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-300" style={{ width: `${total}%` }} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-xl bg-white/10 border border-white/20 p-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-2"><FiTarget /> Quiz 1</span>
            <span className="font-bold">{breakdown.quiz1Points}/40 ({raw.quiz1Score}/{raw.quiz1Total})</span>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/20 p-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-2"><FiClock /> Jeu 2 (temps)</span>
            <span className="font-bold">{breakdown.game2TimePoints}/10 ({raw.game2DurationSec ?? "-"}s)</span>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/20 p-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-2"><FiClock /> Jeu 3 (temps)</span>
            <span className="font-bold">{breakdown.game3TimePoints}/10 ({raw.game3DurationSec ?? "-"}s)</span>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/20 p-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-2"><FiAward /> Quiz 4</span>
            <span className="font-bold">{breakdown.game4Points}/40 ({raw.game4Score}/{raw.game4Total})</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate("/menu")}
          className="primary-btn w-full mt-6 inline-flex justify-center items-center gap-2"
        >
          <FiHome /> Retour au menu
        </motion.button>
      </motion.div>
    </div>
  );
}