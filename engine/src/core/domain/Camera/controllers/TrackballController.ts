import * as THREE from "three";
import _ from "lodash";
import { TrackballMode } from "../enums/TrackballMode";
import TrackballCamera from "../interfaces/TrackballCamera";
import GeoPosition from "../../GeoPosition/models/GeoPosition";
import GlobalOrbit from "../../GeoPosition/models/GlobalOrbit";
import LocalOrbit from "../../GeoPosition/models/LocalOrbit";
import AnimatedTransition from "../../Animation/AnimatedTransition";
import Range from "../../GeoPosition/models/Range";
import { EventDispatcher } from "strongly-typed-events";
import Orbit from "../../GeoPosition/models/Orbit";

/**
 * @category Camera
 */
export default class TrackballController implements TrackballCamera {
  private lastPanPosition = new THREE.Vector2();
  private mode: TrackballMode = TrackballMode.Free;
  private globalOrbit = new GlobalOrbit(new THREE.Vector3(0, 0, 6371));
  private localOrbit = new LocalOrbit(
    new THREE.Vector3(0, 0, 10000),
    new Range<GeoPosition>(
      GeoPosition.fromDeg(5, -180),
      GeoPosition.fromDeg(85, 180)
    )
  );

  private zoomFactor = 0.5;
  private zoomBounds = new Range(0.001, 10000);

  private lastPanDelta = new THREE.Vector2();
  private panAnim = new AnimatedTransition(new THREE.Vector2(), 1);
  private zoomAnim = new AnimatedTransition(new THREE.Vector3(), 0.15);
  private localOrbitAnim = new AnimatedTransition(
    new LocalOrbit(new THREE.Vector3()),
    0.3
  );

  private _onGlobalOrbitChange = new EventDispatcher<TrackballCamera, Orbit>();
  /** @inheritdoc */
  get onGlobalOrbitChange() {
    return this._onGlobalOrbitChange.asEvent();
  }

  private _onLocalOrbitChange = new EventDispatcher<TrackballCamera, Orbit>();
  /** @inheritdoc */
  get onLocalOrbitChange() {
    return this._onLocalOrbitChange.asEvent();
  }

  private _onZoomChange = new EventDispatcher<TrackballCamera, number>();
  /** @inheritdoc */
  get onZoomChange() {
    return this._onZoomChange.asEvent();
  }

  private _onNorthAngleChange = new EventDispatcher<TrackballCamera, number>();
  /** @inheritdoc */
  get onNorthAngleChange() {
    return this._onNorthAngleChange.asEvent();
  }

  constructor(
    private readonly camera: THREE.Camera,
    private readonly group: THREE.Group,
    private readonly eventSource: HTMLCanvasElement
  ) {
    this.camera.up = this.localOrbit.up;
    this.group.matrixAutoUpdate = false;
    this.setEvents();
    this.update(0);
  }
  update(delta: number) {
    this.panAnim.update((f, from, to) => {
      this.handleGlobalOrbitRotate(
        new THREE.Vector2().lerpVectors(from, to, f)
      );
    });

    this.zoomAnim.update((f, from, to) => {
      this.localOrbit.v.lerpVectors(from, to, f);
      this._onZoomChange.dispatch(this, this.localOrbit.getRadius());
    });

    this.localOrbitAnim.update((f, from, to) => {
      const plane = new THREE.Vector3(0, 0, 1);
      const q = new THREE.Quaternion().slerp(
        new THREE.Quaternion().setFromUnitVectors(
          from.up.clone().projectOnPlane(plane).normalize(),
          to.up.clone().projectOnPlane(plane).normalize()
        ),
        f
      );
      this.localOrbit.copy(from.clone().applyQuaternion(q));
      this.calcAndDispatchNorth();
    });

    this.group.matrix.makeTranslation(0, 0, -this.globalOrbit.getRadius());
    this.group.matrix.multiply(
      new THREE.Matrix4().lookAt(
        new THREE.Vector3(),
        this.globalOrbit.v.clone().negate(),
        this.globalOrbit.up
      )
    );
    this.camera.position.copy(this.localOrbit.v);
    this.camera.lookAt(0, 0, 0);
  }

  destroy() {
    this.eventSource.removeEventListener(
      "pointerdown",
      this.onPointerDown.bind(this)
    );
    this.eventSource.removeEventListener(
      "pointerup",
      this.onPointerUp.bind(this)
    );
    this.eventSource.removeEventListener(
      "pointermove",
      this.onPointerMove.bind(this)
    );
    this.eventSource.removeEventListener("wheel", this.onWheel.bind(this));
  }

  private setEvents() {
    this.eventSource.addEventListener(
      "pointerdown",
      this.onPointerDown.bind(this)
    );
    this.eventSource.addEventListener("pointerup", this.onPointerUp.bind(this));
    this.eventSource.addEventListener(
      "pointermove",
      this.onPointerMove.bind(this)
    );
    this.eventSource.addEventListener("wheel", this.onWheel.bind(this));
    // this.eventSource.addEventListener("keypress", this.onKeyPress.bind(this));
  }

  //private onKeyPress(e: KeyboardEvent) {}

  private onWheel(e: WheelEvent) {
    let factor = 1;
    if (e.deltaY > 0) factor = this.zoomFactor;
    else if (e.deltaY < 0) factor = 1 / this.zoomFactor;
    this.zoom(factor);
  }

