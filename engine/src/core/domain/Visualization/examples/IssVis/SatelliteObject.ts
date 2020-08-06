import * as TLE from "tle.js";
import * as THREE from "three";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import GeoPosMapper from "@/core/domain/GeoPosition/services/GeoPosMapper";
import TimeService from "../EarthVis/TimeService";
import moment from "moment";
import { Matrix4, Vector3 } from "three";
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

  static lineGeometry = new THREE.BufferGeometry().setFromPoints(
    SatelliteObject.groundLineBase.getPoints()
  );

  public line = new THREE.Line(
    SatelliteObject.lineGeometry,
    SatelliteObject.groundLineMaterial
  );

  public orbitLine?: THREE.Line;
  private orbitC = 0;

  public useGroundLine = true;
  public useOrbit = true;
  public useMesh = true;
  public useLabel = true;

  private labelTexture?: THREE.CanvasTexture;
  private labelCanvas?: HTMLCanvasElement;
  private labelSprite?: THREE.Sprite;
  private labelMaterial?: THREE.SpriteMaterial;
  private labelSize = 256;

  private get rFactor() {
    return this.r / 6371;
  }

  constructor(
    public tle: [string, string, string],
    private readonly r = 6371,
    public readonly mesh?: THREE.Object3D,
    public baseTransform: THREE.Matrix4 = new THREE.Matrix4()
  ) {
    this.setTLE(tle);
    this.line.matrixAutoUpdate = false;
    if (this.mesh) this.mesh.matrixAutoUpdate = false;
  }

  addTo(group: THREE.Object3D) {
    if (this.useGroundLine) group.add(this.line);
    if (this.useOrbit && this.orbitLine) group.add(this.orbitLine);
    if (this.useMesh && this.mesh) group.add(this.mesh);
    if (this.useLabel) group.add(this.createLabel());
  }

  private createLabel() {
    this.labelCanvas = document.createElement("canvas");
    this.labelCanvas.width = this.labelSize;
    this.labelCanvas.height = this.labelSize;
    this.labelTexture = new THREE.CanvasTexture(this.labelCanvas);
    this.labelMaterial = new THREE.SpriteMaterial({
      map: this.labelTexture,
      transparent: true,
    });

    this.labelSprite = new THREE.Sprite(this.labelMaterial);
    this.labelSprite.matrixAutoUpdate = false;
    this.labelSprite.renderOrder = 60;
    this.updateLabel();
    return this.labelSprite;
  }

  private updateLabel() {
    const ctx = this.labelCanvas?.getContext("2d", { alpha: true });
    const label = `[${TLE.getCatalogNumber(this.tle)}] ${TLE.getSatelliteName(
      this.tle
    )}`;
    if (ctx && this.labelCanvas && this.labelTexture && this.labelMaterial) {
      ctx.textAlign = "center";
      ctx.font = "20px 'Open Sans'";
      ctx.fillStyle = "white";

      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;

      ctx.strokeText(
        label,
        this.labelSize / 2,
        this.labelSize / 2 - 20,
        this.labelSize
      );
      ctx.fillText(
        label,
        this.labelSize / 2,
        this.labelSize / 2 - 20,
        this.labelSize
      );

      this.labelTexture.needsUpdate = true;
      this.labelMaterial.needsUpdate = true;
    }
  }

  removeFrom(group: THREE.Object3D) {
    if (this.useGroundLine) group.remove(this.line);
    if (this.useOrbit && this.orbitLine) group.remove(this.orbitLine);
    if (this.useMesh && this.mesh) group.remove(this.mesh);
    if (this.useLabel && this.labelSprite) group.remove(this.labelSprite);
  }

  visible(v = true) {
    if (this.useGroundLine) this.line.visible = v;
    if (this.useOrbit && this.orbitLine) this.orbitLine.visible = v;
    if (this.useMesh && this.mesh) this.mesh.visible = v;
    if (this.useLabel && this.labelSprite) this.labelSprite.visible = v;
  }

  setTLE(tle: [string, string, string]) {
    this.tle = tle;
    const G = 3.986004418e14;
    const e = TLE.getEccentricity(tle);
    const meanMotion = TLE.getMeanMotion(tle);

    // Source: https://space.stackexchange.com/questions/18289/how-to-get-semi-major-axis-from-tle?rq=1
    const a = G ** (1 / 3) / ((2 * meanMotion * Math.PI) / 86400) ** (2 / 3);
    const b = a * Math.sqrt(1 - e ** 2);

    const [aE, bE] = [a, b].map((x) => (x / 1000) * this.rFactor);
    const curve = new THREE.EllipseCurve(0, 0, aE, bE, 0, 0, false, 0);
    this.orbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(600)),
      SatelliteObject.orbitLineMaterial
    );
    this.orbitLine.matrixAutoUpdate = false;
    this.orbitC = ((a * e) / 1000) * this.rFactor;

    if (this.useLabel) this.updateLabel();
  }

  update(timestamp = +moment.utc(), camPos?: THREE.Vector3) {
    if (this.useGroundLine)
      this.line.matrix = this.getGroundTransformMatrix(timestamp);
    if (this.useMesh && this.mesh)
      this.mesh.matrix = this.getPositionTransformMatrix(timestamp).multiply(
        this.baseTransform
      );
    if (this.useOrbit && this.orbitLine)
      this.orbitLine.matrix = this.getOrbitTransformMatrix(timestamp);
    if (this.useLabel && this.labelSprite)
      this.labelSprite.matrix = this.getLabelTransformMatrix(timestamp, camPos);
  }

  getPositionTransformMatrix(timestamp = +moment.utc()): THREE.Matrix4 {
    const satInfo = TLE.getSatelliteInfo(this.tle, timestamp, 0, 0, 0);
    return GeoPosMapper.toRotationMatrix(
      new GeoPosition(
        THREE.MathUtils.degToRad(satInfo.lat),
        THREE.MathUtils.degToRad(satInfo.lng)
      )
    ).multiply(
      new THREE.Matrix4().makeTranslation(
        0,
        0,
        this.r + satInfo.height * this.rFactor
      )
    );
  }

  getPosition(timestamp = +moment.utc()) {
    return new THREE.Vector3().applyMatrix4(
      this.getPositionTransformMatrix(timestamp)
    );
  }

  getLabelTransformMatrix(
    timestamp = +moment.utc(),
    camPos: THREE.Vector3 = new THREE.Vector3()
  ) {
    const pos = this.getPosition(timestamp);
    const s = pos.sub(camPos).length() / 2;
    return this.getPositionTransformMatrix(timestamp).multiply(
      new THREE.Matrix4().makeScale(s, s, 1)
    );
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
