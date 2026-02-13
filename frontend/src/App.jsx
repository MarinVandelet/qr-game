import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import logo from "./assets/logo.png";
import { Routes, Route, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLogIn, FiPlusCircle, FiUser } from "react-icons/fi";
import { API_URL } from "./config";

import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import WaitingRoom from "./pages/WaitingRoom";
import Game from "./pages/Game";
import Game2 from "./pages/Game2";
import Game3 from "./pages/Game3";
import Game4 from "./pages/Game4";
import FinalResults from "./pages/FinalResults";

export default function App() {
  const navigate = useNavigate();
  const playerId = localStorage.getItem("playerId");

  function FormPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      const res = await axios.post(`${API_URL}/api/player`, { firstName, lastName });
      localStorage.setItem("playerId", res.data.id);
      navigate("/menu");
    };

    return (
      <div className="app-shell">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md p-7 md:p-8"
        >
          <div className="badge mb-4">
            <FiUser /> Joueur
          </div>
          <h1 className="text-3xl font-extrabold">Bienvenue</h1>
          <p className="soft-text mt-2">Saisissez votre identit&eacute; pour rejoindre l&apos;aventure QR Game.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="text"
              placeholder="Pr&eacute;nom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="field"
              required
            />
            <input
              type="text"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="field"
              required
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              type="submit"
              className="primary-btn w-full inline-flex items-center justify-center gap-2"
            >
              Continuer <FiArrowRight />
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  function MenuPage() {
    return (
      <div className="app-shell">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-lg p-6 md:p-8 text-white"
        >
          <div className="flex justify-center mb-5">
            <motion.img
              src={logo}
              alt="QR Game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-44 md:w-56 drop-shadow-xl"
              draggable="false"
            />
          </div>

          <p className="soft-text text-center mb-6">Cr&eacute;ez un salon ou rejoignez un code existant.</p>

          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/create-room")}
              className="primary-btn w-full inline-flex items-center justify-center gap-2"
            >
              <FiPlusCircle /> Cr&eacute;er un salon
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/join-room")}
              className="secondary-btn w-full inline-flex items-center justify-center gap-2"
            >
              <FiLogIn /> Rejoindre un salon
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={playerId ? <MenuPage /> : <FormPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/create-room" element={<CreateRoom />} />
      <Route path="/join-room" element={<JoinRoom />} />
      <Route path="/waiting-room/:code" element={<WaitingRoom />} />
      <Route path="/game/:code" element={<Game />} />
      <Route path="/game2/:code" element={<Game2 />} />
      <Route path="/game3/:code" element={<Game3 />} />
      <Route path="/game4/:code" element={<Game4 />} />
      <Route path="/final/:code" element={<FinalResults />} />
    </Routes>
  );
}