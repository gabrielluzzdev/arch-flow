import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function Splash() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), reduce ? 200 : 1300);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)", y: 6 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <img src="/logo-mark.png" alt="" className="mx-auto h-10 w-auto sm:h-12" />
            <p className="font-display mt-4 text-3xl tracking-tight text-foreground sm:text-4xl">
              Luz Botelho
            </p>
            <p className="label-caps mt-3">Arquitetura</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}