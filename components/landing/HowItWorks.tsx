"use client";

import { Reveal } from "@/components/landing/Reveal";

const STEPS = [
  {
    title: "Set three numbers",
    body: "How many problems, applications, and project sessions make a good day for you. Two minutes, once — change them whenever your week changes."
  },
  {
    title: "Log as you go",
    body: "Quick Add takes a problem name, a topic, and a confidence score. Applications take a company and a stage. That's the whole ritual."
  },
  {
    title: "Follow the gauge",
    body: "The dashboard counts down what's left today, then rolls it into the week and the month so a slow Tuesday doesn't feel like failure."
  }
] as const;

export function HowItWorks() {
  return (
    <section className="landing-section landing-section-how" id="how">
      <div className="landing-container">
        <Reveal as="header" className="landing-section-head">
          <span className="landing-eyebrow">How it works</span>
          <h2 className="landing-section-title">Three steps, then it stays out of your way.</h2>
          <p className="landing-section-lede">
            Switchboard is a scoreboard, not another project to manage. Setup is short on purpose.
          </p>
        </Reveal>

        <ol className="landing-steps">
          {STEPS.map((step, stepIndex) => (
            <Reveal as="li" className="landing-step" delay={0.08 * stepIndex} key={step.title}>
              <span aria-hidden="true" className="landing-step-index">
                {String(stepIndex + 1).padStart(2, "0")}
              </span>
              <h3 className="landing-step-title">{step.title}</h3>
              <p className="landing-step-body">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
