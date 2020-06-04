import Visualization from "../models/Visualization";
import * as THREE from "three";
import { Matrix4, Quaternion, Vector3 } from "three";
//import TrackballController from "../../Camera/controllers/TrackballController";
export default class SphereVis extends Visualization {
  private scene?: THREE.Group;

  setupCamera(/* controller: TrackballController */): void {
    console.info("setup camera");
  }
  setupScene(group: THREE.Group): void {
    console.info("setup scene");
    this.scene = group;
    const r = 6371;

    const sphere = new THREE.SphereGeometry(r, 100, 100);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xbada55 });
    const sphereMesh = new THREE.Mesh(sphere, sphereMaterial);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const wireframe = new THREE.LineSegments(sphereMesh.geometry, material);

    group.add(sphereMesh);
    group.add(wireframe);

    const testBoxes = [
      new THREE.BoxBufferGeometry(0.001, 0.001, 0.001),
      new THREE.BoxBufferGeometry(0.01, 0.01, 0.01),
      new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
      new THREE.BoxBufferGeometry(1, 1, 1),
      new THREE.BoxBufferGeometry(10, 10, 10),
      new THREE.BoxBufferGeometry(100, 100, 100),
    ];

    const boxGroup = new THREE.Group();
    boxGroup.applyMatrix4(new Matrix4().makeTranslation(0, r, 0));
    boxGroup.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));

    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x5500ff });
    testBoxes.forEach((box, i) => {
      box.applyMatrix4(new Matrix4().makeTranslation(0, 0, -(10 ** (i - 3))));
      const boxMesh = new THREE.Mesh(box, boxMaterial);
      boxGroup.add(boxMesh);
    });
    group.add(boxGroup);

    const axesHelper = new THREE.AxesHelper(1.25 * r);
    group.add(axesHelper);
  }
  update(): void {
    console.info("update");
  }
  destroy(): void {
    console.info("destroy");
  }
}
