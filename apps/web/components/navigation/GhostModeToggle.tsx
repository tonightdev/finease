"use client";

import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { toggleGhostMode } from "@/store/slices/uiSlice";
import { Eye, EyeOff } from "lucide-react";

const CURRENCY_REGEX =
  /([+-]?\s*₹\s*[\d,]+(\.\d+)?(\s*[kKmMbB])?(\s*\/mo|\s*\/yr)?)/g;

export function GhostModeToggle() {
  const dispatch = useDispatch<AppDispatch>();
  const ghostMode = useSelector((state: RootState) => state.ui.ghostMode);
  const originalMapRef = useRef<Map<Node, string>>(new Map());

  // Universal In-Place Ghost Masking
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const originalMap = originalMapRef.current;

    if (ghostMode) {
      document.documentElement.classList.add("ghost-mode");
      document.body.classList.add("ghost-mode");

      const maskNode = (node: Node) => {
        // Skip interactive inputs and scripts
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (
            ["INPUT", "TEXTAREA", "SCRIPT", "STYLE", "SELECT"].includes(
              el.tagName,
            )
          ) {
            return;
          }

          // If leaf element with no child elements, mask at element level
          if (el.children.length === 0) {
            const text = el.textContent || "";
            if (text.includes("₹") && !text.includes("*****")) {
              if (!originalMap.has(el)) {
                originalMap.set(el, text);
              }
              el.textContent = text.replace(CURRENCY_REGEX, "*****");
            }
            return;
          }

          // If element has children, check individual child text nodes or child elements
          for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i]!;
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.nodeValue || "";
              if (text.includes("₹") && !text.includes("*****")) {
                if (!originalMap.has(child)) {
                  originalMap.set(child, text);
                }
                child.nodeValue = text.replace(CURRENCY_REGEX, "*****");
              }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              maskNode(child);
            }
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue || "";
          if (text.includes("₹") && !text.includes("*****")) {
            if (!originalMap.has(node)) {
              originalMap.set(node, text);
            }
            node.nodeValue = text.replace(CURRENCY_REGEX, "*****");
          }
        }
      };

      // Perform initial sweep across the body
      maskNode(document.body);

      // Observe dynamic updates, pagination, tabs, and route transitions
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "characterData") {
            const text = m.target.nodeValue || "";
            if (text.includes("₹") && !text.includes("*****")) {
              if (!originalMap.has(m.target)) {
                originalMap.set(m.target, text);
              }
              m.target.nodeValue = text.replace(CURRENCY_REGEX, "*****");
            }
          } else if (m.type === "childList") {
            m.addedNodes.forEach((added) => {
              maskNode(added);
            });
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
      };
    } else {
      document.documentElement.classList.remove("ghost-mode");
      document.body.classList.remove("ghost-mode");

      // Restore all original values cleanly
      for (const [target, original] of originalMap.entries()) {
        if ("textContent" in target && target.nodeType === Node.ELEMENT_NODE) {
          (target as HTMLElement).textContent = original;
        } else if (
          "nodeValue" in target &&
          target.nodeType === Node.TEXT_NODE
        ) {
          (target as Text).nodeValue = original;
        }
      }
      originalMap.clear();

      return undefined;
    }
  }, [ghostMode]);

  // Keyboard shortcut: Cmd+Shift+H / Ctrl+Shift+H to toggle privacy cloak
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "h"
      ) {
        e.preventDefault();
        dispatch(toggleGhostMode());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleGhostMode())}
      className={`flex items-center justify-center size-9 rounded-xl transition-colors cursor-pointer ${
        ghostMode
          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
          : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
      }`}
      title={
        ghostMode
          ? "Ghost Mode Active: All figures cloaked (⌘+Shift+H)"
          : "Ghost Mode: Cloak balances in public (⌘+Shift+H)"
      }
      aria-label="Toggle Ghost Mode"
    >
      {ghostMode ? (
        <EyeOff className="w-4 h-4 text-emerald-500" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
    </button>
  );
}
