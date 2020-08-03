import GeoPosition from "../models/GeoPosition";
import * as THREE from "three";
/**
 * @category VisualizationBase
 */
export default class GeoPosMapper {
  static toRotationMatrix(pos: GeoPosition): THREE.Matrix4 {
    return new THREE.Matrix4()
      .makeRotationY(pos.long)
      .multiply(new THREE.Matrix4().makeRotationX(-pos.lat));
  }
}
