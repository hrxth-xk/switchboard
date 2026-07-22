"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { modalBackdropTransition, modalPanelTransition } from "@/lib/motion";

const FOCUSABLE_SELECTOR =
  "input, textarea, select, button:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  className?: string;
  closeOnOverlayClick?: boolean;
};

export function Modal({ open, onClose, children, labelledBy, className = "", closeOnOverlayClick = true }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    function focusableElements() {
      return Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const elements = focusableElements();
        if (elements.length === 0) return;

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const frame = window.requestAnimationFrame(() => {
      focusableElements()[0]?.focus();
    });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      window.cancelAnimationFrame(frame);
      triggerRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate="visible"
          className="modal-overlay"
          exit="exit"
          initial="hidden"
          onClick={closeOnOverlayClick ? onClose : undefined}
          role="presentation"
          variants={modalBackdropTransition}
        >
          <motion.div
            animate="visible"
            aria-labelledby={labelledBy}
            aria-modal="true"
            className={`modal${className ? ` ${className}` : ""}`}
            exit="exit"
            initial="hidden"
            onClick={(event) => event.stopPropagation()}
            ref={panelRef}
            role="dialog"
            variants={modalPanelTransition}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
