import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { FiCopy, FiPlay, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { socket } from "../socket";

export default function WaitingRoom() {
  const navigate = useNavigate();
  const code = window.location.pathname.split("/").pop();

  const [players, setPlayers] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);

  const playerId = Number(localStorage.getItem("playerId"));

  const fetchPlayers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/room/players/${code}`);
      setPlayers(res.data.players || []);
      setOwnerId(res.data.ownerId);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.emit("joinRoom", code);

    socket.on("gameStart", () => navigate(`/game/${code}`));

    socket.on("sessionState", (session) => {
      if (session?.finalResults) return navigate(`/final/${code}`);
      if (session?.game4?.unlocked) return navigate(`/game4/${code}`);
      if (session?.game3?.unlocked) return navigate(`/game3/${code}`);
      if (session?.quiz?.started && !session?.quiz?.quizEnded) return navigate(`/game/${code}`);
      if (session?.quiz?.quizEnded && session?.game2?.unlocked) return navigate(`/game2/${code}`);
    });

    return () => {
      socket.off("gameStart");
      socket.off("sessionState");
    };
  }, [code, navigate]);

  const isOwner = ownerId && playerId === ownerId;

  const handleStart = () => {
    socket.emit("startGame", code);
  };

  return (
    <div className="app-shell text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-xl p-6 md:p-7"
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <h1 className="text-3xl font-extrabold">Salle d&apos;attente</h1>
          <span className="badge"><FiUsers /> {players.length} joueurs</span>
        </div>

        <div className="rounded-2xl bg-white/10 border border-white/20 p-4 flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-xs soft-text uppercase tracking-[0.2em]">Code</p>
            <p className="font-black text-3xl tracking-[0.2em]">{code}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigator.clipboard.writeText(code)}
            className="secondary-btn p-3"
            title="Copier"
          >
            <FiCopy size={18} />
          </motion.button>
        </div>

        {loading && <p className="soft-text">Chargement des joueurs...</p>}

        {!loading && (
          <>
            <div className="space-y-2.5">
              {players.length === 0 && (
                <p className="soft-text text-sm">En attente des premiers joueurs...</p>
              )}

              {players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/90 text-blue-900 py-2.5 px-4 rounded-xl shadow flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      {p.firstName[0]}
                    </div>
                    <span className="font-medium">
                      {p.firstName} {p.lastName}
                    </span>
                  </div>

                  {p.id === ownerId && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-300 text-yellow-900">
                      Chef
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-6">
              {isOwner ? (
                <>
                  <p className="mb-3 text-sm soft-text">
                    Tu es chef du salon. Lance la partie quand tout le monde est prêt.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={handleStart}
                    className="primary-btn w-full inline-flex justify-center items-center gap-2"
                  >
                    <FiPlay /> Lancer la partie
                  </motion.button>
                </>
              ) : (
                <p className="text-sm soft-text">En attente du chef du salon...</p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}