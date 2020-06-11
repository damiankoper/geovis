import * as THREE from "three";
import { Vector3, Quaternion, Vector2, Euler, Matrix4 } from "three";
import GeoPosition from "../../GeoPosition/interfaces/GeoPosition";
import GeoPosMapper from "../../GeoPosition/services/GeoPosMapper";
import * as d3 from "d3-ease";
import _ from "lodash";
import Range from "../../GeoPosition/interfaces/Range";
/* TODO implements CameraController */
export default class TrackballController {
  private readonly defaultUpEuler = new Euler(-Math.PI / 2);

  private globalOrbitRadius = 6371;
  private globalOrbit = new Vector3(0, 0, this.globalOrbitRadius);
  private globalOrbitUp = this.globalOrbit
    .clone()
    .normalize()
    .applyEuler(this.defaultUpEuler);
  private globalOrbitSlowFactor = 0.001;
  private globalOrbitBounds = new Range<GeoPosition>(
    GeoPosition.fromDeg(-180, -90),
    GeoPosition.fromDeg(180, 90)
  );

  private localOrbit = new Vector3(0, 0, 10000);
  private localOrbitUp = this.localOrbit
    .clone()
    .applyEuler(this.defaultUpEuler)
    .normalize();
  private localOrbitSlowFactor = 0.008;
  private readonly localOrbitElevationBounds = new Range(5, 85);

  private zoomClock = new THREE.Clock(false);
  private zoomFactor = 0.5;
  private zoomTime = 0.15;
  private localOrbitZoomFrom = this.localOrbit.clone();
  private localOrbitZoomTarget = this.localOrbit.clone();

  private panBreakTime = 1;
  private panClock = new THREE.Clock(false);
  private lastPanPosition = new Vector2();
  private avgPanDelta = new Vector2();
  private lastPanDelta = new Vector2();

  // private plane: THREE.PlaneHelper;
  private plane2: THREE.PlaneHelper;
  private plane3: THREE.PlaneHelper;
  private globalOrbitHelper: THREE.ArrowHelper;
  private globalOrbitUpHelper: THREE.ArrowHelper;
  private qHelper: THREE.ArrowHelper;

  constructor(
    private readonly camera: THREE.Camera,
    private readonly group: THREE.Group,
    private readonly eventSource: HTMLCanvasElement
  ) {
    this.camera = camera;
    this.camera.up = this.localOrbitUp;
    this.eventSource = eventSource;

    /*     this.plane = new THREE.PlaneHelper(
      new THREE.Plane(this.globalOrbitUp),
      15000
    );
 */
    this.plane2 = new THREE.PlaneHelper(
      new THREE.Plane(this.globalOrbitUp),
      15000
    );

    this.plane3 = new THREE.PlaneHelper(
      new THREE.Plane(new Vector3()),
      15000,
      0xff0000
    );

    this.globalOrbitHelper = new THREE.ArrowHelper(
      this.globalOrbit,
      new Vector3(),
      10000
    );
    this.globalOrbitUpHelper = new THREE.ArrowHelper(
      this.globalOrbitUp,
      new Vector3(),
      5000,
      0x8800ff
    );

    this.qHelper = new THREE.ArrowHelper(
      new Vector3(),
      new Vector3(),
      10000,
      0xff0088
    );

    //this.group?.parent?.add(this.plane);
    this.group?.parent?.add(this.plane2);
    this.group?.parent?.add(this.plane3);
    this.group?.parent?.add(this.globalOrbitHelper);
    this.group?.parent?.add(this.globalOrbitUpHelper);
    this.group?.parent?.add(this.qHelper);

    this.group.matrixAutoUpdate = false;
    this.setEvents();
    this.update(0);
  }

  setGlobalOrbitRadius(radius: number) {
    this.globalOrbit.setLength(radius);
    this.globalOrbitRadius = radius;
  }

  setGlobalOrbitPosition(position: GeoPosition) {
    const rotation = GeoPosMapper.toRotationMatrix(position);
    const length = this.globalOrbit.length();
    this.globalOrbit = new Vector3(0, 0, length).applyMatrix4(rotation);
    this.globalOrbitUp.copy(
      new Vector3(0, 0, length)
        .applyEuler(this.defaultUpEuler)
        .applyMatrix4(rotation)
    );
  }

  update(delta: number) {
    this.clockAniamtionUpdate(this.panClock, this.panBreakTime, (f) => {
      const s = 1 - d3.easeQuadOut(f);
      this.handleGlobalOrbitRotate(this.avgPanDelta.clone().multiplyScalar(s));
    });

    this.clockAniamtionUpdate(this.zoomClock, this.zoomTime, (f) => {
      this.localOrbit.lerpVectors(
        this.localOrbitZoomFrom,
        this.localOrbitZoomTarget,
        d3.easeQuadOut(f)
      );
    });
    this.group.matrix.makeTranslation(0, 0, -this.globalOrbitRadius);
    this.group.matrix.multiply(
      new Matrix4().lookAt(
        new Vector3(),
        this.globalOrbit.clone().negate(),
        this.globalOrbitUp
      )
    );

    this.plane3.plane.normal.copy(
      new Vector3()
        .crossVectors(new Vector3(0, 0, 1), this.globalOrbitUp)
        .normalize()
    );

    this.globalOrbitUpHelper.setDirection(this.globalOrbitUp.normalize());
    //this.globalOrbitUpHelper.position.copy(this.globalOrbit.clone().negate());

    this.camera.position.copy(this.localOrbit);
    this.camera.lookAt(0, 0, 0);
  }

