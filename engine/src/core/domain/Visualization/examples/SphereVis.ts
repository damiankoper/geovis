import Visualization from "../models/Visualization";
import * as THREE from "three";
import { Matrix4, Box3, Vector3 } from "three";
import image from "@/assets/textures/earthmap1k.jpg";
//import TrackballController from "../../Camera/controllers/TrackballController";
export default class SphereVis extends Visualization {
  setupCamera(/* controller: TrackballController */): void {
    console.info("setup camera");
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    console.info("setup scene");
    const r = 6371;

    const sphere = new THREE.SphereGeometry(r, 100, 100);
    const sphereMaterial = new THREE.MeshPhongMaterial();
    const texture = THREE.ImageUtils.loadTexture(image);
    sphereMaterial.map = texture;
    const sphereMesh = new THREE.Mesh(sphere, sphereMaterial);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const wireframe = new THREE.LineSegments(sphereMesh.geometry, material);
    /*     sphereMesh.position.z = r
    wireframe.position.z = r */

    sphereMesh.matrixAutoUpdate = false;
    wireframe.matrixAutoUpdate = false;
    group.add(sphereMesh);
    //group.add(wireframe);

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

    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x5500ff });
    testBoxes.forEach((box, i) => {
      box.applyMatrix4(new Matrix4().makeTranslation(0, 0, -(10 ** (i - 3))));
      const boxMesh = new THREE.Mesh(box, boxMaterial);
      boxGroup.add(boxMesh);
    });
    group.add(boxGroup);

    const axesHelper = new THREE.AxesHelper(1.25 * r);
    group.add(axesHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    scene.add(directionalLight);
    directionalLight.position.set(0, 0, 1);

    scene.add(new THREE.AxesHelper(9000));
  }

  update(): void {
    console.info("update");
  }

  destroy(): void {
    console.info("destroy");
  }
}
