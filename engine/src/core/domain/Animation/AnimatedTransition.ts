import * as d3 from "d3-ease";
import * as THREE from "three";
/**
 * @internal For internal GeoVisCore purposes
 */
interface Clonable<T> {
  clone(): T;
}

/**
 * @internal For internal GeoVisCore purposes
 */
export default class AnimatedTransition<T extends Clonable<T>> {
  private clock = new THREE.Clock(false);
  public from: T;
  public to: T;

  constructor(
    rangeEl: T,
    public duration: number = 0,
    public easeFn: (t: number) => number = d3.easeCubicOut
  ) {
    this.from = rangeEl.clone();
    this.to = rangeEl.clone();
  }

  public start() {
    this.clock.start();
  }

  public stop() {
    this.clock.stop();
  }

  public isRunning() {
    return this.clock.running;
  }

  public update(actionFn: (f: number, from: T, to: T) => void) {
    if (this.clock.running) {
      const elapsed = this.clock.getElapsedTime();
      if (elapsed > this.duration) this.clock.stop();
      else actionFn(this.easeFn(elapsed / this.duration), this.from, this.to);
    }
  }
}
