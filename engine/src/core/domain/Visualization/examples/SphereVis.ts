import Visualization from "../models/Visualization";
import * as THREE from "three";
import { Matrix4 } from "three";
//import TrackballController from "../../Camera/controllers/TrackballController";
export default class SphereVis extends Visualization {
  setupCamera(/* controller: TrackballController */): void {
    console.info("setup camera");
  }
  setupScene(scene: THREE.Scene): void {
    console.info("setup scene");
    const r = 6371;
    const box = new THREE.SphereBufferGeometry(6371, 200, 200);
    const material = new THREE.MeshBasicMaterial({ color: 0xbada55 });
    const boxMesh = new THREE.Mesh(box, material);
    const box1 = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01).applyMatrix4(
      new Matrix4().makeTranslation(0, r, 0)
    );
    const material1 = new THREE.MeshBasicMaterial({ color: 0x5500ff });
    const boxMesh1 = new THREE.Mesh(box1, material1);
    const axesHelper = new THREE.AxesHelper(10);

    scene.add(axesHelper);
    scene.add(boxMesh);
    scene.add(boxMesh1);
  }
  update(): void {
    console.info("update");
  }
  destroy(): void {
    console.info("destroy");
  }
}
