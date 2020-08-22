import _ from "lodash";
/**
 * @category Utils
 */
export default class NumUtils {
  /**
   * Checks if number is in range. If `from > to` it is assumed that `INF = -INF`.
   */
  static inCycleRange(n: number, from: number, to: number) {
    return from > to ? !_.inRange(n, to, from) : _.inRange(n, from, to);
  }

  /**
   * Returns number from `counts` which is closest to `goal`
   */
  static getClosest(counts: number[], goal: number) {
    return counts.reduce((prev, curr) =>
      Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
    );
  }
}
