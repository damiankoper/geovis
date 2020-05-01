import * as THREE from "three";
import { Vector3, Quaternion, Vector2 } from "three";
import GeoPosition from "../../GeoPosition/interfaces/GeoPosition";
import GeoPosMapper from "../../GeoPosition/services/GeoPosMapperService";
import Hammer from "hammerjs";

/* TODO implements CameraController */
export default class TrackballController {
  private camera: THREE.Camera;
  private eventSource: HTMLCanvasElement;

  private globalOrbit = new Vector3(0, 637.1, 0);
  private localOrbit = new Vector3(0.01, 0.015, 0.01).multiplyScalar(1000);

  private mc: HammerManager;
  private panDelta = new Vector2();
  private panMotionQuaternion = new Quaternion();
  private noQuaternion = new Quaternion();

  constructor(camera: THREE.Camera, eventSource: HTMLCanvasElement) {
    this.camera = camera;
    this.eventSource = eventSource;
    this.mc = new Hammer(this.eventSource);

    this.setEvents();
    this.update();
  }

  setLocalOrbitRadius(radius: number) {
    this.localOrbit.setLength(radius);
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
    this.panMotionQuaternion.slerp(this.noQuaternion, 0.05);
    this.globalOrbit.applyQuaternion(this.panMotionQuaternion);

    const globalNormal = new Vector3().copy(this.globalOrbit).normalize();
    const rotation = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      globalNormal
    );

    const localRotated = new Vector3()
      .copy(this.localOrbit)
      .applyQuaternion(rotation);

    this.camera.position.copy(localRotated);

    this.camera.position.add(this.globalOrbit);

    this.camera.lookAt(this.globalOrbit);
    this.camera.up.copy(this.globalOrbit);
  }

  private setEvents() {
    const pan = new Hammer.Pan({
      direction: Hammer.DIRECTION_ALL,
      threshold: 0
    });
    this.mc.add(pan);
    this.mc.on("panstart", () => {
      this.panDelta.set(0, 0);
      this.stopMovement();
    });

    this.mc.on("panmove", ev => {
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

      const slower = 2000000;
      const qVertical = new Quaternion().setFromAxisAngle(
        horizontalAxis.clone().normalize(),
        (currentDelta.y / slower) *
          (localOrbitRadius + this.globalOrbit.length())
      );
      const qHorizontal = new Quaternion().setFromAxisAngle(
        verticalAxis.clone().normalize(),
        (currentDelta.x / slower) *
          (localOrbitRadius + this.globalOrbit.length())
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
  }

  private stopMovement() {
    this.panMotionQuaternion = new Quaternion();
  }
}
