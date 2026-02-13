import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
    } catch (err) {
      setError("Salon introuvable !");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-blue-950 flex items-center justify-center p-4 text-white">

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center"
      >
        <h1 className="text-3xl font-bold mb-6">Rejoindre un salon</h1>

        <input
          type="text"
          placeholder="Code du salon"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          className="w-full px-4 py-3 rounded-xl bg-white text-black outline-none"
        />

        {error && <p className="text-red-300 mt-2">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleJoin}
          className="w-full bg-white text-blue-800 py-3 rounded-xl font-semibold shadow-lg mt-4"
        >
          Rejoindre
        </motion.button>
      </motion.div>
    </div>
  );
}
