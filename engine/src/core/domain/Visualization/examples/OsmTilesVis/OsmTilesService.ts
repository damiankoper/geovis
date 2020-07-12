import * as THREE from "three";
import { TrackballCamera } from "@/GeoVisEngine";
import { SphereBufferGeometry, Mesh } from "three";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import TWEEN from "@tweenjs/tween.js";
class TileTreeNode {
  static thetaShift = THREE.MathUtils.degToRad(90 - 85.0511);
  static thetaBound = THREE.MathUtils.degToRad(85.0511);

  geometry: SphereBufferGeometry;
  material = new THREE.MeshPhongMaterial({
    shininess: 5,
    transparent: true,
    opacity: 0,
    //depthFunc: THREE.NeverDepth.
    depthWrite: false,
  });

  mesh?: Mesh;
  visible = false;
  tween?: any;

  public readonly children: TileTreeNode[] = [];

  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly zoom: number,
    public readonly parent?: TileTreeNode
  ) {
    const d = Math.floor((-Math.tanh(zoom / 4) + 1) * 30 + 1);
    this.geometry = new SphereBufferGeometry(
      6371,
      d,
      d,
      this.phiStart,
      this.phiLength,
      this.thetaStart,
      this.thetaLength
    );
  }

  /**
   * todo:
   * url from outside -> function
   * radius from outside
   */
  get tileUrl() {
    return `http://localhost:3001/${this.zoom}/${this.x}/${this.y}.png`;
    //return `https://tile.openstreetmap.org/${this.zoom}/${this.x}/${this.y}.png`;
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

  calcDeep(
    camera: TrackballCamera,
    group: THREE.Group,
    desiredZoom: number
  ): boolean {
    let propagateUpper = false;
    this.hideTile();
    if (this.zoom < desiredZoom) {
      if (this.isVisibleByTileDistance(camera, 4)) {
        this.generateChildren();
      }
    }

    if (this.zoom === desiredZoom) {
      if (this.isVisibleByTileDistance(camera, 4)) {
        this.showTile(group);
        propagateUpper = true;
      }
    } else {
      const showDeeper = this.children.map((c) =>
        c.calcDeep(camera, group, desiredZoom)
      );
      showDeeper.forEach((showDeeper, i) => {
        if (!showDeeper) this.children[i].showTile(group);
      });
      if (showDeeper.some((t) => t)) propagateUpper = true;
    }

    if (!this.parent) {
      this.calcAnimDeep();
    }

    return propagateUpper;
  }

  calcAnimDeep(deep = true) {
    const visible = this.visible;
    const opacity = visible ? 1 : 0;

    const onEnd = () => {
      if (this.mesh) this.mesh.visible = visible;
      this.material.opacity = opacity;
      this.material.needsUpdate = true;
    };

    if (this.tween) this.tween.stop();
    if (
      (this.visible && !this.mesh?.visible && this.material.map) ||
      (!this.visible && this.mesh?.visible)
    ) {
      this.tween = new TWEEN.Tween({ opacity: this.material.opacity })
        .to({ opacity })
        .onStart(() => {
          if (this.mesh) this.mesh.visible = true;
        })
        .onUpdate((data) => {
          this.material.opacity = data.opacity;
          this.material.needsUpdate = true;
        })
        .onStop(onEnd)
        .onComplete(onEnd)
        .duration(150)
        .start(TWEEN.now());
    }
    if (deep) this.children.forEach((c) => c.calcAnimDeep());
  }

  showTile(group: THREE.Group) {
    if (!this.material.map) {
      new THREE.TextureLoader().load(this.tileUrl, (texture) => {
        if (this.material) {
          this.material.map = texture;
          this.material.color.setHex(0xffffff);
          this.material.needsUpdate = true;
          this.calcAnimDeep(false);
        }
      });
    }
    if (!this.mesh) {
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.matrixAutoUpdate = false;
      this.mesh.visible = false;
      this.mesh.renderOrder = this.zoom;
      this.mesh;
      group.add(this.mesh);
    }

    this.visible = true;
    this.hideSubtree();
  }

  hideTile() {
    if (this.mesh) this.visible = false;
  }

  hideSubtree() {
    this.children.forEach((c) => {
      c.hideTile();
      c.hideSubtree();
    });
  }

  isVisibleByTileDistance(camera: TrackballCamera, manhattanDistance: number) {
    const pos = camera.getGlobalOrbitPosition();
    const tileX = OsmTilesService.long2tile(pos.long, this.zoom);
    const tileY = OsmTilesService.lat2tile(pos.lat, this.zoom);
    const tiles = 2 ** this.zoom;

    let x = Math.abs(tileX - this.x);
    let y = Math.abs(tileY - this.y);

    if (x > tiles / 2) x = tiles - x;
    if (y > tiles / 2) y = tiles - y;

    return new THREE.Vector2(x, y).manhattanLength() <= manhattanDistance;
  }

  isVisibleByAngle(camera: TrackballCamera, angle: number) {
    const R = camera.getGlobalOrbitRadius();
    const RE = R + camera.getLocalOrbitRadius();
    const calcAngle = camera
      .getGlobalOrbit()
      .getVectorPointingAt(new GeoPosition(this.latCenter, this.longCenter))
      .angleTo(new THREE.Vector3(0, 0, 1));

    const distance = Math.sqrt(
      R ** 2 + RE ** 2 - 2 * R * RE * Math.cos(calcAngle)
    );
    const sinY = (R * Math.sin(calcAngle)) / distance;
    const Y = Math.asin(sinY);
    const B = Math.PI - Y - calcAngle;
    return B < angle;
  }

  generateChildren() {
    if (this.isLeaf)
      this.children.push(
        new TileTreeNode(this.x * 2, this.y * 2, this.zoom + 1, this),
        new TileTreeNode(this.x * 2 + 1, this.y * 2, this.zoom + 1, this),
        new TileTreeNode(this.x * 2, this.y * 2 + 1, this.zoom + 1, this),
        new TileTreeNode(this.x * 2 + 1, this.y * 2 + 1, this.zoom + 1, this)
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
