import GeoPosition from "../interfaces/GeoPosition";
import * as THREE from "three";
/**
 * @category VisualizationBase
 */
export default class GeoPosMapper {
  static toRotationMatrix(pos: GeoPosition): THREE.Matrix4 {
    const euler = new THREE.Euler(0, pos.long, pos.lat, "YZX");
    return new THREE.Matrix4().makeRotationFromEuler(euler);
  }

  static fromOrbit(
    orbit: THREE.Vector3,
    orbitUp: THREE.Vector3,
    orbitOrigin: THREE.Vector3 = new THREE.Vector3(0, 0, 1)
  ): GeoPosition {
    //Latttude
    const v1Lat = orbit.clone().projectOnPlane(orbitUp).normalize();
    const v2Lat = orbitOrigin.projectOnPlane(orbitUp).normalize();
    const qLat = new THREE.Quaternion().setFromUnitVectors(v1Lat, v2Lat);
    const latitude =
      qLat.angleTo(new THREE.Quaternion()) *
      Math.sign(qLat.y) *
      Math.sign(orbitUp.y);

    // Longtitude
    const longPlane = new THREE.Vector3(0, 0, 1);
    const v1Long = orbitUp.clone().projectOnPlane(longPlane).normalize();
    const v2Long = orbitUp.clone().normalize();
    const qLong = new THREE.Quaternion().setFromUnitVectors(v1Long, v2Long);

    const longtitude =
      new THREE.Quaternion().angleTo(qLong) * Math.sign(orbitUp.z);

    return new GeoPosition(latitude, longtitude);
  }
}
