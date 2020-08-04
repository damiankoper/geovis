import * as TLE from "tle.js";
import * as THREE from "three";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import GeoPosMapper from "@/core/domain/GeoPosition/services/GeoPosMapper";
import TimeService from "../EarthVis/TimeService";
import moment from "moment";
export default class SatelliteObject {
  static groundLineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 1,
    opacity: 0.4,
    transparent: true,
  });

  static orbitLineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 5,
    opacity: 0.7,
    transparent: true,
  });

  static groundLineBase = new THREE.LineCurve3(
    new THREE.Vector3(),
    new THREE.Vector3(0, 0, -1)
  );

  public line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      SatelliteObject.groundLineBase.getPoints()
    ),
    SatelliteObject.groundLineMaterial
  );

  public orbitLine?: THREE.Line;
  private orbitC = 0;

  constructor(
    public readonly tle: [string, string, string],
    private readonly r = 6371,
    public readonly mesh?: THREE.Object3D,
    public baseTranslation: THREE.Matrix4 = new THREE.Matrix4(),
    public scale = 1
  ) {
    this.setTLE(tle);
    this.line.matrixAutoUpdate = false;
    if (this.mesh) this.mesh.matrixAutoUpdate = false;
  }

  private get rFactor() {
    return this.r / 6371;
  }

  setTLE(tle: [string, string, string]) {
    const G = 3.986004418e14;
    const e = TLE.getEccentricity(tle);
    const meanMotion = TLE.getMeanMotion(tle);

    // Source: https://space.stackexchange.com/questions/18289/how-to-get-semi-major-axis-from-tle?rq=1
    const a = G ** (1 / 3) / ((2 * meanMotion * Math.PI) / 86400) ** (2 / 3);
    const b = a * Math.sqrt(1 - e ** 2);

    const curve = new THREE.EllipseCurve(
      0,
      0,
      (a / 1000) * this.rFactor,
      (b / 1000) * this.rFactor,
      0,
      0,
      false,
      0
    );
    this.orbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(300)),
      SatelliteObject.orbitLineMaterial
    );
    this.orbitLine.matrixAutoUpdate = false;
    this.orbitC = ((a * e) / 1000) * this.rFactor;
  }

  update(timestamp = +moment.utc()) {
    this.line.matrix = this.getGroundTransformMatrix(timestamp);
    if (this.mesh)
      this.mesh.matrix = this.getPositionTransformMatrix(timestamp);
    if (this.orbitLine)
      this.orbitLine.matrix = this.getOrbitTransformMatrix(timestamp);
  }

  getPositionTransformMatrix(timestamp = +moment.utc()): THREE.Matrix4 {
    const satInfo = TLE.getSatelliteInfo(this.tle, timestamp, 0, 0, 0);
    return GeoPosMapper.toRotationMatrix(
      new GeoPosition(
        THREE.MathUtils.degToRad(satInfo.lat),
        THREE.MathUtils.degToRad(satInfo.lng)
      )
    )
      .multiply(
        new THREE.Matrix4().makeTranslation(
          0,
          0,
          this.r + satInfo.height * this.rFactor
        )
      )
      .multiply(
        new THREE.Matrix4().makeScale(this.scale, this.scale, this.scale)
      )
      .multiply(this.baseTranslation);
  }

  getGroundTransformMatrix(timestamp = +moment.utc()): THREE.Matrix4 {
    const satInfo = TLE.getSatelliteInfo(this.tle, timestamp, 0, 0, 0);
    return GeoPosMapper.toRotationMatrix(
      new GeoPosition(
        THREE.MathUtils.degToRad(satInfo.lat),
        THREE.MathUtils.degToRad(satInfo.lng)
      )
    )
      .multiply(
        new THREE.Matrix4().makeTranslation(
          0,
          0,
          this.r + satInfo.height * this.rFactor
        )
      )
      .multiply(new THREE.Matrix4().makeScale(0, 0, satInfo.height * 1.1));
  }

  getOrbitTransformMatrix(timestamp = +moment.utc()): THREE.Matrix4 {
    const m = new THREE.Matrix4()
      .makeRotationY(
        TimeService.getFirstPointOfAriesAngle(timestamp) +
          THREE.MathUtils.degToRad(TLE.getRightAscension(this.tle)) +
          -TimeService.getHourAngle(0, 0, timestamp)
      )

      .multiply(
        new THREE.Matrix4().makeRotationX(
          THREE.MathUtils.degToRad(90 - TLE.getInclination(this.tle))
        )
      );

    return new THREE.Matrix4()
      .makeRotationAxis(
        new THREE.Vector3(0, 0, 1).applyMatrix4(m).normalize(),
        THREE.MathUtils.degToRad(360 - TLE.getPerigee(this.tle))
      )
      .multiply(m)
      .multiply(new THREE.Matrix4().makeTranslation(this.orbitC, 0, 0));
  }
}
