import * as THREE from "three";
import _ from "lodash";
import NumUtils from "../../Utils/NumUtils";
import { TrackballMode } from "../enums/TrackballMode";
import TrackballControllerBase from "./TrackballControllerBase";
import { Quaternion, Vector2 } from "three";

/**
 * @category Camera
 */
export default class TrackballController extends TrackballControllerBase {
  private lastPanPosition = new THREE.Vector2();

  constructor(
    camera: THREE.Camera,
    group: THREE.Group,
    private readonly eventSource: HTMLCanvasElement
  ) {
    super(camera, group);
    this.setEvents();
    this.update(0);
  }
  update(delta: number) {
    this.panAnim.update((f, from, to) => {
      this.handleGlobalOrbitRotate(new Vector2().lerpVectors(from, to, f));
    });

    this.zoomAnim.update((f, from, to) => {
      this.localOrbit.v.lerpVectors(from, to, f);
      this._onZoomChange.dispatch(this, this.localOrbit.getRadius());
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
  }

  private onWheel(e: WheelEvent) {
    this.stopMovement();
    this.zoomAnim.from.copy(this.localOrbit.v);
    this.zoomAnim.to.copy(this.localOrbit.v);
    let zoomTargetLength = this.localOrbit.getRadius();
    if (e.deltaY > 0) zoomTargetLength *= this.zoomFactor;
    else if (e.deltaY < 0) zoomTargetLength *= 1 / this.zoomFactor;
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
    if (!e.shiftKey && e.button !== 1) this.panAnim.start();
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
    this._onLocalOrbitChange.dispatch(this, this.localOrbit.v);
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
    // Vertical pan
    const qVertical = new THREE.Quaternion().setFromAxisAngle(
      horizontalAxis,
      delta.y * slowFactor
    );
    // Horizontal pan
    const qHorizontal = new THREE.Quaternion().setFromAxisAngle(
      verticalAxis,
      delta.x * slowFactor
    );
    const qPan = qHorizontal.clone().multiply(qVertical);
    if (delta.length() <= 2) {
      this.stopMovement();
    }

    this.globalOrbit.applyQuaternion(qPan);
    this.globalOrbit.correctToBounds(this.mode);

    this._onGlobalOrbitChange.dispatch(this, this.globalOrbit.v);
    if (this.mode === TrackballMode.Free) this.calcAndDispatchNorth();
  }

  private calcNorthAngle() {
    const plane = new THREE.Vector3(0, 0, 1);
    const northQ = new Quaternion().setFromUnitVectors(
      this.localOrbit.v.clone().projectOnPlane(plane).normalize(),
      this.globalOrbit.up.clone().projectOnPlane(plane).normalize()
    );
    let angle =
      new Quaternion().setFromAxisAngle(plane, 0).angleTo(northQ) + Math.PI;
    if (northQ.z < 0) angle = 2 * Math.PI - angle;
    return angle;
  }

  private calcAndDispatchNorth() {
    this._onNorthAngleChange.dispatch(this, this.calcNorthAngle());
  }
}
