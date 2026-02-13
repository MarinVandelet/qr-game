import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

export default function EndQuiz({ score, success }) {
  const navigate = useNavigate();
  const { code } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-800 flex items-center justify-center p-6 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/20 p-10 rounded-3xl backdrop-blur-md shadow-xl text-center max-w-lg w-full"
      >
        <h1 className="text-3xl font-bold mb-4">Fin du Quiz</h1>

        <p className="text-xl opacity-90 mb-2">
          Score de l&apos;équipe : <b>{score}/6</b>
        </p>

        {success ? (
          <>
            <p className="text-green-300 text-xl font-bold mb-6">
              🎉 Bravo ! Vous débloquez le Jeu 2 !
            </p>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(`/game2/${code}`)}
              className="bg-white text-blue-800 px-6 py-3 rounded-xl shadow-lg font-bold w-full"
            >
              Passer au Jeu 2
            </motion.button>
          </>
        ) : (
          <>
            <p className="text-red-300 text-xl font-bold mb-6">
              ❌ Score insuffisant… Recommencez !
            </p>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(`/game/${code}`)}
              className="bg-white text-blue-800 px-6 py-3 rounded-xl shadow-lg font-bold w-full"
            >
              Rejouer
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
