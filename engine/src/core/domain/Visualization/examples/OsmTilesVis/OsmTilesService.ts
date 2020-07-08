import * as THREE from "three";
import { TrackballCamera } from "@/GeoVisEngine";
import {
  SphereGeometry,
  Mesh,
  MeshPhongMaterial,
  Quaternion,
  Vector3,
} from "three";
class TileTreeNode {
  static thetaShift = THREE.MathUtils.degToRad(90 - 85.0511);
  static thetaBound = THREE.MathUtils.degToRad(85.0511);

  geometry: SphereGeometry;

  mesh?: Mesh;
  material?: MeshPhongMaterial;

  public readonly children: TileTreeNode[] = [];

  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly zoom: number
  ) {
    this.geometry = new SphereGeometry(
      6371,
      5,
      5,
      this.phiStart,
      this.phiLength,
      this.thetaStart,
      this.thetaLength
    );
  }

  get tileUrl() {
    return `https://tile.openstreetmap.org/${this.zoom}/${this.x}/${this.y}.png`;
  }
  get isLeaf() {
    return this.children.length === 0;
  }

  get phiStart() {
    return this.phiLength * this.x;
  }
  get phiLength() {
    return (2 * Math.PI) / 2 ** this.zoom;
  }

  get thetaStart() {
    return (
      TileTreeNode.thetaBound -
      OsmTilesService.tile2lat(this.y, this.zoom) +
      TileTreeNode.thetaShift
    );
  }
  get thetaLength() {
    return (
      TileTreeNode.thetaBound -
      OsmTilesService.tile2lat(this.y + 1, this.zoom) +
      TileTreeNode.thetaShift -
      this.thetaStart
    );
  }

  get long() {
    return OsmTilesService.tile2long(this.x, this.zoom);
  }
  get longCenter() {
    return (
      (OsmTilesService.tile2long(this.x, this.zoom) +
        OsmTilesService.tile2long(this.x + 1, this.zoom)) /
      2
    );
  }

  get lat() {
    return OsmTilesService.tile2lat(this.y, this.zoom);
  }
  get latCenter() {
    return (
      (OsmTilesService.tile2lat(this.y, this.zoom) +
        OsmTilesService.tile2lat(this.y + 1, this.zoom)) /
      2
    );
  }
  calcDeep(camera: TrackballCamera, group: THREE.Group) {
    if (this.x == 0 && this.y == 0)
      if (this.isCenterVisibleInCamera(camera) && this.zoom < 4) {
        this.generateChildren();
        this.children.forEach((c) => c.calcDeep(camera, group));
        if (this.mesh) group.remove(this.mesh);
      } else {
        if (!this.material) {
          this.material = new THREE.MeshPhongMaterial();
          //if (this.zoom == 2 && this.x == 2 && this.y == 1)
          this.material.map = new THREE.TextureLoader().load(this.tileUrl);
          this.material.shininess = 5;
        }
        if (!this.mesh) {
          this.mesh = new THREE.Mesh(this.geometry, this.material);
          this.mesh.matrixAutoUpdate = false;
        }
        group.add(this.mesh);
      }
  }

  isCenterVisibleInCamera(camera: TrackballCamera) {
    const R = camera.getGlobalOrbitRadius();
    const RE = R + camera.getLocalOrbitRadius();
    const angle = new THREE.Quaternion()
      .setFromUnitVectors(
        camera
          .getGlobalOrbit()
          .v.clone()
          .normalize()
          .applyQuaternion(
            new Quaternion().setFromAxisAngle(
              new Vector3()
                .crossVectors(
                  camera.getGlobalOrbit().up,
                  camera.getGlobalOrbit().v
                )
                .normalize(),
              -this.latCenter
            )
          )
          .applyQuaternion(
            new Quaternion().setFromAxisAngle(
              camera.getGlobalOrbit().up,
              this.longCenter
            )
          ),
        new THREE.Vector3(0, 0, 1)
      )
      .angleTo(new THREE.Quaternion());

    const distance = Math.sqrt(R ** 2 + RE ** 2 - 2 * R * RE * Math.cos(angle));
    const sinY = (R * Math.sin(angle)) / distance;
    const Y = Math.asin(sinY);
    const B = Math.PI - Y - angle;

    return B >= Math.PI / 2;
  }

  generateChildren() {
    if (this.isLeaf)
      this.children.push(
        new TileTreeNode(this.x * 2, this.y * 2, this.zoom + 1),
        new TileTreeNode(this.x * 2 + 1, this.y * 2, this.zoom + 1),
        new TileTreeNode(this.x * 2, this.y * 2 + 1, this.zoom + 1),
        new TileTreeNode(this.x * 2 + 1, this.y * 2 + 1, this.zoom + 1)
      );
  }
}

export class OsmTilesService {
  public tileTreeRoot = new TileTreeNode(0, 0, 0);

  static tile2lat(y: number, z: number) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  static tile2long(x: number, z: number) {
    return ((x / Math.pow(2, z)) * 2 - 1) * Math.PI;
  }

  static long2tile(lon: number, zoom: number) {
    return Math.floor(((lon + Math.PI) / (Math.PI * 2)) * Math.pow(2, zoom));
  }

  static lat2tile(lat: number, zoom: number) {
    return Math.floor(
      ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) *
        Math.pow(2, zoom)
    );
  }
}
