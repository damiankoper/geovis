import GeoPosition from "../interfaces/GeoPosition";
import GeoPosMapper from "../services/GeoPosMapperService";
import * as THREE from "three";

describe("GeoPosMapper", () => {
  it("should calculate rotation matrix from geo position 1", () => {
    const position: GeoPosition = { lat: 0, long: 0 };
    const matrix = GeoPosMapper.toRotationMatrix(position);
    const euler = new THREE.Euler().setFromRotationMatrix(matrix, "YZX");
    expect(euler.x).toEqual(0);
    expect(euler.y).toEqual(0);
    expect(euler.z).toEqual(0);
  });
});