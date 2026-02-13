import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiCopy } from "react-icons/fi";
import { API_URL } from "../config";


export default function CreateRoom() {
  const [roomCode, setRoomCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const playerId = localStorage.getItem("playerId");

  const handleCreateRoom = async () => {
    setLoading(true);

    const res = await axios.post(`${API_URL}/api/room/create`, {
      playerId,
    });

    setRoomCode(res.data.code);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-blue-950 flex items-center justify-center p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center"
      >
        <h1 className="text-3xl font-bold mb-6">Créer un Salon</h1>

        {/* Si le salon n’est pas encore créé */}
        {!roomCode && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full bg-white text-blue-800 py-3 rounded-xl font-semibold shadow-lg"
          >
            {loading ? "Création..." : "Générer un salon"}
          </motion.button>
        )}

        {/* Si le salon est créé → montrer le code */}
        {roomCode && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8">
                
            <p className="text-xl">Code du salon :</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <p className="text-5xl font-bold tracking-widest">{roomCode}</p>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigator.clipboard.writeText(roomCode)}
                  className="bg-white text-blue-900 p-2 rounded-lg shadow hover:bg-blue-100 flex items-center justify-center"
                  title="Copier le code"
                >
                  <FiCopy size={22} />
                </motion.button>
            </div>


            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(`/waiting-room/${roomCode}`)}
              className="w-full bg-white text-blue-800 py-3 rounded-xl font-semibold shadow-lg mt-8"
            >
              Aller dans la salle d'attente
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
