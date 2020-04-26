import Visualization from "../models/Visualization";
import * as THREE from 'three'
export default class SphereVis extends Visualization {
  parents: Visualization[] = [];

  setup(scene: THREE.Scene): void {
    console.info("setup");
    const box = new THREE.BoxBufferGeometry(2,2,2);
    const material = new THREE.MeshBasicMaterial( { color: 0xbada55 } );
    const boxMesh = new THREE.Mesh( box, material );
    scene.add(boxMesh)

  }
  update(): void {
    console.info("update");
  }
  destroy(): void {
    console.info("destroy");
  }
}
