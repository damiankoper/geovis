import * as THREE from "three";
import {
  Vector3,
  Quaternion,
  Vector2,
  Euler,
  Matrix4,
  ArrowHelper,
} from "three";
import GeoPosition from "../../GeoPosition/interfaces/GeoPosition";
import GeoPosMapper from "../../GeoPosition/services/GeoPosMapperService";
import Hammer from "hammerjs";
import _ from "lodash";

/* TODO implements CameraController */
export default class TrackballController {
  readonly r = 6371;

  private globalOrbit = new Vector3(0, 0, this.r);
  private globalOrbitUp = this.globalOrbit
    .clone()
    .applyEuler(new Euler(0, Math.PI / 2));
  private localOrbit = new Vector3(0, 0.001, 1)
    .multiplyScalar(10000)
    .applyEuler(new Euler(0, -Math.PI / 6, -Math.PI / 6));
  private localOrbitUp = this.localOrbit
    .clone()
    .applyEuler(new Euler(0, Math.PI / 2))
    .normalize();
  private localOrbitZoomTargetLength = this.localOrbit.length();

  private mc: HammerManager;
  private panMotionQuaternion = new Quaternion();
  private arrow: ArrowHelper;
  private arrow2: ArrowHelper;

  constructor(
    private readonly camera: THREE.Camera,
    private readonly scene: THREE.Scene,
    private readonly group: THREE.Group,
    private readonly eventSource: HTMLCanvasElement
  ) {
    this.camera = camera;
    this.eventSource = eventSource;
    this.mc = new Hammer(this.eventSource);

    this.camera.up.set(0, 0, this.r);

    this.arrow = new THREE.ArrowHelper(
      this.globalOrbit.clone().normalize(),
      new Vector3(0, 0, -this.globalOrbit.length()),
      this.r * 1.5,
      0xffff00
    );

    this.arrow2 = new THREE.ArrowHelper(
      this.globalOrbit.clone().normalize(),
      new Vector3(0, 0, -this.globalOrbit.length()),
      this.r * 1.5,
      0xff2200
    );

    this.group.matrixAutoUpdate = false;
    this.scene.add(this.arrow);
    this.scene.add(this.arrow2);
    this.setEvents();
    this.update();
  }

  setGlobalOrbitRadius(radius: number) {
    this.globalOrbit.setLength(radius);
  }

  setGlobalOrbitPosition(position: GeoPosition) {
    const rotation = GeoPosMapper.toRotationMatrix(position);
    const length = this.globalOrbit.length();
    this.globalOrbit = new Vector3(0, 0, length).applyMatrix4(rotation);
    this.globalOrbitUp = new Vector3(0, length, 0);
  }

  update() {
    this.panMotionQuaternion.slerp(new Quaternion(), 0.05);
    this.globalOrbit.applyQuaternion(this.panMotionQuaternion);

    this.localOrbit.lerp(
      this.localOrbit.clone().setLength(this.localOrbitZoomTargetLength),
      0.5
    );

    this.arrow.setDirection(this.globalOrbit.clone().normalize());

    this.group.matrix.identity();
    this.group.matrix.multiply(new Matrix4().makeTranslation(0, 0, -this.r));
    this.group.matrix.multiply(
      new Matrix4().lookAt(
        new Vector3(),
        this.globalOrbit.clone().negate(),
        this.globalOrbitUp
      )
    );

    const camPosition = this.localOrbit;
    this.camera.position.copy(camPosition);
    this.camera.lookAt(0, 0, 0);
  }

