"use client";

import { useEffect, useRef } from "react";

let lockCount = 0;

function applyScrollLock() {
  const scrollY = window.scrollY;
  document.documentElement.classList.add("scroll-locked");
  document.body.dataset.scrollLockY = String(scrollY);
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  document.body.style.overflow = "hidden";
}

function releaseScrollLock() {
  const scrollY = Number(document.body.dataset.scrollLockY ?? "0");
  document.documentElement.classList.remove("scroll-locked");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.body.style.overflow = "";
  delete document.body.dataset.scrollLockY;
  window.scrollTo(0, scrollY);
}

/**
 * Locks background scroll while overlays (menus, modals) are open.
 * Supports nested locks via reference counting.
 */
export function useScrollLock(locked: boolean) {
  const wasLocked = useRef(false);

  useEffect(() => {
    if (locked && !wasLocked.current) {
      lockCount += 1;
      if (lockCount === 1) applyScrollLock();
      wasLocked.current = true;
    }

    if (!locked && wasLocked.current) {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) releaseScrollLock();
      wasLocked.current = false;
    }

    return () => {
      if (wasLocked.current) {
        lockCount = Math.max(0, lockCount - 1);
        if (lockCount === 0) releaseScrollLock();
        wasLocked.current = false;
      }
    };
  }, [locked]);

  useEffect(() => {
    if (!locked) return;

    const preventBackgroundScroll = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-scroll-lock-scrollable]")) return;
      event.preventDefault();
    };

    document.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

    return () => {
      document.removeEventListener("wheel", preventBackgroundScroll);
      document.removeEventListener("touchmove", preventBackgroundScroll);
    };
  }, [locked]);
}
