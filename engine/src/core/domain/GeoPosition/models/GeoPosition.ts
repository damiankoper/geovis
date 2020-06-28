import * as THREE from "three";
/**
 * @category VisualizationBase
 */
export default class GeoPosition {
  constructor(public lat: number = 0, public long: number = 0) {}

  get latDeg() {
    return THREE.MathUtils.radToDeg(this.lat);
  }

  get latDMS() {
    return this.getDMS(this.latDeg, "N", "S");
  }

  get longDMS() {
    return this.getDMS(this.longDeg, "W", "E");
  }

  private getDMS(v: number, max: string, min: string) {
    const result = {
      dir: v < 0 ? min : max,
      d: 0,
      m: 0,
      s: 0,
    };
    v = Math.abs(v);
    result.d = Math.trunc(v);
    result.m = (v % 1) * 60;
    result.s = Math.trunc((result.m % 1) * 60);
    result.m = Math.trunc(result.m);

    return result;
  }

  get longDeg() {
    return THREE.MathUtils.radToDeg(this.long);
  }

  static fromRad(lat: number, long: number) {
    return new GeoPosition(lat, long);
  }
  static fromDeg(lat: number, long: number) {
    return new GeoPosition(
      THREE.MathUtils.degToRad(lat),
      THREE.MathUtils.degToRad(long)
    );
  }
}
