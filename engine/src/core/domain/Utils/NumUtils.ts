import _ from "lodash";

export default class NumUtils {
  static inCycleRange(n: number, from: number, to: number) {
    return from > to ? !_.inRange(n, to, from) : _.inRange(n, from, to);
  }

  static getClosest(counts: number[], goal: number) {
    return counts.reduce((prev, curr) =>
      Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
    );
  }
}
