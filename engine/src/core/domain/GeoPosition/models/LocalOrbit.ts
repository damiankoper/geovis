import * as THREE from "three";
import Orbit from "./Orbit";

export default class LocalOrbit extends Orbit {
  protected getLatPlane() {
    return new THREE.Vector3(0, 0, 1);
  }
  protected getLatV() {
    return this.v.clone().normalize();
  }
  protected getLatVP() {
    return this.up.clone().normalize();
  }
  protected getLongPlane() {
    return new THREE.Vector3(0, 0, 1);
  }
  protected getLongOrigin() {
    return new THREE.Vector3(0, -1, 0);
  }
  clone() {
    return new LocalOrbit(
      this.v.clone(),
      this.bounds,
      this.slowFactor,
      this.up.clone()
    );
  }
}
