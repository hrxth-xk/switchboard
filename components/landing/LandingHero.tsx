"use client";

import { Fragment } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { EASE_OUT } from "@/lib/motion";

const TITLE_WORDS: { text: string; accent?: boolean }[] = [
  { text: "Know" },
  { text: "exactly" },
  { text: "what" },
  { text: "to" },
  { text: "work" },
  { text: "on" },
  { text: "today", accent: true }
];

const STATS = [
  { value: "3", label: "Trackers on one rhythm" },
  { value: "5", label: "Spaced-repetition intervals" },
  { value: "6", label: "Application pipeline stages" },
  { value: "1", label: "Screen that answers “what now?”" }
] as const;

export function LandingHero() {
  return (
    <section className="landing-hero" id="product">
      <div className="landing-container landing-hero-inner">
        <motion.a
          animate={{ opacity: 1, y: 0 }}
          className="landing-eyebrow landing-hero-eyebrow"
          href="#features"
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <Sparkles aria-hidden="true" size={13} />
          Built for the DSA-plus-applications grind
        </motion.a>

        <h1 className="landing-hero-title">
          {TITLE_WORDS.map((word, wordIndex) => (
            <Fragment key={word.text}>
              {/* A real space, so the heading still reads as a sentence to
                  screen readers and crawlers — the words are separate
                  elements only so each can be masked and revealed. */}
              {wordIndex > 0 ? " " : null}
              <span className="landing-word">
                <motion.span
                  animate={{ y: "0%", opacity: 1 }}
                  className={`landing-word-inner${word.accent ? " is-accent" : ""}`}
                  initial={{ y: "130%", opacity: 0 }}
                  transition={{ duration: 0.75, ease: EASE_OUT, delay: 0.06 * wordIndex }}
                >
                  {word.text}
                </motion.span>
              </span>
            </Fragment>
          ))}
          <span className="landing-hero-period">.</span>
        </h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="landing-hero-lede"
          initial={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.42 }}
        >
          A job search is three jobs at once — practising DSA, sending applications, and shipping projects.
          Switchboard puts all three on one dashboard, sets a daily target for each, and tells you the moment
          you&apos;re done for the day.
        </motion.p>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="landing-hero-actions"
          initial={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.52 }}
        >
          <Link className="landing-btn landing-btn-primary landing-btn-lg" href="/signup">
            Create your account
            <ArrowRight aria-hidden="true" className="landing-btn-arrow" size={18} />
          </Link>
          <a className="landing-btn landing-btn-ghost landing-btn-lg" href="#features">
            <Play aria-hidden="true" size={16} />
            See what you get
          </a>
        </motion.div>

        <motion.p
          animate={{ opacity: 1 }}
          className="landing-hero-note"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.62 }}
        >
          Email and password — that&apos;s the whole setup. Works on your phone, your laptop, and the tab you
          keep open next to LeetCode.
        </motion.p>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="landing-container landing-preview-wrap"
        initial={{ opacity: 0, y: 34 }}
        transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
      >
        <ProductPreview />
      </motion.div>

      <div className="landing-container">
        <motion.dl
          animate={{ opacity: 1, y: 0 }}
          className="landing-stats"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.5 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          {STATS.map((stat) => (
            <div className="landing-stat" key={stat.label}>
              <dt className="landing-stat-value">{stat.value}</dt>
              <dd className="landing-stat-label">{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
