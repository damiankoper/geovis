import GeoPosition from "../interfaces/GeoPosition";
import * as THREE from "three";
export default class GeoPosMapper {
  static toRotationMatrix(pos: GeoPosition): THREE.Matrix4 {
    const euler = new THREE.Euler(0, pos.long, pos.lat, "YZX");
    return new THREE.Matrix4().makeRotationFromEuler(euler);
  }
}
