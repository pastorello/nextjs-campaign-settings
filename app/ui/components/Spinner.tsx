import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// Tailwind classes are static strings resolved at build time, so a
// runtime pixel value can't become an arbitrary `w-[Npx]` class (the
// content scanner never sees the interpolated literal). `size` is
// therefore a fixed set of steps on Tailwind's spacing scale rather
// than an arbitrary number (TD-132) — every step is a multiple of 4px
// (Tailwind's spacing unit), so `w-<n>`/`h-<n>` line up exactly.
const SIZE_CLASSES = {
  40: "w-10 h-10",
  60: "w-15 h-15",
  80: "w-20 h-20",
  100: "w-25 h-25",
  120: "w-30 h-30",
  160: "w-40 h-40",
  200: "w-50 h-50",
} as const;

type SpinnerSize = keyof typeof SIZE_CLASSES;

const Spinner = ({
  size = 100,
  color = "bg-green-500",
}: {
  size?: SpinnerSize;
  color?: string;
}) => {
  const t = useTranslations("common");

  return (
    <div className="flex items-center justify-center h-full w-full min-h-100">
      <div className={`relative ${SIZE_CLASSES[size]}`}>
        {/* Rotating bar group, animated smoothly */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* 5 bars with a staggered animation delay for fluidity.
              Position and size are expressed as percentages of the
              container above, so they scale with `size` without
              needing a runtime-computed pixel value. */}
          {[0, 1, 2, 3, 4].map((i) => {
            const rotate = i * (360 / 5);
            return (
              <motion.div
                key={i}
                className={`absolute ${color} origin-left w-[40%] h-[12.5%] left-[30%] top-[43.75%]`}
                initial={{ rotate, scaleX: 0.3, opacity: 0.5 }}
                animate={{
                  rotate,
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
            );
          })}
        </motion.div>
        <div className="py-25 text-center">{t("loading")}</div>
      </div>
    </div>
  );
};

export default Spinner;