  private zoom(factor: number) {
    this.stopMovement();
    this.zoomAnim.from.copy(this.localOrbit.v);
    this.zoomAnim.to.copy(this.localOrbit.v);
    let zoomTargetLength = this.localOrbit.getRadius() * factor;
    zoomTargetLength = _.clamp(
      zoomTargetLength,
      this.zoomBounds.from,
      this.zoomBounds.to
    );
    this.zoomAnim.to.setLength(zoomTargetLength);
    this.zoomAnim.start();
  }

  private onPointerDown(e: PointerEvent) {
    this.eventSource.setPointerCapture(e.pointerId);
    this.lastPanPosition.set(e.clientX, e.clientY);
    this.stopMovement();
  }

  private onPointerUp(e: PointerEvent) {
    this.eventSource.releasePointerCapture(e.pointerId);
    if (!e.shiftKey && e.button !== 1)
      if (this.panAnim.from.manhattanLength() <= 2) this.stopMovement();
      else this.panAnim.start();
  }

  private onPointerMove(e: PointerEvent) {
    if (e.buttons & 1 || e.buttons & 4) {
      this.lastPanDelta = new THREE.Vector2(
        e.clientX - this.lastPanPosition.x,
        e.clientY - this.lastPanPosition.y
      );
      if (this.panAnim.from.lengthSq() === 0) {
        this.panAnim.from.copy(this.lastPanDelta);
      } else {
        this.panAnim.from.add(this.lastPanDelta).divideScalar(2);
      }

      if (e.shiftKey || e.buttons & 4) {
        if (!this.zoomAnim.isRunning())
          this.handleLocalOrbitRotate(this.lastPanDelta);
      } else {
        this.handleGlobalOrbitRotate(this.lastPanDelta);
      }
      this.lastPanPosition.set(e.clientX, e.clientY);
    }
  }

  private handleLocalOrbitRotate(delta: THREE.Vector2) {
    const qHorizontal = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      -delta.x * this.localOrbit.slowFactor * 0.008
    );

    const horizontalAxis = new THREE.Vector3()
      .crossVectors(this.localOrbit.v, this.localOrbit.up)
      .normalize();

    const qVertical = new THREE.Quaternion().setFromAxisAngle(
      horizontalAxis,
      delta.y * this.localOrbit.slowFactor * 0.004
    );
    const panMotionQuaternion = new THREE.Quaternion().multiplyQuaternions(
      qHorizontal,
      qVertical
    );
    this.localOrbit.applyQuaternion(panMotionQuaternion);
    this.localOrbit.correctToBounds(TrackballMode.Free);

    this._onLocalOrbitChange.dispatch(this, this.localOrbit);
    this.calcAndDispatchNorth();
  }

  private handleGlobalOrbitRotate(delta: THREE.Vector2) {
    const localOrbitRadius = this.localOrbit.getRadius();
    const slowFactor =
      (this.globalOrbit.slowFactor * 0.001 * localOrbitRadius) /
      this.globalOrbit.getRadius();

    const horizontalAxis = new THREE.Vector3()
      .crossVectors(this.localOrbit.up, this.localOrbit.v)
      .normalize();
    const verticalAxis = this.localOrbit.up.clone().normalize();
    const qVertical = new THREE.Quaternion().setFromAxisAngle(
      horizontalAxis,
      delta.y * slowFactor
    );
    const qHorizontal = new THREE.Quaternion().setFromAxisAngle(
      verticalAxis,
      delta.x * slowFactor
    );
    const qPan = qHorizontal.multiply(qVertical);
    this.globalOrbit.applyQuaternion(qPan);
    this.globalOrbit.correctToBounds(this.mode);

    this._onGlobalOrbitChange.dispatch(this, this.globalOrbit);
    if (this.mode === TrackballMode.Free) this.calcAndDispatchNorth();
  }

  private calcAndDispatchNorth() {
    this._onNorthAngleChange.dispatch(this, this.getNorthAngle());
  }

  /** @inheritdoc */
  getNorthAngle() {
    const plane = new THREE.Vector3(0, 0, 1);
    const v1 = this.localOrbit.up.clone().projectOnPlane(plane).normalize();
    const v2 = this.globalOrbit.up.clone().projectOnPlane(plane).normalize();
    const northQ = new THREE.Quaternion().setFromUnitVectors(v1, v2);
    let angle = new THREE.Quaternion().angleTo(northQ);
    if (northQ.z < 0) angle = 2 * Math.PI - angle;
    return angle;
  }

  /** @inheritdoc */
  rotateNorth() {
    console.log("xd");

    this.localOrbitAnim.from = this.localOrbit.clone();
    this.localOrbitAnim.to = this.localOrbit
      .clone()
      .applyQuaternion(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          this.getNorthAngle()
        )
      );
    this.localOrbitAnim.start();
  }

  /** @inheritdoc */
  zoomIn(times = 1) {
    this.zoom(this.zoomFactor ** times);
  }
  /** @inheritdoc */
  zoomOut(times = 1) {
    this.zoom(1 / this.zoomFactor ** times);
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
    this.globalOrbit.latchCompassNorth(this.localOrbit.v);
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
  setRotateNorthTime(time: number) {
    this.localOrbitAnim.duration = time;
    return this;
  }
  /** @inheritdoc */
  getRotateNorthTime() {
    return this.localOrbitAnim.duration;
  }

  /** @inheritdoc */
  stopMovement() {
    this.zoomAnim.stop();
    this.panAnim.stop();
    this.panAnim.from.set(0, 0);
    this.lastPanDelta.set(0, 0);
    this.localOrbitAnim.stop();
  }
}
