import GeoPosition from "../models/GeoPosition";
import * as THREE from "three";
/**
 * @category VisualizationBase
 */
export default class GeoPosMapper {
  static toRotationMatrix(pos: GeoPosition): THREE.Matrix4 {
    console.log(pos);

    const euler = new THREE.Euler(0, pos.long, 0, "XYZ");
    return new THREE.Matrix4()
      .makeRotationY(pos.long)
      .multiply(new THREE.Matrix4().makeRotationX(-pos.lat));
  }
}
