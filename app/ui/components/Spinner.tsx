import { motion } from "framer-motion";

const Spinner = ({ size = 100, color = "bg-green-500" }) => {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-100">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Barra rotante con animazione fluida */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* 5 barre con animazione sfalsata per fluidità */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className={`absolute ${color} origin-left`}
              style={{
                width: `${size / 2.5}px`,
                height: `${size / 8}px`,
                left: size / 2 - size / 5,
                top: size / 2 - size / 16,
                rotate: i * (360 / 5),
              }}
              initial={{ scaleX: 0.3, opacity: 0.5 }}
              animate={{
                scaleX: [0.3, 1, 0.3],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
        <div className="py-25 text-center">Loading...</div>
      </div>
    </div>
  );
};

export default Spinner;
