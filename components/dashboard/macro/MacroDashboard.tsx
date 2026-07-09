"use client";

import { useEffect, useRef, useState } from "react";
import type { MacroDashboardData } from "@/lib/macro-dashboard";
import { DashboardHero } from "@/components/dashboard/macro/DashboardHero";
import { DailyPage } from "@/components/dashboard/macro/DailyPage";
import { WeeklyPage } from "@/components/dashboard/macro/WeeklyPage";
import { MonthlyPage } from "@/components/dashboard/macro/MonthlyPage";
import { GoalSetupModal } from "@/components/dashboard/macro/GoalSetupModal";
import { MacroPaginationDots } from "@/components/dashboard/macro/MacroPaginationDots";
import { ActionCardsGrid } from "@/components/dashboard/action/ActionCardsGrid";

const PAGE_COUNT = 3;
const SWIPE_THRESHOLD = 48;

type MacroDashboardProps = {
  data: MacroDashboardData;
};

export function MacroDashboard({ data }: MacroDashboardProps) {
  const [activePage, setActivePage] = useState(0);
  const [showGoalsModal, setShowGoalsModal] = useState(!data.goals);
  const [slideWidth, setSlideWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function measure() {
      const width = viewport?.clientWidth ?? 0;
      setSlideWidth(width);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  function goToPage(index: number) {
    setActivePage(Math.min(Math.max(index, 0), PAGE_COUNT - 1));
  }

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = touchStartX.current - endX;
    touchStartX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    goToPage(delta > 0 ? activePage + 1 : activePage - 1);
  }

  const trackStyle = {
    width: slideWidth ? slideWidth * PAGE_COUNT : undefined,
    transform: slideWidth ? `translate3d(-${activePage * slideWidth}px, 0, 0)` : undefined
  };

  const slideStyle = slideWidth ? { width: slideWidth, minWidth: slideWidth, maxWidth: slideWidth } : undefined;

  return (
    <>
      <div className="macro-dashboard">
        <DashboardHero />

        <div
          ref={viewportRef}
          className="macro-carousel-viewport"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="macro-carousel-track" style={trackStyle}>
            <section
              className="macro-page"
              style={slideStyle}
              aria-label="Daily progress"
              aria-hidden={activePage !== 0}
            >
              <DailyPage progress={data.progress.daily} />
            </section>
            <section
              className="macro-page"
              style={slideStyle}
              aria-label="Weekly progress"
              aria-hidden={activePage !== 1}
            >
              <WeeklyPage progress={data.progress.weekly} />
            </section>
            <section
              className="macro-page"
              style={slideStyle}
              aria-label="Monthly progress"
              aria-hidden={activePage !== 2}
            >
              <MonthlyPage monthly={data.progress.monthly} />
            </section>
          </div>
        </div>

        <MacroPaginationDots count={PAGE_COUNT} active={activePage} />

        <ActionCardsGrid cards={data.actionCards} />
      </div>

      {showGoalsModal ? (
        <GoalSetupModal
          onComplete={() => setShowGoalsModal(false)}
          onClose={data.goals ? () => setShowGoalsModal(false) : undefined}
        />
      ) : null}
    </>
  );
}
