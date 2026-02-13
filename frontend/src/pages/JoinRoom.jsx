import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiLogIn } from "react-icons/fi";
import { API_URL } from "../config";

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const playerId = localStorage.getItem("playerId");

  const handleJoin = async () => {
    try {
      await axios.post(`${API_URL}/api/room/join`, {
        playerId,
        code: roomCode,
      });
      navigate(`/waiting-room/${roomCode}`);
    } catch {
      setError("Salon introuvable.");
    }
  };

  return (
    <div className="app-shell text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md p-7"
      >
        <h1 className="text-3xl font-extrabold">Rejoindre un salon</h1>
        <p className="soft-text mt-2">
          {"Entrez le code re\u00e7u pour rejoindre l\u2019\u00e9quipe."}
        </p>

        <input
          type="text"
          placeholder="Code du salon"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          className="field mt-6"
        />

        {error && <p className="mt-3 text-red-200 text-sm">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleJoin}
          className="primary-btn w-full mt-5 inline-flex justify-center items-center gap-2"
        >
          <FiLogIn /> Rejoindre
        </motion.button>
      </motion.div>
    </div>
  );
}