  private setEvents() {
    const pan = new Hammer.Pan({
      direction: Hammer.DIRECTION_ALL,
      threshold: 0,
    });
    this.mc.add(pan);
    this.mc.on("panstart", () => {
      this.stopMovement();
    });

    this.mc.on("panmove", (ev) => {
      const allDelta = new Vector2(ev.velocityX, ev.velocityY);
      if (ev.srcEvent.shiftKey) {
        this.handleLocalOrbitRotate(allDelta);
      } else {
        this.handleGlobalOrbitRotate(allDelta);
      }
    });

    this.eventSource.addEventListener("mousedown", () => {
      this.stopMovement();
    });

    this.eventSource.addEventListener("wheel", (ev) => {
      this.stopMovement();
      this.localOrbit.setLength(this.localOrbitZoomTargetLength)
      if (ev.deltaY > 0) {
        this.localOrbitZoomTargetLength = this.localOrbit.length() * 0.8;
      } else if (ev.deltaY < 0) {
        this.localOrbitZoomTargetLength =
          this.localOrbit.length() * 1.25;
      }
    });
  }

  handleLocalOrbitRotate(delta: THREE.Vector2) {
    const slowFactor = 0.05;
    const qHorizontal = new Quaternion().setFromAxisAngle(
      new Vector3(0, 0, 1),
      -delta.x * slowFactor
    );
    const horizontalAxis = new Vector3()
      .crossVectors(this.localOrbit, new Vector3(0, 0, 1))
      .normalize();
    const qVertical = new Quaternion().setFromAxisAngle(
      horizontalAxis,
      delta.y * slowFactor * 0.5
    );
    const panMotionQuaternion = new Quaternion().multiplyQuaternions(
      qHorizontal,
      qVertical
    );

    const bottom = (5 * Math.PI) / 180;
    const top = (5 * Math.PI) / 180;

    this.localOrbit.applyQuaternion(panMotionQuaternion);
    this.localOrbitUp.applyQuaternion(panMotionQuaternion);

    //Bottom
    const bottomAngle = this.localOrbit.angleTo(
      this.localOrbit.clone().setZ(0)
    );
    if (
      bottomAngle < bottom ||
      (this.localOrbit.z < 0 && this.localOrbitUp.z > 0)
    ) {
      this.localOrbit = this.localOrbit
        .clone()
        .setZ(0)
        .setLength(this.localOrbit.length())
        .applyQuaternion(
          new Quaternion().setFromAxisAngle(horizontalAxis, bottom)
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

    //Top
    const topAngle = this.localOrbit.angleTo(new Vector3(0, 0, 1));
    if (topAngle < top || (this.localOrbit.z > 0 && this.localOrbitUp.z < 0)) {
      this.localOrbit = new Vector3(0, 0, this.localOrbit.length())
        .applyQuaternion(
          new Quaternion().setFromAxisAngle(horizontalAxis, -top)
        )
        .applyQuaternion(qHorizontal);
      this.localOrbitUp.copy(
        new Vector3(0, 0, 1)
          .applyQuaternion(
            new Quaternion().setFromAxisAngle(
              horizontalAxis,
              -top + Math.PI / 2
            )
          )
          .normalize()
      );
    }
  }

  private handleGlobalOrbitRotate(delta: THREE.Vector2) {
    const slowFactor = 0.000001;

    const horizontalAxis = new Vector3().crossVectors(
      this.localOrbit.clone().normalize(),
      new Vector3(0, 0, 1)
    );

    this.arrow2.setDirection(horizontalAxis.normalize());

    const localOrbitRadius = this.localOrbit.length();
    const qVertical = new Quaternion().setFromAxisAngle(
      horizontalAxis,
      -delta.y * localOrbitRadius * slowFactor
    );

    const qHorizontal = new Quaternion().setFromAxisAngle(
      this.localOrbit.clone().setZ(0).normalize(),
      -delta.x * localOrbitRadius * slowFactor
    );

    const panMotionQuaternion = new Quaternion().multiplyQuaternions(
      qHorizontal,
      qVertical
    );
    if (delta.manhattanLength() > 2) {
      this.panMotionQuaternion = panMotionQuaternion;
    } else {
      this.panMotionQuaternion = new Quaternion();
    }

    this.globalOrbit.applyQuaternion(panMotionQuaternion);
    this.globalOrbitUp.applyQuaternion(panMotionQuaternion);
  }

  private stopMovement() {
    this.panMotionQuaternion = new Quaternion();
  }
}
