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

    const sphere = new THREE.SphereBufferGeometry(6371, 200, 200);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xbada55 });
    const sphereMesh = new THREE.Mesh(sphere, sphereMaterial);
    scene.add(sphereMesh);

    const testBoxes = [
      new THREE.BoxBufferGeometry(0.01, 0.01, 0.01),
      new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
      new THREE.BoxBufferGeometry(1, 1, 1),
      new THREE.BoxBufferGeometry(10, 10, 10),
      new THREE.BoxBufferGeometry(100, 100, 100)
    ];

    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x5500ff });
    testBoxes.forEach((box, i) => {
      box.applyMatrix4(new Matrix4().makeTranslation(0, r, 0));
      box.applyMatrix4(new Matrix4().makeTranslation(0, 0, -(10 ** (i - 2))));
      const boxMesh = new THREE.Mesh(box, boxMaterial);
      scene.add(boxMesh);
    });

    const axesHelper = new THREE.AxesHelper(2 * r);
    scene.add(axesHelper);
  }
  update(): void {
    console.info("update");
  }
  destroy(): void {
    console.info("destroy");
  }
}
