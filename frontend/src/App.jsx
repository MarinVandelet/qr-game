import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import logo from "./assets/logo.png";
import { Routes, Route, useNavigate } from "react-router-dom";
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

  // --------------------------------------------------------------------
  // PAGE FORMULAIRE
  // --------------------------------------------------------------------
  function FormPage() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();

      const res = await axios.post(`${API_URL}/api/player`, {
        firstName,
        lastName,
      });

      localStorage.setItem("playerId", res.data.id);
      navigate("/menu");
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center p-4">

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-xl"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-800">
            Entrez vos informations
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 outline-none"
            />

            <input
              type="text"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 outline-none"
            />

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              type="submit"
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold shadow-md"
            >
              Continuer
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // PAGE MENU
  // --------------------------------------------------------------------
  function MenuPage() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center p-4">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-white flex flex-col items-center"
        >
          <motion.img
            src={logo}
            alt="Logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-64 md:w-96 mb-10 drop-shadow-xl"
            draggable="false"
          />

          <div className="w-full space-y-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/create-room")}
              className="w-full bg-white text-blue-800 py-3 rounded-xl font-semibold shadow-lg"
            >
              Créer un salon
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/join-room")}
              className="w-full bg-white text-blue-800 py-3 rounded-xl font-semibold shadow-lg"
            >
              Rejoindre un salon
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // ROUTES
  // --------------------------------------------------------------------
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
