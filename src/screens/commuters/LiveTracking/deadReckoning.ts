import type { DirectionKey } from '@packages/tanstack/query/routes';

/**
 * Smooth jeep motion between GPS fixes (Revision 18), measured in metres along the jeep's lane:
 *
 * 1. A new fix ahead of where the jeep is drawn: glide there in about GLIDE_S seconds.
 * 2. Reached it and no new fix yet: keep going at the last fix-to-fix speed, for at most the same distance as the
 *    last fix-to-fix move (a guess of where the jeep is by now).
 * 3. Went that far and still no fix: stop there and wait.
 * 4. A new fix behind where the jeep is drawn (it slowed or stopped): never go backwards; hold until a later fix is
 *    ahead again, then glide forward.
 *
 * A real jump (another lane, a gap over JUMP_M, a fix over BACK_JUMP_M behind, the first fix) moves the jeep there at
 * once.
 */

/** About how often drivers send a fix while moving; a new fix is reached over this time. */
export const GLIDE_S = 5;

/** A change bigger than this along the road is a real jump (new trip, long gap): move there at once. */
export const JUMP_M = 1000;

/**
 * Rule 4 holds the jeep for a small overshoot only. A fix further behind than this is not a slowdown (a restart, a
 * GPS correction): move there at once instead of freezing until the jeep catches up.
 */
export const BACK_JUMP_M = 150;

export type Fix = {
  /** The lane the fix is on, or undefined when it is off the route. */
  lane?: DirectionKey;
  /** Metres along that lane. */
  distance: number;
  /** When the fix was taken (ms). */
  at: number;
};

export type Motion = {
  lane?: DirectionKey;
  /** Where the jeep is drawn, metres along the lane. */
  shown: number;
  /** The latest fix's distance it is gliding to. */
  target: number;
  /** The furthest it may go on a guess (rule 2), then it stops (rule 3). */
  limit: number;
  /** Speed while gliding to the latest fix (m/s). */
  glideSpeed: number;
  /** Fix-to-fix speed used past the latest fix (m/s). */
  cruiseSpeed: number;
  last: Fix;
};

const jumpTo = (fix: Fix): Motion => ({
  lane: fix.lane,
  shown: fix.distance,
  target: fix.distance,
  limit: fix.distance,
  glideSpeed: 0,
  cruiseSpeed: 0,
  last: fix,
});

/** Applies a new fix to the jeep's motion. */
export function onFix(motion: Motion | undefined, fix: Fix): Motion {
  if (!motion || fix.lane === undefined || motion.lane !== fix.lane) return jumpTo(fix);
  if (Math.abs(fix.distance - motion.shown) > JUMP_M) return jumpTo(fix);
  if (motion.shown - fix.distance > BACK_JUMP_M) return jumpTo(fix);
  if (fix.at <= motion.last.at) return motion; // the same fix again (or an older one)

  const seconds = Math.min(30, Math.max(1, (fix.at - motion.last.at) / 1000));
  const moved = Math.max(0, fix.distance - motion.last.distance); // A to B
  if (fix.distance > motion.shown) {
    // Rules 1 and 2: glide to the fix, then keep going up to the same distance again.
    return {
      lane: fix.lane,
      shown: motion.shown,
      target: fix.distance,
      limit: fix.distance + moved,
      glideSpeed: (fix.distance - motion.shown) / GLIDE_S,
      cruiseSpeed: moved / seconds,
      last: fix,
    };
  }
  // Rule 4: the fix is behind what is drawn. Stay put until a fix is ahead again.
  return {
    lane: fix.lane,
    shown: motion.shown,
    target: motion.shown,
    limit: motion.shown,
    glideSpeed: 0,
    cruiseSpeed: 0,
    last: fix,
  };
}

/** Moves the jeep forward by `seconds` of time. */
export function step(motion: Motion, seconds: number): Motion {
  if (motion.shown < motion.target) {
    return { ...motion, shown: Math.min(motion.target, motion.shown + motion.glideSpeed * seconds) };
  }
  if (motion.shown < motion.limit) {
    return { ...motion, shown: Math.min(motion.limit, motion.shown + motion.cruiseSpeed * seconds) };
  }
  return motion; // rule 3 (or parked): stopped
}

/** Whether the jeep is moving right now (its nose then follows the road). */
export const isMoving = (motion: Motion) => motion.shown < motion.limit || motion.shown < motion.target;
