import GeoPosition from "../models/GeoPosition";
import GeoPosMapper from "../services/GeoPosMapper";
import * as THREE from "three";

describe("GeoPosMapper", () => {
  it("should calculate rotation matrix from geo position 1", () => {
    const position: GeoPosition = new GeoPosition(0, 0);
    const matrix = GeoPosMapper.toRotationMatrix(position);
    const euler = new THREE.Euler().setFromRotationMatrix(matrix, "YZX");
    expect(euler.x).toEqual(0);
    expect(euler.y).toEqual(0);
    expect(euler.z).toEqual(0);
  });
});
