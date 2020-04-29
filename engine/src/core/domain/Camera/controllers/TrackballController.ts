import * as THREE from "three";
import { Vector3, Euler, Matrix4, Quaternion, Matrix3 } from "three";
import GeoPosition from "../../GeoPosition/interfaces/GeoPosition";
import GeoPosMapper from "../../GeoPosition/services/GeoPosMapperService";

/* TODO implements CameraController */
export default class TrackballController {
  private camera: THREE.Camera;
  private eventSource: HTMLCanvasElement;

  private globalOrbit = new Vector3(0, 6371, 0);
  private localOrbit = new Vector3(0.1, 0.01, 0);

  constructor(camera: THREE.Camera, eventSource: HTMLCanvasElement) {
    this.camera = camera;
    this.eventSource = eventSource;

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
    this.localOrbit.applyEuler(new Euler(0, 0.04, 0));
    //this.globalOrbit.applyEuler(new Euler(0, 0.01, 0));
   // this.localOrbit.y = (Math.sin(performance.now()/1000)+1)*2000
    //console.log( this.localOrbit.y);
    
    const globalNormal = new Vector3().copy(this.globalOrbit).normalize();
    const rotation = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      globalNormal
    );

   /*  const localUp = new Vector3()
      .copy(this.localOrbit)
      .applyEuler(new Euler(0, Math.PI, 0))
      .applyQuaternion(rotation); */

    const localRotated = new Vector3()
      .copy(this.localOrbit)
      .applyQuaternion(rotation);

    this.camera.position.copy(localRotated);

    // this.camera.position.applyMatrix4(new Matrix4().makeTranslation(0,0,5))
    this.camera.position.add(this.globalOrbit);

    this.camera.lookAt(this.globalOrbit);
    this.camera.up.copy(this.globalOrbit);
  }
}
