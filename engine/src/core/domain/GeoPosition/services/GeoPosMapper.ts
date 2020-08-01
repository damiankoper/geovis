import GeoPosition from "../models/GeoPosition";
import * as THREE from "three";
/**
 * @category VisualizationBase
 */
export default class GeoPosMapper {
  static toRotationMatrix(pos: GeoPosition): THREE.Matrix4 {
    const euler = new THREE.Euler(0, pos.long, pos.lat, "ZXY");
    return new THREE.Matrix4().makeRotationFromEuler(euler);
  }
}
