"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  const [container, setContainer] = useState<HTMLElement | null>(null);

  /*
   * Render into <body> rather than inline. `.app-main` is `position: relative;
   * z-index: 1`, which makes it a stacking context — an inline overlay's
   * z-index:50 would only compete inside that 1 and would lose to the fixed
   * bottom nav (35) and FAB (40), leaving the sheet's buttons untappable.
   * Modals opened from the layout (Quick Add) never hit this because they mount
   * outside `.app-main`; ones opened from page content did.
   */
  useEffect(() => {
    setContainer(document.body);
  }, []);

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

  // Modals start closed, so rendering nothing until the container is resolved
  // costs no visible frame and avoids touching `document` during SSR.
  if (!container) return null;

  return createPortal(
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
    </AnimatePresence>,
    container
  );
}
