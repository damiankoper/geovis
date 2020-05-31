import Visualization from "../models/Visualization";
import * as THREE from "three";
import { Matrix4 } from "three";
//import TrackballController from "../../Camera/controllers/TrackballController";
export default class SphereVis extends Visualization {
  private scene?: THREE.Scene;

  setupCamera(/* controller: TrackballController */): void {
    console.info("setup camera");
  }
  setupScene(scene: THREE.Scene): void {
    this.scene = scene;
    console.info("setup scene");
    const r = 6371;

    const sphere = new THREE.SphereBufferGeometry(
      r,
      100,
      100,
      0,
      Math.PI * 2,
      0,
      Math.PI / 16
    );
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xbada55 });
    const sphereMesh = new THREE.Mesh(sphere, sphereMaterial);
    sphereMesh.position.setY(-r);
    scene.add(sphereMesh);

    const material = new THREE.LineBasicMaterial( { color: 0xffffff } );
    const wireframe = new THREE.LineSegments( sphereMesh.geometry, material );
    wireframe.position.setY(-r);
    scene.add(wireframe)

    const testBoxes = [
      new THREE.BoxBufferGeometry(0.001, 0.001, 0.001),
      new THREE.BoxBufferGeometry(0.01, 0.01, 0.01),
      new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
      new THREE.BoxBufferGeometry(1, 1, 1),
      new THREE.BoxBufferGeometry(10, 10, 10),
      new THREE.BoxBufferGeometry(100, 100, 100),
      //new THREE.BoxBufferGeometry(1000, 1000, 1000),
    ];

    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x5500ff });
    testBoxes.forEach((box, i) => {
      box.applyMatrix4(
        new Matrix4().makeTranslation(0, 0, -(10 ** (i - 3)))
      );
      const boxMesh = new THREE.Mesh(box, boxMaterial);
      
      scene.add(boxMesh);
    });

    /*     const axesHelper = new THREE.AxesHelper(2 * r);
    scene.add(axesHelper);
    if (this.scene) {
      console.log(this.scene.children);
    } */
  }
  update(): void {
    console.info("update");
  }
  destroy(): void {
    console.info("destroy");
  }
}
