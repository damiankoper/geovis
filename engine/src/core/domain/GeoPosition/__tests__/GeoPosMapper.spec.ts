import GeoPosition from "../models/GeoPosition";
import GeoPosMapper from "../services/GeoPosMapper";
import * as THREE from "three";

describe("GeoPosMapper", () => {
  it("should calculate rotation matrix from geo position 1", () => {
    const position: GeoPosition = new GeoPosition(0, 0);
    const matrix = GeoPosMapper.toRotationMatrix(position);
    const euler = new THREE.Euler().setFromRotationMatrix(matrix, "YZX");
    expect(Math.abs(euler.x)).toEqual(0);
    expect(Math.abs(euler.y)).toEqual(0);
    expect(Math.abs(euler.z)).toEqual(0);
  });

  it("should calculate rotation matrix from geo position 2", () => {
    const position: GeoPosition = new GeoPosition(Math.PI, Math.PI);
    const matrix = GeoPosMapper.toRotationMatrix(position);
    const euler = new THREE.Euler().setFromRotationMatrix(matrix, "YZX");
    expect(euler.x).toEqual(-Math.PI);
    expect(euler.y).toEqual(Math.PI);
    expect(Math.abs(euler.z)).toEqual(0);
  });
});
