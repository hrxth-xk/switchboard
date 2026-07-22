"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [slideHeights, setSlideHeights] = useState<number[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
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

  useLayoutEffect(() => {
    const slides = slideRefs.current.filter(Boolean) as HTMLElement[];

    function measureHeights() {
      setSlideHeights(slides.map((slide) => slide.getBoundingClientRect().height));
    }

    if (!slides.length) return;

    measureHeights();

    const observers = slides.map((slide) => {
      const observer = new ResizeObserver(measureHeights);
      observer.observe(slide);
      return observer;
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [data]);

  function setSlideRef(index: number) {
    return (element: HTMLElement | null) => {
      slideRefs.current[index] = element;
    };
  }

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
  const activeHeight = slideHeights[activePage];
  const viewportStyle =
    activeHeight && activeHeight > 0 ? { height: activeHeight } : undefined;

  return (
    <>
      <div className="macro-dashboard">
        <DashboardHero />

        <div
          ref={viewportRef}
          className="macro-carousel-viewport"
          style={viewportStyle}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="macro-carousel-track" style={trackStyle}>
            <section
              ref={setSlideRef(0)}
              className="macro-page"
              style={slideStyle}
              aria-label="Daily progress"
              aria-hidden={activePage !== 0}
            >
              <DailyPage progress={data.progress.daily} />
            </section>
            <section
              ref={setSlideRef(1)}
              className="macro-page"
              style={slideStyle}
              aria-label="Weekly progress"
              aria-hidden={activePage !== 1}
            >
              <WeeklyPage days={data.weeklyBreakdown} />
            </section>
            <section
              ref={setSlideRef(2)}
              className="macro-page"
              style={slideStyle}
              aria-label="Monthly progress"
              aria-hidden={activePage !== 2}
            >
              <MonthlyPage monthly={data.progress.monthly} activityTrend={data.activityTrend} />
            </section>
          </div>
        </div>

        <MacroPaginationDots count={PAGE_COUNT} active={activePage} />

        <ActionCardsGrid cards={data.actionCards} />
      </div>

      <GoalSetupModal
        open={showGoalsModal}
        onComplete={() => setShowGoalsModal(false)}
        onClose={data.goals ? () => setShowGoalsModal(false) : undefined}
      />
    </>
  );
}
