"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function GlobalLoadingBar() {
  const accountsLoading = useSelector(
    (state: RootState) => state.accounts?.loading,
  );
  const transactionsLoading = useSelector(
    (state: RootState) => state.transactions?.loading,
  );
  const goalsLoading = useSelector((state: RootState) => state.goals?.loading);
  const categoriesLoading = useSelector(
    (state: RootState) => state.categories?.loading,
  );
  const assetClassesLoading = useSelector(
    (state: RootState) => state.assetClasses?.loading,
  );
  const expiriesLoading = useSelector(
    (state: RootState) => state.expiries?.loading,
  );
  const simulationsLoading = useSelector(
    (state: RootState) => state.simulations?.loading,
  );

  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (e: Event) =>
      setApiLoading((e as CustomEvent).detail);
    window.addEventListener("api-loading", handleLoading);
    return () => window.removeEventListener("api-loading", handleLoading);
  }, []);

  const isLoading =
    accountsLoading ||
    transactionsLoading ||
    goalsLoading ||
    categoriesLoading ||
    assetClassesLoading ||
    expiriesLoading ||
    simulationsLoading ||
    apiLoading;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (isLoading) {
      setVisible(true);
    } else {
      timeout = setTimeout(() => setVisible(false), 400);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ originX: 0 }}
          className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[9999] shadow-[0_0_10px_rgba(19,91,236,0.5)]"
        />
      )}
    </AnimatePresence>
  );
}
