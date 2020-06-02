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

/* TODO implements CameraController */
export default class TrackballController {
  readonly r = 6371;

  private globalOrbit = new Vector3(0, 0, this.r);
  private globalOrbitUp = new Vector3(0, 100, 0);
  private localOrbit = new Vector3(0, 0.001, 1)
    .multiplyScalar(10000)
    .applyEuler(new Euler(0, -Math.PI / 6, -Math.PI / 6));

  private mc: HammerManager;
  private panDelta = new Vector2();
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

    /* this.globalOrbit.applyQuaternion(
      new Quaternion().setFromAxisAngle(new Vector3(1, 1, 0), Math.PI / 4)
    ); */
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
  }

  update() {
    //this.panMotionQuaternion.slerp(new Quaternion(), 0.05);
    //this.globalOrbit.applyQuaternion(this.panMotionQuaternion);

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
      if (ev.deltaY > 0) this.localOrbit.multiplyScalar(0.8);
      else if (ev.deltaY < 0) {
        this.localOrbit.multiplyScalar(1.222222222223);
      }
    });
  }
  handleLocalOrbitRotate(allDelta: THREE.Vector2) {
    const slowFactor = 0.1;
    const currentDelta = allDelta.clone().sub(this.panDelta);
    const qVertical = new Quaternion().setFromAxisAngle(
      new Vector3(0, 0, 1),
      -currentDelta.x * slowFactor
    );

    const verticalAxis = new Vector3().crossVectors(
      this.localOrbit,
      new Vector3(0, 0, 1)
    );
    const qHorizontal = new Quaternion().setFromAxisAngle(
      verticalAxis.normalize(),
      currentDelta.y * slowFactor * 0.5
    );
    const panMotionQuaternion = new Quaternion().multiplyQuaternions(
      qVertical,
      qHorizontal
    );
    this.localOrbit.applyQuaternion(panMotionQuaternion);
  }

  private handleGlobalOrbitRotate(allDelta: THREE.Vector2) {
    const currentDelta = allDelta.clone().sub(this.panDelta);
    const horizontalAxis = new Vector3().crossVectors(
      this.localOrbit.clone().normalize(),
      new Vector3(0, 0, 1)
    );

    this.arrow2.setDirection(horizontalAxis.normalize());

    const localOrbitRadius = this.localOrbit.length();
    const slowFactor = 0.000001;
    const qVertical = new Quaternion().setFromAxisAngle(
      horizontalAxis,
      -currentDelta.y * localOrbitRadius * slowFactor
    );

    const qHorizontal = new Quaternion().setFromAxisAngle(
      this.localOrbit.clone().setZ(0).normalize(),
      -currentDelta.x * localOrbitRadius * slowFactor
    );

    const panMotionQuaternion = new Quaternion().multiplyQuaternions(
      qHorizontal,
      qVertical
    );
    //TODO: keep velocity
    /* if (currentDelta.manhattanLength() > 2) {
      this.panMotionQuaternion = panMotionQuaternion;
    } else {
      this.panMotionQuaternion = new Quaternion();
    } */
    //this.globalOrbit.applyQuaternion(panMotionQuaternion);
    this.globalOrbit.applyQuaternion(panMotionQuaternion);
    this.globalOrbitUp.applyQuaternion(panMotionQuaternion);
  }

  private stopMovement() {
    this.panDelta.set(0, 0);
    this.panMotionQuaternion = new Quaternion();
  }
}
