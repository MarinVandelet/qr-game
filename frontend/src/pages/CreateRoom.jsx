import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiCopy, FiHash, FiPlay } from "react-icons/fi";
import { API_URL } from "../config";

export default function CreateRoom() {
  const [roomCode, setRoomCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const playerId = localStorage.getItem("playerId");

  const handleCreateRoom = async () => {
    setLoading(true);
    const res = await axios.post(`${API_URL}/api/room/create`, { playerId });
    setRoomCode(res.data.code);
    setLoading(false);
  };

  return (
    <div className="app-shell text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md p-7"
      >
        <div className="badge mb-4">
          <FiHash /> Salon
        </div>
        <h1 className="text-3xl font-extrabold">Cr&eacute;er un salon</h1>
        <p className="soft-text mt-2">G&eacute;n&eacute;rez un code et partagez-le avec votre &eacute;quipe.</p>

        {!roomCode && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleCreateRoom}
            disabled={loading}
            className="primary-btn w-full mt-6"
          >
            {loading ? "Cr\u00E9ation..." : "G\u00E9n\u00E9rer un salon"}
          </motion.button>
        )}

        {roomCode && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-7">
            <p className="soft-text text-sm">Code du salon</p>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/20 p-4">
              <p className="text-4xl font-black tracking-[0.18em]">{roomCode}</p>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigator.clipboard.writeText(roomCode)}
                className="secondary-btn p-3"
                title="Copier"
              >
                <FiCopy size={18} />
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/waiting-room/${roomCode}`)}
              className="primary-btn w-full mt-5 inline-flex justify-center items-center gap-2"
            >
              <FiPlay /> Aller en salle d&apos;attente
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
