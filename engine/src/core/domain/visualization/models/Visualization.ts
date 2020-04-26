import * as THREE from "three";
export default abstract class Visualization {
  abstract readonly parents: Visualization[];

  public _setup(scene: THREE.Scene) {
    this.parents.forEach(() => this.setup(scene));
    this.setup(scene);
  }
  abstract setup(scene: THREE.Scene): void;

  public _update() {
    this.parents.forEach(() => this.update());
    this.update();
  }
  abstract update(): void;

  public _destroy() {
    this.parents.forEach(() => this.destroy());
    this.destroy();
  }
  abstract destroy(): void;
}
