import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { CornerBrackets } from "../ritual/Backdrop";

export function LedgerShell({ children }: { children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      className="relative ledger-page rounded-sm"
    >
      <CornerBrackets />
      <div className="relative p-6 md:p-10">{children}</div>
    </motion.section>
  );
}
