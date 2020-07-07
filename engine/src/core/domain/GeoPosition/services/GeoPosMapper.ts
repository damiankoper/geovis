import GeoPosition from "../models/GeoPosition";
import * as THREE from "three";
/**
 * @category VisualizationBase
 */
export default class GeoPosMapper {
  static toRotationMatrix(pos: GeoPosition): THREE.Matrix4 {
    const euler = new THREE.Euler(0, pos.lat, pos.long, "YZX");
    return new THREE.Matrix4().makeRotationFromEuler(euler);
  }
}