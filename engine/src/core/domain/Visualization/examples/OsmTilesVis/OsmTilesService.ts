import * as THREE from "three";
import { TrackballCamera } from "@/GeoVisEngine";
import {
  SphereBufferGeometry,
  Mesh,
  TextureLoader,
  NearestFilter,
  InstancedBufferGeometry,
  Sphere,
} from "three";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import tileBg from "@/assets/textures/tile_bg.png";
import TWEEN from "@tweenjs/tween.js";
class TileTreeNode {
  geometry: SphereBufferGeometry;
  material = new THREE.MeshPhongMaterial({
    shininess: 5,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  mesh?: Mesh;
  bgMesh?: Mesh;
  tween?: any;
  visible = false;

  public readonly children: TileTreeNode[] = [];

  position: GeoPosition;
  positionCenter: GeoPosition;

  constructor(
    public readonly service: OsmTilesService,
    public readonly x: number,
    public readonly y: number,
    public readonly zoom: number,
    public readonly parent?: TileTreeNode
  ) {
    this.geometry = this.service.getGeometry(zoom, y);
    const lat = this.service.tile2lat(this.y, this.zoom);
    const latNext = this.service.tile2lat(this.y + 1, this.zoom);
    const long = this.service.tile2long(this.x, this.zoom);
    const longNext = this.service.tile2long(this.x + 1, this.zoom);
    this.position = new GeoPosition(lat, long);
    this.positionCenter = new GeoPosition(
      (lat + latNext) / 2,
      (long + longNext) / 2
    );
  }

  /**
   * todo:
   * url from outside -> function
   * radius from outside
   */
  get tileUrl() {
    //return `http://localhost:3001/${this.zoom}/${this.x}/${this.y}.png`;
    return `https://tile.openstreetmap.org/${this.zoom}/${this.x}/${this.y}.png`;
  }
  get isLeaf() {
    return this.children.length === 0;
  }

  get tilesDistance() {
    switch (this.zoom) {
      case 0:
      case 1:
        return 2;
      case 2:
        return 3;
      default:
        return 4;
    }
  }

  calcDeep(
    camera: TrackballCamera,
    group: THREE.Group,
    desiredZoom: number
  ): boolean {
    let propagateUpper = false;
    const visibleByTileDistance = this.isVisibleByTileDistance(
      camera,
      this.tilesDistance
    );
    this.hideTile();
    if (this.zoom < desiredZoom) {
      if (visibleByTileDistance) {
        this.generateChildren();
      }
    }

    if (this.zoom === desiredZoom) {
      if (visibleByTileDistance) {
        this.showTile(group);
        propagateUpper = true;
      }
    } else {
      this.children
        .map((c) => c.calcDeep(camera, group, desiredZoom))
        .forEach((showDeeper, i) => {
          if (!showDeeper) this.children[i].showTile(group);
          else propagateUpper = true;
        });
    }

    if (!this.parent) {
      this.calcAnimDeep();
      this.destroyDangling(camera, group, desiredZoom);
      console.log(group.children.length);
    }

    return propagateUpper;
  }

  calcAnimDeep(deep = true) {
    const visible = this.visible;
    const opacity = visible ? 1 : 0;

    const onEnd = () => {
      if (this.mesh) this.mesh.visible = visible;
      if (this.bgMesh) this.bgMesh.visible = false;
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
          if (this.bgMesh) this.bgMesh.visible = true;
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
      this.mesh.rotateY(this.service.phiStart(this.x, this.zoom));
      this.mesh.updateMatrix();
      this.mesh.renderOrder = this.zoom;
      this.mesh.visible = false;
      group.add(this.mesh);
    }

    if (!this.bgMesh) {
      this.bgMesh = this.mesh.clone();
      this.bgMesh.material = this.service.bgMaterial;
      this.bgMesh.renderOrder--;
      this.bgMesh.visible = true;
      group.add(this.bgMesh);
    }

    this.visible = true;
    this.hideSubtree();
  }

  hideTile() {
    this.visible = false;
  }

  hideSubtree() {
    this.children.forEach((c) => {
      c.hideTile();
      c.hideSubtree();
    });
  }

  destroyDangling(
    camera: TrackballCamera,
    group: THREE.Group,
    desiredZoom: number
  ) {
    this.children.forEach((c) => c.destroyDangling(camera, group, desiredZoom));
    if (
      !this.isVisibleByTileDistance(camera, this.tilesDistance + 2) ||
      this.zoom > desiredZoom
    ) {
      this.children.forEach((c) => c.destroy(group));
      this.children.splice(0, this.children.length);
    }
  }

  destroy(group: THREE.Group) {
    if (this.mesh) group.remove(this.mesh);
    if (this.bgMesh) group.remove(this.bgMesh);
    this.geometry.dispose();
    this.material.map?.dispose();
    this.material.dispose();
  }

  isVisibleByTileDistance(camera: TrackballCamera, manhattanDistance: number) {
    const pos = camera.getGlobalOrbitPosition();
    const tileX = this.service.long2tile(pos.long, this.zoom);
    const tileY = this.service.lat2tile(pos.lat, this.zoom);
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
      .getVectorPointingAt(this.positionCenter)
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
        new TileTreeNode(
          this.service,
          this.x * 2,
          this.y * 2,
          this.zoom + 1,
          this
        ),
        new TileTreeNode(
          this.service,
          this.x * 2 + 1,
          this.y * 2,
          this.zoom + 1,
          this
        ),
        new TileTreeNode(
          this.service,
          this.x * 2,
          this.y * 2 + 1,
          this.zoom + 1,
          this
        ),
        new TileTreeNode(
          this.service,
          this.x * 2 + 1,
          this.y * 2 + 1,
          this.zoom + 1,
          this
        )
      );
  }
}

export class OsmTilesService {
  public thetaShift = THREE.MathUtils.degToRad(90 - 85.0511);
  public thetaBound = THREE.MathUtils.degToRad(85.0511);

