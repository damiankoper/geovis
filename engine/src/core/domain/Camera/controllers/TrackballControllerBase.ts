import * as THREE from "three";
import GeoPosition from "../../GeoPosition/interfaces/GeoPosition";
import GeoPosMapper from "../../GeoPosition/services/GeoPosMapper";
import * as d3 from "d3-ease";
import Range from "../../GeoPosition/interfaces/Range";
import TrackballCamera from "../interfaces/TrackballCamera";
import { TrackballMode } from "../enums/TrackballMode";
import { EventDispatcher } from "strongly-typed-events";

/**
 * @category Camera
 */
export default abstract class TrackballControllerBase
  implements TrackballCamera {
  protected readonly defaultUpEuler = new THREE.Euler(-Math.PI / 2);

  protected globalOrbitRadius = 6371;
  protected globalOrbit = new THREE.Vector3(0, 0, this.globalOrbitRadius);
  protected globalOrbitUp = this.globalOrbit
    .clone()
    .normalize()
    .applyEuler(this.defaultUpEuler);
  protected globalOrbitSlowFactor = 1;
  protected globalOrbitEaseFn = d3.easeQuadOut;
  protected globalOrbitBounds = new Range<GeoPosition>(
    GeoPosition.fromDeg(-180, -80),
    GeoPosition.fromDeg(180, 80)
  );
  protected mode: TrackballMode = TrackballMode.Free;

  protected localOrbit = new THREE.Vector3(0, 0, 10000);
  protected localOrbitUp = this.localOrbit
    .clone()
    .applyEuler(this.defaultUpEuler)
    .normalize();
  protected localOrbitSlowFactor = 1;
  protected localOrbitElevationBounds = new Range(5, 85);

  protected zoomFactor = 0.5;
  protected zoomTime = 0.15;
  protected zoomEaseFn = d3.easeQuadOut;
  protected zoomBounds = new Range(0.001, 10000);

  protected panBreakTime = 1;

  protected zoomClock = new THREE.Clock(false);
  protected localOrbitZoomFrom = this.localOrbit.clone();
  protected localOrbitZoomTarget = this.localOrbit.clone();
  protected panClock = new THREE.Clock(false);
  protected lastPanPosition = new THREE.Vector2();
  protected avgPanDelta = new THREE.Vector2();
  protected lastPanDelta = new THREE.Vector2();

  constructor(
    protected readonly camera: THREE.Camera,
    protected readonly group: THREE.Group
  ) {
    this.camera.up = this.localOrbitUp;
    this.group.matrixAutoUpdate = false;
  }

  protected _onGlobalOrbitChange = new EventDispatcher<
    TrackballCamera,
    THREE.Vector3
  >();
  get onGlobalOrbitChange() {
    return this._onGlobalOrbitChange.asEvent();
  }
  protected _onLocalOrbitChange = new EventDispatcher<
    TrackballCamera,
    THREE.Vector3
  >();
  get onLocalOrbitChange() {
    return this._onLocalOrbitChange.asEvent();
  }
  protected _onZoomChange = new EventDispatcher<TrackballCamera, number>();
  get onZoomChange() {
    return this._onZoomChange.asEvent();
  }

  protected _onNorthAngleChange = new EventDispatcher<
    TrackballCamera,
    number
  >();
  get onNorthAngleChange() {
    return this._onNorthAngleChange.asEvent();
  }

  /** @inheritdoc */
  getGlobalOrbitRadius() {
    return this.globalOrbitRadius;
  }
  /** @inheritdoc */
  setGlobalOrbitRadius(radius: number) {
    this.globalOrbit.setLength(radius);
    this.globalOrbitRadius = radius;
    return this;
  }

  /** @inheritdoc */
  getGlobalOrbitPosition() {
    return GeoPosMapper.fromOrbit(this.globalOrbit, this.globalOrbitUp);
  }
  /** @inheritdoc */
  setGlobalOrbitPosition(position: GeoPosition) {
    const rotation = GeoPosMapper.toRotationMatrix(position);
    const v = new THREE.Vector3(0, 0, this.globalOrbit.length());
    this.globalOrbit = v.applyMatrix4(rotation);
    this.globalOrbitUp.copy(
      v.applyEuler(this.defaultUpEuler).applyMatrix4(rotation)
    );
    return this;
  }

  /** @inheritdoc */
  getLocalOrbitRadius() {
    return this.localOrbit.length();
  }
  /** @inheritdoc */
  setLocalOrbitRadius(radius: number) {
    this.localOrbit.setLength(radius);
    return this;
  }

  /** @inheritdoc */
  setLocalOrbitPosition(position: GeoPosition) {
    const rotation = GeoPosMapper.toRotationMatrix(position);
    const v = new THREE.Vector3(0, 0, this.localOrbit.length());
    this.localOrbit = v.applyMatrix4(rotation);
    this.localOrbitUp.copy(
      v.applyEuler(this.defaultUpEuler).applyMatrix4(rotation)
    );
    return this;
  }
  /** @inheritdoc */
  getLocalOrbitPosition() {
    return GeoPosMapper.fromOrbit(this.localOrbit, this.localOrbitUp);
  }

  /** @inheritdoc */
  setGlobalOrbitBounds(bounds: Range<GeoPosition>) {
    this.globalOrbitBounds = bounds;
    return this;
  }
  /** @inheritdoc */
  getGlobalOrbitBounds() {
    return this.globalOrbitBounds;
  }

  /** @inheritdoc */
  setLocalOrbitElevationBounds(bounds: Range) {
    this.localOrbitElevationBounds = bounds;
    return this;
  }
  /** @inheritdoc */
  getLocalOrbitElevationBounds() {
    return this.localOrbitElevationBounds;
  }

  /** @inheritdoc */
  setMode(mode: TrackballMode) {
    this.mode = mode;
    return this;
  }
  /** @inheritdoc */
  getMode() {
    return this.mode;
  }

  /** @inheritdoc */
  setGlobalOrbitSlowFactor(factor: number) {
    this.globalOrbitSlowFactor = factor;
    return this;
  }
  /** @inheritdoc */
  getGlobalOrbitSlowFactor() {
    return this.globalOrbitSlowFactor;
  }

  /** @inheritdoc */
  setLocalOrbitSlowFactor(factor: number) {
    this.localOrbitSlowFactor = factor;
    return this;
  }
  /** @inheritdoc */
  getLocalOrbitSlowFactor() {
    return this.localOrbitSlowFactor;
  }

  /** @inheritdoc */
  setGlobalOrbitEaseFn(fn: (t: number) => number) {
    this.globalOrbitEaseFn = fn;
    return this;
  }
  /** @inheritdoc */
  getGlobalOrbitEaseFn() {
    return this.globalOrbitEaseFn;
  }

  /** @inheritdoc */
  setZoomEaseFn(fn: (t: number) => number) {
    this.zoomEaseFn = fn;
    return this;
  }
  /** @inheritdoc */
  getZoomEaseFn() {
    return this.zoomEaseFn;
  }

  /** @inheritdoc */
  setZoomFactor(factor: number) {
    this.zoomFactor = factor;
    return this;
  }
  /** @inheritdoc */
  getZoomFactor() {
    return this.zoomFactor;
  }

  /** @inheritdoc */
  setZoomBounds(bounds: Range) {
    this.zoomBounds = bounds;
    return this;
  }
  /** @inheritdoc */
  getZoomBounds() {
    return this.zoomBounds;
  }

  /** @inheritdoc */
  setZoomTime(time: number) {
    this.zoomTime = time;
    return this;
  }
  /** @inheritdoc */
  getZoomTime() {
    return this.zoomTime;
  }

  /** @inheritdoc */
  setPanBreakTime(time: number) {
    this.panBreakTime = time;
    return this;
  }
  /** @inheritdoc */
  getPanBreakTime() {
    return this.panBreakTime;
  }

  /** @inheritdoc */
  stopMovement() {
    this.avgPanDelta.set(0, 0);
    this.lastPanDelta.set(0, 0);
  }
}
