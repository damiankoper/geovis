import * as THREE from "three";
export default class GeoPosition {
  constructor(public lat: number, public long: number) {}
  latDeg() {
    return THREE.MathUtils.radToDeg(this.lat);
  }
  longDeg() {
    return THREE.MathUtils.radToDeg(this.long);
  }
}
