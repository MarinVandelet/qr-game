import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { FiCopy } from "react-icons/fi";
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

  // Charger les joueurs depuis l’API (polling)
  const fetchPlayers = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/room/players/${code}`
      );
      setPlayers(res.data.players || []);
      setOwnerId(res.data.ownerId);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Fetch toutes les 1.5s
  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 1500);
    return () => clearInterval(interval);
  }, []);

  // Connexion au salon Socket.io
  useEffect(() => {
    socket.emit("joinRoom", code);

    // Le serveur lance la partie (tous les joueurs sont redirigés)
    socket.on("gameStart", () => {
      navigate(`/game/${code}`);
    });

    socket.on("sessionState", (session) => {
      if (session?.finalResults) {
        navigate(`/final/${code}`);
        return;
      }
      if (session?.game4?.unlocked) {
        navigate(`/game4/${code}`);
        return;
      }
      if (session?.game3?.unlocked) {
        navigate(`/game3/${code}`);
        return;
      }
      if (session?.quiz?.started && !session?.quiz?.quizEnded) {
        navigate(`/game/${code}`);
      }
      if (session?.quiz?.quizEnded && session?.game2?.unlocked) {
        navigate(`/game2/${code}`);
      }
    });

    return () => {
      socket.off("gameStart");
      socket.off("sessionState");
    };
  }, [code, navigate]);

  const isOwner = ownerId && playerId === ownerId;

  // Le chef lance la partie
  const handleStart = () => {
    socket.emit("startGame", code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-blue-950 flex items-center justify-center p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <p className="uppercase tracking-[0.2em] text-sm opacity-80">
          Salon
        </p>
        <h1 className="text-3xl font-extrabold mb-2 mt-1">
          Salle d&apos;attente
        </h1>

        {/* Code + copie */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mt-2 mb-6">
          <span className="text-sm opacity-80">Code</span>

          <div className="flex items-center gap-3">
            <span className="font-mono text-lg tracking-[0.3em] bg-white text-blue-900 px-3 py-1 rounded-full">
              {code}
            </span>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigator.clipboard.writeText(code)}
              className="bg-white text-blue-900 p-2 rounded-lg shadow hover:bg-blue-100 flex items-center justify-center"
              title="Copier le code"
            >
              <FiCopy size={22} />
            </motion.button>
          </div>
        </div>

        {/* Chargement */}
        {loading && (
          <p className="mt-4 opacity-80">Chargement des joueurs...</p>
        )}

        {/* Liste des joueurs */}
        {!loading && (
          <>
            <h2 className="mt-4 text-xl font-semibold mb-3">
              Joueurs connectés
            </h2>

            <div className="mt-2 space-y-2">
              {players.length === 0 && (
                <p className="opacity-70 text-sm">
                  En attente des premiers joueurs...
                </p>
              )}

              {players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/90 text-blue-900 py-2 px-4 rounded-xl shadow flex items-center justify-between"
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
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-400 text-yellow-900">
                      Chef
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Bouton Start */}
            <div className="mt-8">
              {isOwner ? (
                <>
                  <p className="mb-2 text-sm opacity-80">
                    Tu es le chef du salon. Lance la partie quand tout le monde
                    est prêt.
                  </p>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.04 }}
                    onClick={handleStart}
                    className="w-full bg-green-400 hover:bg-green-500 text-green-900 font-bold py-3 rounded-xl shadow-lg"
                  >
                    Lancer la partie
                  </motion.button>
                </>
              ) : (
                <p className="text-sm opacity-80">
                  En attente que le chef du salon lance la partie...
                </p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
