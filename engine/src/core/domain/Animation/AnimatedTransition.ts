import * as d3 from "d3-ease";
import * as THREE from "three";
import Range from "../GeoPosition/models/Range";
export default class AnimatedTransition<T, O = T> {
  private clock = new THREE.Clock(false);
  public fromObject?: O;
  public from: T;
  public to: T;

  constructor(
    range: Range<T>,
    public duration: number = 0,
    public easeFn: (t: number) => number = d3.easeQuadOut
  ) {
    this.from = range.from;
    this.to = range.to;
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

  public update(actionFn: (f: number, from: T, to: T, fromObject?: O) => void) {
    if (this.clock.running) {
      const elapsed = this.clock.getElapsedTime();
      if (elapsed > this.duration) this.clock.stop();
      else
        actionFn(
          this.easeFn(elapsed / this.duration),
          this.from,
          this.to,
          this.fromObject
        );
    }
  }
}
