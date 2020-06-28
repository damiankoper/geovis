import * as THREE from "three";
import Orbit from "./Orbit";

export default class GlobalOrbit extends Orbit {
  protected getLatPlane() {
    return new THREE.Vector3(0, 0, 1);
  }
  protected getLatV() {
    return this.up.clone().normalize();
  }
  protected getLatVP() {
    return new THREE.Vector3(0, 0, 1);
  }
  protected getLongPlane() {
    return this.up.clone().normalize();
  }
  protected getLongOrigin() {
    return new THREE.Vector3(0, 0, 1);
  }
  clone() {
    return new GlobalOrbit(
      this.v.clone(),
      this.bounds,
      this.slowFactor,
      this.up.clone()
    );
  }
}
