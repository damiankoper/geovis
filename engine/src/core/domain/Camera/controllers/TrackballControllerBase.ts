import * as THREE from "three";
import GeoPosition from "../../GeoPosition/models/GeoPosition";
import GeoPosMapper from "../../GeoPosition/services/GeoPosMapper";
import Range from "../../GeoPosition/models/Range";
import TrackballCamera from "../interfaces/TrackballCamera";
import { TrackballMode } from "../enums/TrackballMode";
import { EventDispatcher } from "strongly-typed-events";
import AnimatedTransition from "../../Animation/AnimatedTransition";
import Orbit from "../../GeoPosition/models/Orbit";
import GlobalOrbit from "../../GeoPosition/models/GlobalOrbit";
import LocalOrbit from "../../GeoPosition/models/LocalOrbit";

/**
 * @category Camera
 */
export default abstract class TrackballControllerBase
  implements TrackballCamera {
  protected mode: TrackballMode = TrackballMode.Free;
  protected readonly defaultUpEuler = new THREE.Euler(-Math.PI / 2);

  protected globalOrbit = new GlobalOrbit(new THREE.Vector3(0, 0, 6371));

  protected localOrbit = new LocalOrbit(
    new THREE.Vector3(0, 0, 10000),
    new Range<GeoPosition>(
      GeoPosition.fromDeg(-180, 5),
      GeoPosition.fromDeg(180, 85)
    )
  );

  protected zoomFactor = 0.5;
  protected zoomBounds = new Range(0.001, 10000);

  protected lastPanDelta = new THREE.Vector2();

  protected panAnim = new AnimatedTransition(
    new Range(new THREE.Vector2(), new THREE.Vector2()),
    1
  );
  protected zoomAnim = new AnimatedTransition(
    new Range(new THREE.Vector3(), new THREE.Vector3()),
    0.15
  );

  constructor(
    protected readonly camera: THREE.Camera,
    protected readonly group: THREE.Group
  ) {
    this.camera.up = this.localOrbit.up;
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
    return this.globalOrbit.getRadius();
  }
  /** @inheritdoc */
  setGlobalOrbitRadius(radius: number) {
    this.globalOrbit.setRadius(radius);
    return this;
  }

  /** @inheritdoc */
  getGlobalOrbitPosition() {
    return this.globalOrbit.getGeoPosition();
  }
  /** @inheritdoc */
  setGlobalOrbitPosition(position: GeoPosition) {
    this.globalOrbit.setGeoPosition(position);
    return this;
  }

  /** @inheritdoc */
  getLocalOrbitRadius() {
    return this.localOrbit.getRadius();
  }
  /** @inheritdoc */
  setLocalOrbitRadius(radius: number) {
    this.localOrbit.setRadius(radius);
    return this;
  }

  /** @inheritdoc */
  setLocalOrbitPosition(position: GeoPosition) {
    this.localOrbit.setGeoPosition(position);
    return this;
  }
  /** @inheritdoc */
  getLocalOrbitPosition() {
    return this.localOrbit.getGeoPosition();
  }

  /** @inheritdoc */
  setGlobalOrbitBounds(bounds: Range<GeoPosition>) {
    this.globalOrbit.bounds = bounds;
    return this;
  }
  /** @inheritdoc */
  getGlobalOrbitBounds() {
    return this.globalOrbit.bounds;
  }

  /** @inheritdoc */
  setLocalOrbitBounds(bounds: Range<GeoPosition>) {
    this.localOrbit.bounds = bounds;
    return this;
  }
  /** @inheritdoc */
  getLocalOrbitBounds() {
    return this.localOrbit.bounds;
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
    this.globalOrbit.slowFactor = factor;
    return this;
  }
  /** @inheritdoc */
  getGlobalOrbitSlowFactor() {
    return this.globalOrbit.slowFactor;
  }

  /** @inheritdoc */
  setLocalOrbitSlowFactor(factor: number) {
    this.localOrbit.slowFactor = factor;
    return this;
  }
  /** @inheritdoc */
  getLocalOrbitSlowFactor() {
    return this.localOrbit.slowFactor;
  }

  /** @inheritdoc */
  setGlobalOrbitEaseFn(fn: (t: number) => number) {
    this.panAnim.easeFn = fn;
    return this;
  }
  /** @inheritdoc */
  getGlobalOrbitEaseFn() {
    return this.panAnim.easeFn;
  }

  /** @inheritdoc */
  setZoomEaseFn(fn: (t: number) => number) {
    this.zoomAnim.easeFn = fn;
    return this;
  }
  /** @inheritdoc */
  getZoomEaseFn() {
    return this.zoomAnim.easeFn;
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
    this.zoomAnim.duration = time;
    return this;
  }
  /** @inheritdoc */
  getZoomTime() {
    return this.zoomAnim.duration;
  }

  /** @inheritdoc */
  setPanBreakTime(time: number) {
    this.panAnim.duration = time;
    return this;
  }
  /** @inheritdoc */
  getPanBreakTime() {
    return this.panAnim.duration;
  }

  /** @inheritdoc */
  stopMovement() {
    this.panAnim.from.set(0, 0);
    this.lastPanDelta.set(0, 0);
  }
}
