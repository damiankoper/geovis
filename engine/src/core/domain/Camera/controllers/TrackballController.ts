import * as THREE from "three";
import { Vector3, Quaternion } from "three";
import GeoPosition from "../../GeoPosition/interfaces/GeoPosition";
import GeoPosMapper from "../../GeoPosition/services/GeoPosMapperService";
import Hammer from "hammerjs";

/* TODO implements CameraController */
export default class TrackballController {
  private camera: THREE.Camera;
  private eventSource: HTMLCanvasElement;
  private mc: HammerManager;

  private globalOrbit = new Vector3(0, 6371, 0);
  private localOrbit = new Vector3(0.1, 0.1, 0.1);

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
    const pan = new Hammer.Pan({ direction: Hammer.DIRECTION_ALL });
    this.mc.add(pan);
    this.mc.on("panmove", function(ev) {
      console.log(ev);
    });
  }
}