  public bgMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color("white"),
    depthWrite: false,
    shininess: 5,
    map: new TextureLoader().load(tileBg),
  });
  public geometryMap = new Map<number, Map<number, SphereBufferGeometry>>();

  public tileTreeRoot = new TileTreeNode(this, 0, 0, 0);

  constructor() {
    if (this.bgMaterial.map) this.bgMaterial.map.magFilter = NearestFilter;
  }

  phiStart(x: number, zoom: number) {
    return this.phiLength(zoom) * x;
  }
  phiLength(zoom: number) {
    return (2 * Math.PI) / 2 ** zoom;
  }

  thetaStart(y: number, zoom: number) {
    return this.thetaBound - this.tile2lat(y, zoom) + this.thetaShift;
  }
  thetaLength(y: number, zoom: number) {
    return (
      this.thetaBound -
      this.tile2lat(y + 1, zoom) +
      this.thetaShift -
      this.thetaStart(y, zoom)
    );
  }

  getGeometry(zoom: number, y: number) {
    let latMap = this.geometryMap.get(zoom);
    if (!latMap) {
      latMap = new Map<number, SphereBufferGeometry>();
      this.geometryMap.set(zoom, latMap);
    }

    let geometry = latMap.get(y);
    if (!geometry) {
      const d = Math.floor((-Math.tanh(zoom / 4) + 1) * 30 + 1);
      geometry = new SphereBufferGeometry(
        6371,
        d,
        d,
        0,
        this.phiLength(zoom),
        this.thetaStart(y, zoom),
        this.thetaLength(y, zoom)
      );
      latMap.set(y, geometry);
    }
    return geometry;
  }

  tile2lat(y: number, z: number) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  tile2long(x: number, z: number) {
    return ((x / Math.pow(2, z)) * 2 - 1) * Math.PI;
  }

  long2tile(lon: number, zoom: number) {
    return Math.floor(((lon + Math.PI) / (Math.PI * 2)) * Math.pow(2, zoom));
  }

  lat2tile(lat: number, zoom: number) {
    return Math.floor(
      ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) *
        Math.pow(2, zoom)
    );
  }
}
