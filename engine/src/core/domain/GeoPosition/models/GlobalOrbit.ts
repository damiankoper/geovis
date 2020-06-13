import * as THREE from "three";
import Orbit from "./Orbit";

export default class GlobalOrbit extends Orbit {
  protected getLongPlane() {
    return new THREE.Vector3(0, 0, 1);
  }
  protected getLongV() {
    return this.up.clone().normalize();
  }
  protected getLongVP() {
    return new THREE.Vector3(0, 0, 1);
  }
  protected getLatPlane() {
    return this.up.clone().normalize();
  }
  protected getLatOrigin() {
    return new THREE.Vector3(0, 0, 1);
  }
}
