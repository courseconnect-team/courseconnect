'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useTour } from '@/contexts/TourContext';

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const GAP = 16;
const TOOLTIP_W = 340;
const TOOLTIP_H = 220; // approximate; used only for placement clamping

const TourOverlay: React.FC = () => {
  const { isRunning, stepIndex, steps, next, prev, stop } = useTour();
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const step = steps[stepIndex];

  useEffect(() => {
    if (!isRunning || !step) return;

    if (!step.target) {
      setRect(null);
      return;
    }

    let poll: ReturnType<typeof setInterval> | null = null;
    let raf = 0;

    const update = (): boolean => {
      const el = document.querySelector(step.target!) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return false;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      });
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return true;
    };

    if (!update()) {
      const started = Date.now();
      poll = setInterval(() => {
        if (update() || Date.now() - started > 3000) {
          if (poll) clearInterval(poll);
        }
      }, 100);
    }

    const onViewport = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => update());
    };
    window.addEventListener('resize', onViewport);
    window.addEventListener('scroll', onViewport, true);

    return () => {
      window.removeEventListener('resize', onViewport);
      window.removeEventListener('scroll', onViewport, true);
      if (poll) clearInterval(poll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isRunning, step]);

  useEffect(() => {
    if (!isRunning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRunning, next, prev, stop]);

  if (!mounted || !isRunning || !step) return null;

  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  const tooltipStyle = computeTooltipPosition(rect, step.placement);

  return createPortal(
    <div aria-live="polite" role="dialog" aria-modal="true">
      {/* Full-page blocker (transparent when a target is spotlit; dimmed for modal steps). */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: rect ? 'transparent' : 'rgba(10, 5, 30, 0.55)',
          pointerEvents: 'auto',
        }}
      />

      {/* Spotlight — outer box-shadow dims the rest of the page. */}
      {rect && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(10, 5, 30, 0.58)',
            outline: '2px solid rgba(255, 255, 255, 0.95)',
            outlineOffset: 2,
            zIndex: 9999,
            pointerEvents: 'none',
            transition:
              'top 0.28s ease, left 0.28s ease, width 0.28s ease, height 0.28s ease',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          position: 'fixed',
          zIndex: 10001,
          width: TOOLTIP_W,
          ...tooltipStyle,
        }}
        className="rounded-2xl bg-white border border-[#E7E1F7] shadow-[0_24px_60px_-24px_rgba(45,15,131,0.55)] p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AutoAwesomeOutlinedIcon sx={{ color: '#5A41D8', fontSize: 18 }} />
            <span className="text-[11px] font-semibold tracking-wider text-[#5A41D8] uppercase">
              Walkthrough · {stepIndex + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={stop}
            aria-label="Close walkthrough"
            className="text-[#6B5AA8] hover:text-[#1E1442] -m-1 p-1 rounded-md hover:bg-[#F4F1FC] transition-colors"
          >
            <CloseRoundedIcon fontSize="small" />
          </button>
        </div>

        <h4 className="text-[17px] font-semibold text-[#1E1442] mt-2">
          {step.title}
        </h4>
        <p className="text-sm text-[#4A3F6B] mt-1.5 leading-relaxed">
          {step.body}
        </p>

        <div className="flex items-center justify-between mt-5">
          <div className="flex gap-1.5 items-center">
            {steps.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`block h-1.5 rounded-full transition-all duration-200 ${
                  i === stepIndex
                    ? 'bg-[#5A41D8] w-6'
                    : i < stepIndex
                    ? 'bg-[#B7A6EE] w-1.5'
                    : 'bg-[#E7E1F7] w-1.5'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={prev}
                className="text-sm font-medium text-[#5A41D8] px-3 py-1.5 rounded-md hover:bg-[#F4F1FC] transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="text-sm font-semibold text-white bg-[#5A41D8] hover:bg-[#4834C8] px-4 py-1.5 rounded-md shadow-[0_4px_12px_rgba(90,65,216,0.28)] transition-colors"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

function computeTooltipPosition(
  rect: Rect | null,
  placement: 'right' | 'bottom' | 'left' | 'top' | 'center' | undefined
): React.CSSProperties {
  if (!rect) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const p = placement ?? 'right';

  let top = rect.top;
  let left = rect.left;

  if (p === 'right') {
    top = rect.top;
    left = rect.left + rect.width + GAP;
  } else if (p === 'left') {
    top = rect.top;
    left = rect.left - TOOLTIP_W - GAP;
  } else if (p === 'bottom') {
    top = rect.top + rect.height + GAP;
    left = rect.left;
  } else if (p === 'top') {
    top = rect.top - TOOLTIP_H - GAP;
    left = rect.left;
  }

  // Clamp inside the viewport with a small margin.
  const margin = 12;
  left = Math.max(margin, Math.min(left, vw - TOOLTIP_W - margin));
  top = Math.max(margin, Math.min(top, vh - TOOLTIP_H - margin));

  return { top, left };
}

export default TourOverlay;