  private setEvents() {
    this.eventSource.addEventListener("pointerdown", (e) => {
      this.eventSource.setPointerCapture(e.pointerId);
      this.lastPanPosition.set(e.clientX, e.clientY);
      this.stopMovement();
    });
    this.eventSource.addEventListener("pointerup", (e) => {
      this.eventSource.releasePointerCapture(e.pointerId);
      if (!e.shiftKey) this.panClock.start();
    });
    this.eventSource.addEventListener("pointermove", (e) => {
      if (e.buttons & 1 || e.buttons & 4) {
        this.lastPanDelta = new Vector2(
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
    });
    this.eventSource.addEventListener("wheel", (e) => {
      this.stopMovement();
      this.localOrbitZoomFrom.copy(this.localOrbit);
      this.localOrbitZoomTarget.copy(this.localOrbit);
      if (e.deltaY > 0) {
        this.localOrbitZoomTarget.multiplyScalar(this.zoomFactor);
      } else if (e.deltaY < 0) {
        this.localOrbitZoomTarget.multiplyScalar(1 / this.zoomFactor);
      }
      this.zoomClock.start();
    });
  }

  private handleLocalOrbitRotate(delta: THREE.Vector2) {
    const qHorizontal = new Quaternion().setFromAxisAngle(
      new Vector3(0, 0, 1),
      -delta.x * this.localOrbitSlowFactor
    );

    const horizontalAxis = new Vector3()
      .crossVectors(this.localOrbit, this.localOrbitUp)
      .normalize();

    const qVertical = new Quaternion().setFromAxisAngle(
      horizontalAxis,
      delta.y * this.localOrbitSlowFactor * 0.5
    );
    const panMotionQuaternion = new Quaternion().multiplyQuaternions(
      qHorizontal,
      qVertical
    );
    const oldZ = this.localOrbitUp.z;
    this.localOrbit.applyQuaternion(panMotionQuaternion);
    this.localOrbitUp.applyQuaternion(panMotionQuaternion);

    const from = (this.localOrbitElevationBounds.from * Math.PI) / 180;
    const to = (this.localOrbitElevationBounds.to * Math.PI) / 180;
    let angle = this.localOrbit.angleTo(new Vector3(0, 0, 1));
    if (
      !_.inRange(angle, from, to) ||
      Math.sign(oldZ) !== Math.sign(this.localOrbitUp.z)
    ) {
      angle = _.clamp(angle, from, to);
      horizontalAxis.applyQuaternion(qHorizontal);
      this.localOrbit = new Vector3(
        0,
        0,
        this.localOrbit.length()
      ).applyQuaternion(
        new Quaternion().setFromAxisAngle(horizontalAxis, -angle)
      );
      this.localOrbitUp.copy(
        this.localOrbit
          .clone()
          .applyQuaternion(
            new Quaternion().setFromAxisAngle(horizontalAxis, Math.PI / 2)
          )
          .normalize()
      );
    }
  }

  private handleGlobalOrbitRotate(delta: THREE.Vector2) {
    const localOrbitRadius = this.localOrbit.length();
    const slowFactor =
      (this.globalOrbitSlowFactor * localOrbitRadius) / this.globalOrbitRadius;

    const horizontalAxis = new Vector3()
      .crossVectors(this.localOrbitUp, this.localOrbit)
      .normalize();
    const verticalAxis = this.localOrbitUp.clone().normalize();
    // Vertical pan
    const qVertical = new Quaternion().setFromAxisAngle(
      horizontalAxis,
      delta.y * slowFactor
    );
    // Horizontal pan
    const qHorizontal = new Quaternion().setFromAxisAngle(
      verticalAxis,
      delta.x * slowFactor
    );
    const qPan = qHorizontal.clone().multiply(qVertical);
    if (delta.length() <= 2) {
      this.stopMovement();
    }

    this.globalOrbit.applyQuaternion(qPan);
    this.globalOrbitUp.applyQuaternion(qPan);

    const coords = GeoPosMapper.fromOrbit(this.globalOrbit, this.globalOrbitUp);

    const latAxis = this.globalOrbitUp.clone();
    const longAxis = new Vector3()
      .crossVectors(new Vector3(0, 0, 1), this.globalOrbitUp)
      .normalize();

    if (
      !this.inCycleRange(
        coords.lat,
        this.globalOrbitBounds.from.lat,
        this.globalOrbitBounds.to.lat
      )
    ) {
      const angle = this.getClosest(
        [this.globalOrbitBounds.from.lat, this.globalOrbitBounds.to.lat],
        coords.lat
      );
      const q = new Quaternion().setFromAxisAngle(latAxis, coords.lat - angle);
      this.globalOrbit.applyQuaternion(q);
      this.globalOrbitUp.applyQuaternion(q);
    }

    if (
      !_.inRange(
        coords.long,
        this.globalOrbitBounds.from.long,
        this.globalOrbitBounds.to.long
      )
    ) {
      const angle = this.getClosest(
        [this.globalOrbitBounds.from.long, this.globalOrbitBounds.to.long],
        coords.long
      );
      const q = new Quaternion().setFromAxisAngle(
        longAxis,
        coords.long - angle
      );

      this.globalOrbit.applyQuaternion(q);
      this.globalOrbitUp.applyQuaternion(q);
    }

    this.globalOrbitHelper.setDirection(this.globalOrbit.normalize());
  }

  private inCycleRange(n: number, from: number, to: number) {
    return from > to ? !_.inRange(n, to, from) : _.inRange(n, from, to);
  }

  private getClosest = _.curry((counts: number[], goal: number) => {
    return counts.reduce((prev, curr) =>
      Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
    );
  });

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
