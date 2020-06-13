import * as THREE from "three";
import Orbit from "./Orbit";

export default class LocalOrbit extends Orbit {
  protected getLongPlane() {
    return new THREE.Vector3(0, 0, 1);
  }
  protected getLongV() {
    return this.v.clone().normalize();
  }
  protected getLongVP() {
    return this.up.clone().normalize();
  }
  protected getLatPlane() {
    return new THREE.Vector3(0, 0, 1);
  }
  protected getLatOrigin() {
    return new THREE.Vector3(0, -1, 0);
  }
}
