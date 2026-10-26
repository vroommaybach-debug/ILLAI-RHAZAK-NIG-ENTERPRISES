import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionLevel } from '../types';

let scrollTriggerRegistered = false;

export const MOTION_BUDGET_MAX_PER_VIEWPORT = 3;

export function registerGsapPluginsOnce(): void {
  if (!scrollTriggerRegistered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
  }
}

/**
 * Checks whether reduced motion is requested via OS preference or CMS theme setting.
 */
export function shouldReduceMotion(
  cmsMotionLevel?: MotionLevel,
  matchMediaOverride?: boolean
): boolean {
  if (cmsMotionLevel === 'off') {
    return true;
  }
  if (typeof matchMediaOverride === 'boolean') {
    return matchMediaOverride;
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

/**
 * Returns safe animation parameters respecting the reduced-motion guard and A3 motion budget.
 * When reduced motion is active, falls back to opacity-only fade with 0 spatial displacement.
 */
export function getSafeEntranceConfig(options: {
  y?: number;
  x?: number;
  scale?: number;
  duration?: number;
  delay?: number;
  ease?: 'power3.out' | 'power4.out' | 'power2.inOut';
  cmsMotionLevel?: MotionLevel;
  forceReducedMotion?: boolean;
}) {
  const reduced = shouldReduceMotion(options.cmsMotionLevel, options.forceReducedMotion);
  const subtle = options.cmsMotionLevel === 'subtle';

  if (reduced) {
    return {
      from: { opacity: 0, x: 0, y: 0, scale: 1 },
      to: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.2,
        delay: 0,
        ease: 'power2.inOut',
      },
      isReduced: true,
    };
  }

  const multiplier = subtle ? 0.45 : 1;
  return {
    from: {
      opacity: 0,
      y: (options.y ?? 24) * multiplier,
      x: (options.x ?? 0) * multiplier,
      scale: options.scale ?? 1,
    },
    to: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      duration: options.duration ?? (subtle ? 0.45 : 0.7),
      delay: options.delay ?? 0,
      ease: options.ease ?? 'power3.out',
    },
    isReduced: false,
  };
}
