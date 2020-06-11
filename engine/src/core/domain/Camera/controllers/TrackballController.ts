import * as THREE from "three";
import GeoPosMapper from "../../GeoPosition/services/GeoPosMapper";
import _ from "lodash";
import NumUtils from "../../Utils/NumUtils";
import { TrackballMode } from "../enums/TrackballMode";
import TrackballControllerBase from "./TrackballControllerBase";

export default class TrackballController extends TrackballControllerBase {
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
    this.clockAniamtionUpdate(this.panClock, this.panBreakTime, (f) => {
      const s = 1 - this.globalOrbitEaseFn(f);
      this.handleGlobalOrbitRotate(this.avgPanDelta.clone().multiplyScalar(s));
    });
    this.clockAniamtionUpdate(this.zoomClock, this.zoomTime, (f) => {
      this.localOrbit.lerpVectors(
        this.localOrbitZoomFrom,
        this.localOrbitZoomTarget,
        this.zoomEaseFn(f)
      );
    });

    this.group.matrix.makeTranslation(0, 0, -this.globalOrbitRadius);
    this.group.matrix.multiply(
      new THREE.Matrix4().lookAt(
        new THREE.Vector3(),
        this.globalOrbit.clone().negate(),
        this.globalOrbitUp
      )
    );
    this.camera.position.copy(this.localOrbit);
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
    this.localOrbitZoomFrom.copy(this.localOrbit);
    this.localOrbitZoomTarget.copy(this.localOrbit);
    let zoomTargetLength = this.localOrbit.length();
    if (e.deltaY > 0) zoomTargetLength *= this.zoomFactor;
    else if (e.deltaY < 0) zoomTargetLength *= 1 / this.zoomFactor;
    zoomTargetLength = _.clamp(
      zoomTargetLength,
      this.zoomBounds.from,
      this.zoomBounds.to
    );
    this.localOrbitZoomTarget.setLength(zoomTargetLength);
    this.zoomClock.start();
  }
  private onPointerDown(e: PointerEvent) {
    this.eventSource.setPointerCapture(e.pointerId);
    this.lastPanPosition.set(e.clientX, e.clientY);
    this.stopMovement();
  }

  private onPointerUp(e: PointerEvent) {
    this.eventSource.releasePointerCapture(e.pointerId);
    if (!e.shiftKey && e.button !== 1) this.panClock.start();
  }

  private onPointerMove(e: PointerEvent) {
    if (e.buttons & 1 || e.buttons & 4) {
      this.lastPanDelta = new THREE.Vector2(
        e.clientX - this.lastPanPosition.x,
        e.clientY - this.lastPanPosition.y
      );
      if (this.avgPanDelta.lengthSq() === 0) {
        this.avgPanDelta.copy(this.lastPanDelta);
      } else {
        this.avgPanDelta.add(this.lastPanDelta).divideScalar(2);
      }

      if (e.shiftKey || e.buttons & 4) {
        if (!this.zoomClock.running)
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
      -delta.x * this.localOrbitSlowFactor * 0.008
    );

    const horizontalAxis = new THREE.Vector3()
      .crossVectors(this.localOrbit, this.localOrbitUp)
      .normalize();

    const qVertical = new THREE.Quaternion().setFromAxisAngle(
      horizontalAxis,
      delta.y * this.localOrbitSlowFactor * 0.004
    );
    const panMotionQuaternion = new THREE.Quaternion().multiplyQuaternions(
      qHorizontal,
      qVertical
    );
    const oldZ = this.localOrbitUp.z;
    this.localOrbit.applyQuaternion(panMotionQuaternion);
    this.localOrbitUp.applyQuaternion(panMotionQuaternion);

    const from = (this.localOrbitElevationBounds.from * Math.PI) / 180;
    const to = (this.localOrbitElevationBounds.to * Math.PI) / 180;
    let angle = this.localOrbit.angleTo(new THREE.Vector3(0, 0, 1));
    if (Math.sign(oldZ) !== Math.sign(this.localOrbitUp.z)) angle *= -1;
    if (!_.inRange(angle, from, to)) {
      const angleCorrect = _.clamp(angle, from, to);
      horizontalAxis.applyQuaternion(qHorizontal);
      const qCorrect = new THREE.Quaternion().setFromAxisAngle(
        horizontalAxis,
        angle - angleCorrect
      );
      this.localOrbit.applyQuaternion(qCorrect);
      this.localOrbitUp.applyQuaternion(qCorrect);
    }
  }

  private handleGlobalOrbitRotate(delta: THREE.Vector2) {
    const localOrbitRadius = this.localOrbit.length();
    const slowFactor =
      (this.globalOrbitSlowFactor * 0.001 * localOrbitRadius) /
      this.globalOrbitRadius;

    const horizontalAxis = new THREE.Vector3()
      .crossVectors(this.localOrbitUp, this.localOrbit)
      .normalize();
    const verticalAxis = this.localOrbitUp.clone().normalize();
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
    this.globalOrbitUp.applyQuaternion(qPan);

    const qCorrect = new THREE.Quaternion();

    const coords = GeoPosMapper.fromOrbit(this.globalOrbit, this.globalOrbitUp);
    const latAxis = this.globalOrbitUp.clone();
    const longAxis = new THREE.Vector3()
      .crossVectors(new THREE.Vector3(0, 0, 1), this.globalOrbitUp)
      .normalize();

    const GOB = this.globalOrbitBounds;

    qCorrect.multiply(
      this.boundAxisQ(coords.lat, GOB.from.lat, GOB.to.lat, latAxis)
    );
    qCorrect.multiply(
      this.boundAxisQ(coords.long, GOB.from.long, GOB.to.long, longAxis)
    );

    if (this.mode === TrackballMode.Compass)
      qCorrect.multiply(
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0).projectOnPlane(longAxis).normalize(),
          new THREE.Vector3(0, 1, 0)
        )
      );

    this.globalOrbit.applyQuaternion(qCorrect);
    this.globalOrbitUp.applyQuaternion(qCorrect);
  }

  private boundAxisQ(
    angle: number,
    from: number,
    to: number,
    axis: THREE.Vector3
  ) {
    if (!NumUtils.inCycleRange(angle, from, to)) {
      const angleC = NumUtils.getClosest([from, to], angle);
      return new THREE.Quaternion().setFromAxisAngle(axis, angle - angleC);
    } else return new THREE.Quaternion();
  }

  private stopMovement() {
    this.avgPanDelta.set(0, 0);
    this.lastPanDelta.set(0, 0);
  }

  private clockAniamtionUpdate(
    clock: THREE.Clock,
    time: number,
    action: (timeFrac: number) => void
  ) {
    if (clock.running) {
      const elapsed = clock.getElapsedTime();
      if (elapsed > time) clock.stop();
      else action(elapsed / time);
    }
  }
}
