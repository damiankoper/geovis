import * as THREE from "three";
import _ from "lodash";
import { TrackballMode } from "../../../../core/domain/Camera/enums/TrackballMode";
import TrackballCamera from "../../../../core/domain/Camera/interfaces/TrackballCamera";
import GeoPosition from "../../../../core/domain/GeoPosition/models/GeoPosition";
import GlobalOrbit from "../../../../core/domain/GeoPosition/models/GlobalOrbit";
import LocalOrbit from "../../../../core/domain/GeoPosition/models/LocalOrbit";
import AnimatedTransition from "../../../../core/domain/Animation/AnimatedTransition";
import Range from "../../../../core/domain/Utils/Range";
import { EventDispatcher } from "strongly-typed-events";
import Orbit from "../../../../core/domain/GeoPosition/models/Orbit";
import { Euler } from "three";

/**
 * @category Camera
 * @internal For internal GeoVisCore purposes
 */
export default class TrackballController implements TrackballCamera {
  private readonly keyboardBaseSpeed = 5;
  private pressedKeys: Record<string, boolean> = {};
  private pointerCaptured = false;
  private lastPanPosition = new THREE.Vector2();
  private mode: TrackballMode = TrackballMode.Free;
  private globalOrbit = new GlobalOrbit(new THREE.Vector3(0, 0, 6371));
  private localOrbit = new LocalOrbit(
    new THREE.Vector3(0, 0, 10000).applyEuler(
      new Euler(THREE.MathUtils.degToRad(5))
    ),
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

  private group = new THREE.Group();

  constructor(
    private readonly camera: THREE.Camera,
    private readonly eventSource: HTMLCanvasElement
  ) {
    this.group.matrixAutoUpdate = false;
    this.camera.matrixAutoUpdate = false;
    this.setGroupTransformMatrix();
    this.setCameraTransformMatrix();
    this.setEvents();
  }

  public setGroup(group: THREE.Group) {
    this.group = group;
    this.group.matrixAutoUpdate = false;
    this.setGroupTransformMatrix();
  }

  public update() {
    this.panAnim.update((f, from, to) => {
      this.handleGlobalOrbitRotate(
        new THREE.Vector2().lerpVectors(from, to, f)
      );
    });

    this.zoomAnim.update((f, from, to) => {
      this.localOrbit.v.lerpVectors(from, to, f);
      this.setCameraTransformMatrix();
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
      this.setCameraTransformMatrix();
      this.calcAndDispatchNorth();
    });

    this.handleKeyboardControl();
  }

  private handleKeyboardControl() {
    let keyboardControl = false;
    let shift = false;
    const panDelta = new THREE.Vector2();
    for (const keyCode in this.pressedKeys) {
      // Shift
      if (keyCode === "16") {
        shift = true;
      }
      // ArrowTop
      if (keyCode === "38") {
        panDelta.add(new THREE.Vector2(0, this.keyboardBaseSpeed));
        keyboardControl = true;
      }
      // ArrowRight
      if (keyCode === "39") {
        panDelta.add(new THREE.Vector2(-this.keyboardBaseSpeed, 0));
        keyboardControl = true;
      }
      // ArrowBottom
      if (keyCode === "40") {
        panDelta.add(new THREE.Vector2(0, -this.keyboardBaseSpeed));
        keyboardControl = true;
      }
      // ArrowLeft
      if (keyCode === "37") {
        panDelta.add(new THREE.Vector2(this.keyboardBaseSpeed, 0));
        keyboardControl = true;
      }
    }
    if (keyboardControl) {
      this.lastPanDelta.copy(panDelta);
      if (shift)
        this.handleLocalOrbitRotate(
          this.lastPanDelta.multiplyScalar(this.localOrbit.slowFactor)
        );
      else
        this.handleGlobalOrbitRotate(
          this.lastPanDelta.multiplyScalar(this.globalOrbit.slowFactor)
        );
    }
  }

  private setCameraTransformMatrix() {
    const pos = this.localOrbit.v;
    this.camera.matrixWorld.makeTranslation(pos.x, pos.y, pos.z);
    this.camera.matrixWorld.multiply(
      new THREE.Matrix4().lookAt(pos, new THREE.Vector3(), this.localOrbit.up)
    );
  }

  public destroy() {
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
    this.eventSource.removeEventListener("keydown", this.onKeyDown.bind(this));
    this.eventSource.removeEventListener("keyup", this.onKeyUp.bind(this));
  }

  private setEvents() {
    this.eventSource.tabIndex = 0;
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
    this.eventSource.addEventListener("keydown", this.onKeyDown.bind(this));
    this.eventSource.addEventListener("keyup", this.onKeyUp.bind(this));
  }

  private onKeyDown(e: KeyboardEvent) {
    this.pressedKeys[String(e.keyCode)] = true;
    if (e.key === "+") this.zoomIn();
    if (e.key === "-") this.zoomOut();
  }

  private onKeyUp(e: KeyboardEvent) {
    delete this.pressedKeys[e.keyCode];
  }

  private onWheel(e: WheelEvent) {
    let factor = 1;
    if (e.deltaY < 0) factor = this.zoomFactor;
    else if (e.deltaY > 0) factor = 1 / this.zoomFactor;
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
    this.pointerCaptured = true;
  }

  private onPointerUp(e: PointerEvent) {
    this.eventSource.releasePointerCapture(e.pointerId);
    if (!e.shiftKey && e.button !== 1)
      if (this.lastPanDelta.manhattanLength() <= 2) this.stopMovement();
      else if (this.pointerCaptured) this.panAnim.start();
    this.pointerCaptured = false;
  }

  private onPointerMove(e: PointerEvent) {
    if ((e.buttons & 1 || e.buttons & 4) && this.pointerCaptured) {
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
    this.setCameraTransformMatrix();
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

    this.setGroupTransformMatrix();
  }

  private calcAndDispatchNorth() {
    this._onNorthAngleChange.dispatch(this, this.getNorthAngle());
  }

  private setGroupTransformMatrix() {
    this.group.matrix.makeTranslation(0, 0, -this.globalOrbit.getRadius());
    this.group.matrix.multiply(
      new THREE.Matrix4().lookAt(
        new THREE.Vector3(),
        this.globalOrbit.v.clone().negate(),
        this.globalOrbit.up
      )
    );
  }

  /** @inheritdoc */
  public getNorthAngle() {
    const plane = new THREE.Vector3(0, 0, 1);
    const v1 = this.localOrbit.up.clone().projectOnPlane(plane).normalize();
    const v2 = this.globalOrbit.up.clone().projectOnPlane(plane).normalize();
    const northQ = new THREE.Quaternion().setFromUnitVectors(v1, v2);
    let angle = new THREE.Quaternion().angleTo(northQ);
    if (northQ.z < 0) angle = 2 * Math.PI - angle;
    return angle;
  }

  /** @inheritdoc */
  public rotateNorth() {
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
  public zoomIn(times = 1) {
    this.zoom(this.zoomFactor ** times);
  }
  /** @inheritdoc */
  public zoomOut(times = 1) {
    this.zoom(1 / this.zoomFactor ** times);
  }

  /** @inheritdoc */
  public getGlobalOrbit() {
    return this.globalOrbit;
  }

  /** @inheritdoc */
  public refreshGlobalOrbit() {
    this.setGroupTransformMatrix();
    this._onGlobalOrbitChange.dispatch(this, this.globalOrbit);
  }

  /** @inheritdoc */
  public getLocalOrbit() {
    return this.localOrbit;
  }

  /** @inheritdoc */
  public refreshLocalOrbit() {
    this.setCameraTransformMatrix();
    this._onGlobalOrbitChange.dispatch(this, this.globalOrbit);
  }

  /** @inheritdoc */
  public getGlobalOrbitRadius() {
    return this.globalOrbit.getRadius();
  }
  /** @inheritdoc */
  public setGlobalOrbitRadius(radius: number) {
    this.globalOrbit.setRadius(radius);
    this.setGroupTransformMatrix();
    return this;
  }

  /** @inheritdoc */
  public getGlobalOrbitPosition() {
    return this.globalOrbit.getGeoPosition();
  }
  /** @inheritdoc */
  public setGlobalOrbitPosition(position: GeoPosition) {
    this.globalOrbit.setGeoPosition(position);
    this.setGroupTransformMatrix();
    return this;
  }

  /** @inheritdoc */
  public getLocalOrbitRadius() {
    return this.localOrbit.getRadius();
  }
  /** @inheritdoc */
  public setLocalOrbitRadius(radius: number) {
    this.localOrbit.setRadius(radius);
    this.setCameraTransformMatrix();
    return this;
  }

  /** @inheritdoc */
  public setLocalOrbitPosition(position: GeoPosition) {
    this.localOrbit.setGeoPosition(position);
    this.setCameraTransformMatrix();
    return this;
  }
  /** @inheritdoc */
  public getLocalOrbitPosition() {
    return this.localOrbit.getGeoPosition();
  }

  /** @inheritdoc */
  public setGlobalOrbitBounds(bounds: Range<GeoPosition>) {
    this.globalOrbit.bounds = bounds;
    return this;
  }
  /** @inheritdoc */
  public getGlobalOrbitBounds() {
    return this.globalOrbit.bounds;
  }

  /** @inheritdoc */
  public setLocalOrbitBounds(bounds: Range<GeoPosition>) {
    this.localOrbit.bounds = bounds;
    return this;
  }
  /** @inheritdoc */
  public getLocalOrbitBounds() {
    return this.localOrbit.bounds;
  }

  /** @inheritdoc */
  public setMode(mode: TrackballMode) {
    this.mode = mode;
    this.globalOrbit.latchCompassNorth(this.localOrbit.v);
    return this;
  }
  /** @inheritdoc */
  public getMode() {
    return this.mode;
  }

  /** @inheritdoc */
  public setGlobalOrbitSlowFactor(factor: number) {
    this.globalOrbit.slowFactor = factor;
    return this;
  }
  /** @inheritdoc */
  public getGlobalOrbitSlowFactor() {
    return this.globalOrbit.slowFactor;
  }

  /** @inheritdoc */
  public setLocalOrbitSlowFactor(factor: number) {
    this.localOrbit.slowFactor = factor;
    return this;
  }
  /** @inheritdoc */
  public getLocalOrbitSlowFactor() {
    return this.localOrbit.slowFactor;
  }

  /** @inheritdoc */
  public setGlobalOrbitEaseFn(fn: (t: number) => number) {
    this.panAnim.easeFn = fn;
    return this;
  }
  /** @inheritdoc */
  public getGlobalOrbitEaseFn() {
    return this.panAnim.easeFn;
  }

  /** @inheritdoc */
  public setZoomEaseFn(fn: (t: number) => number) {
    this.zoomAnim.easeFn = fn;
    return this;
  }
  /** @inheritdoc */
  public getZoomEaseFn() {
    return this.zoomAnim.easeFn;
  }

  /** @inheritdoc */
  public setZoomFactor(factor: number) {
    this.zoomFactor = factor;
    return this;
  }
  /** @inheritdoc */
  public getZoomFactor() {
    return this.zoomFactor;
  }

  /** @inheritdoc */
  public setZoomBounds(bounds: Range) {
    this.zoomBounds = bounds;
    return this;
  }
  /** @inheritdoc */
  public getZoomBounds() {
    return this.zoomBounds;
  }

  /** @inheritdoc */
  public setZoomTime(time: number) {
    this.zoomAnim.duration = time;
    return this;
  }
  /** @inheritdoc */
  public getZoomTime() {
    return this.zoomAnim.duration;
  }

  /** @inheritdoc */
  public setPanBreakTime(time: number) {
    this.panAnim.duration = time;
    return this;
  }
  /** @inheritdoc */
  public getPanBreakTime() {
    return this.panAnim.duration;
  }

  /** @inheritdoc */
  public setRotateNorthTime(time: number) {
    this.localOrbitAnim.duration = time;
    return this;
  }
  /** @inheritdoc */
  public getRotateNorthTime() {
    return this.localOrbitAnim.duration;
  }

  /** @inheritdoc */
  public stopMovement() {
    this.zoomAnim.stop();
    this.panAnim.stop();
    this.panAnim.from.set(0, 0);
    this.lastPanDelta.set(0, 0);
    this.localOrbitAnim.stop();
  }

  /** EVENTS */

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
}
