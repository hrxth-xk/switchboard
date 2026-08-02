"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT } from "@/lib/motion";

const FAQS = [
  {
    question: "Who is Switchboard for?",
    answer:
      "Software engineers who are preparing and applying at the same time — students, new grads, and anyone switching jobs while holding one down. If your prep lives in LeetCode and your applications live in a spreadsheet, this replaces both."
  },
  {
    question: "How does the revisit scheduling work?",
    answer:
      "When you log a problem you rate your confidence from 1 to 5. That maps to a revisit tomorrow, in 3 days, a week, 2 weeks, or a month. You can override it with any date you like, and re-rating a problem after a revisit reschedules the next one."
  },
  {
    question: "Do I have to log everything by hand?",
    answer:
      "Yes, and that's deliberate — the ten seconds it takes to log a problem is what makes the number mean something. Quick Add is one tap from every screen and remembers the shape of what you enter."
  },
  {
    question: "What happens when I miss a day?",
    answer:
      "Nothing punitive. There are no streaks to break. The daily gauge resets, and the weekly and monthly views show whether the trend still holds — which is the number that actually matters over a search."
  },
  {
    question: "Does it work on my phone?",
    answer:
      "Switchboard is mobile-first. It's a web app with a bottom nav, swipeable progress cards, and a floating quick-add button, so it behaves like a native app in your browser. The same account works on desktop."
  },
  {
    question: "Can I change my targets later?",
    answer:
      "Any time, from goal settings. Targets drive the gauge and the tracker bars immediately, and past days keep the targets they were logged against."
  }
] as const;

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="landing-section landing-section-faq" id="faq">
      <div className="landing-container landing-faq-layout">
        <Reveal as="header" className="landing-faq-head">
          <span className="landing-eyebrow">FAQ</span>
          <h2 className="landing-section-title">Questions worth asking first.</h2>
          <p className="landing-section-lede">
            Still curious? Create an account and look around — it takes less time than reading this column.
          </p>
        </Reveal>

        <Reveal className="landing-faq-list" delay={0.08}>
          {FAQS.map((faq, faqIndex) => {
            const isOpen = open === faqIndex;

            return (
              <div className={`landing-faq-item${isOpen ? " is-open" : ""}`} key={faq.question}>
                <button
                  aria-controls={`faq-panel-${faqIndex}`}
                  aria-expanded={isOpen}
                  className="landing-faq-question"
                  id={`faq-trigger-${faqIndex}`}
                  onClick={() => setOpen(isOpen ? null : faqIndex)}
                  type="button"
                >
                  <span>{faq.question}</span>
                  <Plus aria-hidden="true" className="landing-faq-sign" size={18} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      aria-labelledby={`faq-trigger-${faqIndex}`}
                      className="landing-faq-panel"
                      exit={{ height: 0, opacity: 0 }}
                      id={`faq-panel-${faqIndex}`}
                      initial={{ height: 0, opacity: 0 }}
                      role="region"
                      transition={{ duration: 0.26, ease: EASE_OUT }}
                    >
                      <p className="landing-faq-answer">{faq.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
