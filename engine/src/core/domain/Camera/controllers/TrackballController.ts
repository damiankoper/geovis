import * as THREE from "three";
import { Vector3, Quaternion, Vector2, Euler } from "three";
import GeoPosition from "../../GeoPosition/interfaces/GeoPosition";
import GeoPosMapper from "../../GeoPosition/services/GeoPosMapperService";
import Hammer from "hammerjs";

/* TODO implements CameraController */
export default class TrackballController {
  private globalOrbit = new Vector3(0, 0.000001, 0);
  private localOrbit = new Vector3(1, 1, 0).multiplyScalar(100);

  private mc: HammerManager;
  private panDelta = new Vector2();
  private panMotionQuaternion = new Quaternion();

  constructor(
    private readonly camera: THREE.Camera,
    private readonly scene: THREE.Scene,
    private readonly eventSource: HTMLCanvasElement
  ) {
    this.camera = camera;
    this.eventSource = eventSource;
    this.mc = new Hammer(this.eventSource);

    this.setEvents();
    this.update();
  }

  setGlobalOrbitRadius(radius: number) {
    this.globalOrbit.setLength(radius);
  }

  setGlobalOrbitPosition(position: GeoPosition) {
    const rotation = GeoPosMapper.toRotationMatrix(position);
    const length = this.globalOrbit.length();
    this.globalOrbit = new Vector3(length, 0, 0).applyMatrix4(rotation);
  }

  update() {
    this.panMotionQuaternion.slerp(new Quaternion(), 0.05);
    this.globalOrbit.applyQuaternion(this.panMotionQuaternion);
    this.localOrbit.applyEuler(new Euler(0, 0.01, 0, "YXZ"));

    const globalNormalized = this.globalOrbit.clone().normalize();
    const rotation = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      globalNormalized
    );

    
    const camPosition = this.localOrbit.clone().applyQuaternion(rotation);

    this.scene.position.set(
      -this.globalOrbit.x,
      -this.globalOrbit.y,
      -this.globalOrbit.z
    );

    this.camera.position.copy(camPosition);
    this.camera.lookAt(0, 0, 0);
    this.camera.up.copy(this.globalOrbit);
    console.log("global", this.globalOrbit.x,this.globalOrbit.y,this.globalOrbit.z);
    console.log("local",  this.localOrbit.x,this.localOrbit.y,this.localOrbit.z);
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
      const allDelta = new Vector2(ev.deltaX, ev.deltaY);
      const currentDelta = allDelta.clone().sub(this.panDelta);

      const horizontalAxis = new Vector3().crossVectors(
        this.camera.position,
        this.globalOrbit
      );
      const verticalAxis = new Vector3().crossVectors(
        this.camera.position,
        horizontalAxis
      );

      const localOrbitRadius = this.localOrbit.length();

      const slowFactor = 0.000001;
      const qVertical = new Quaternion().setFromAxisAngle(
        horizontalAxis.clone().normalize(),
        currentDelta.y * localOrbitRadius * slowFactor
      );
      const qHorizontal = new Quaternion().setFromAxisAngle(
        verticalAxis.clone().normalize(),
        currentDelta.x * localOrbitRadius * slowFactor
      );

      const panMotionQuaternion = new Quaternion().multiplyQuaternions(
        qVertical,
        qHorizontal
      );

      if (currentDelta.manhattanLength() > 2) {
        this.panMotionQuaternion = panMotionQuaternion;
      } else {
        this.panMotionQuaternion = new Quaternion();
        this.globalOrbit.applyQuaternion(panMotionQuaternion);
      }

      this.panDelta.copy(allDelta);
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

  private stopMovement() {
    this.panDelta.set(0, 0);
    this.panMotionQuaternion = new Quaternion();
  }
}
