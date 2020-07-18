import * as THREE from "three";
import { TrackballCamera } from "@/GeoVisEngine";
import {
  SphereBufferGeometry,
  Mesh,
  TextureLoader,
  NearestFilter,
  CanvasTexture,
} from "three";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import tileBg from "@/assets/textures/tile_bg.png";
import TWEEN from "@tweenjs/tween.js";
import { forEach } from "lodash";
class TileTreeNode {
  canvas: HTMLCanvasElement = this.service.createCanvas();
  canvasCtx: CanvasRenderingContext2D | null = this.canvas.getContext("2d", {
    alpha: false,
  });
  tilesDrawn = false;
  tilesDrawRequested = false;

  material = new THREE.MeshPhongMaterial({
    shininess: 5,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    map: new CanvasTexture(this.canvas),
  });

  mesh?: Mesh;
  bgMesh?: Mesh;
  tween?: any;
  visible = false;

  public readonly children: TileTreeNode[] = [];

  geometry: SphereBufferGeometry;
  position: GeoPosition;
  positionCenter: GeoPosition;

  get tilesDistance() {
    return this.zoom < 2 ? 2 : this.zoom < 3 ? 3 : 4;
  }

  constructor(
    public readonly service: OsmTilesService,
    public readonly x: number,
    public readonly y: number,
    public readonly zoom: number,
    public readonly parent?: TileTreeNode
  ) {
    const lat = this.service.tile2lat(this.y, this.zoom);
    const latNext = this.service.tile2lat(this.y + 1, this.zoom);
    const long = this.service.tile2long(this.x, this.zoom);
    const longNext = this.service.tile2long(this.x + 1, this.zoom);

    this.geometry = this.service.getGeometry(zoom, y);
    this.position = new GeoPosition(lat, long);
    this.positionCenter = new GeoPosition(
      (lat + latNext) / 2,
      (long + longNext) / 2
    );
  }

  private images: HTMLImageElement[] = [];
  private imageRejects: (() => void)[] = [];
  drawCanvas() {
    this.tilesDrawRequested = true;
    const promises = this.service.layers.map((layerConfig) => {
      return new Promise<any>((resolve, reject) => {
        this.imageRejects.push(reject);
        const img = new Image();
        img.src = layerConfig.tileUrl(this.x, this.y, this.zoom);
        img.crossOrigin = "*";
        img.onload = () => resolve({ img, layerConfig });
      });
    });
    return promises
      .reduce(
        (p1, p2) =>
          p1.then(() =>
            p2.then(({ img, layerConfig }) => {
              if (this.canvasCtx && this.material.map) {
                this.canvasCtx.filter = layerConfig.filter || "none";
                this.canvasCtx.drawImage(img, 0, 0);
                this.canvasCtx.filter = "none";
                this.material.map.needsUpdate = true;
              }
            })
          ),
        Promise.resolve()
      )
      .then(() => (this.tilesDrawn = true))
      .catch(() => undefined);
  }

  cancelAllImages() {
    this.images.forEach((img) => (img.src = ""));
    this.imageRejects.forEach((r) => r());
    this.images = [];
    this.imageRejects = [];
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
    }

    return propagateUpper;
  }

  calcAnimDeep(deep = true) {
    const visible = this.visible;
    const opacity = visible ? 1 : 0;

    const onEnd = () => {
      if (this.mesh) this.mesh.visible = visible;
      //      if (this.bgMesh) this.bgMesh.visible = false;
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
    if (!this.tilesDrawn && !this.tilesDrawRequested) {
      this.drawCanvas().then(() => this.calcAnimDeep(false));
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
      this.bgMesh = new THREE.Mesh(this.geometry, this.service.bgMaterial);
      this.bgMesh.matrixAutoUpdate = false;
      this.bgMesh.rotateY(this.service.phiStart(this.x, this.zoom));
      this.bgMesh.updateMatrix();
      this.bgMesh.renderOrder = this.zoom - 1;
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
    this.cancelAllImages();
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
    if (this.children.length === 0)
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          this.children.push(
            new TileTreeNode(
              this.service,
              this.x * 2 + x,
              this.y * 2 + y,
              this.zoom + 1,
              this
            )
          );
        }
      }
  }
}

export interface TileLayerConfig {
  tileUrl: (x: number, y: number, zoom: number) => string;
  visible: boolean;
  filter?: string;
}

export class OsmTilesService {
  public thetaShift = THREE.MathUtils.degToRad(90 - 85.0511);
  public thetaBound = THREE.MathUtils.degToRad(85.0511);
  public tileSize = 256;

  public bgMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color("white"),
    depthWrite: false,
    shininess: 5,
    map: new TextureLoader().load(tileBg),
  });
  public geometryMap = new Map<number, Map<number, SphereBufferGeometry>>();

  public tileTreeRoot = new TileTreeNode(this, 0, 0, 0);

  constructor(
    public readonly layers: TileLayerConfig[] = [],
    public readonly r: number = 6371
  ) {
    if (this.bgMaterial.map) this.bgMaterial.map.magFilter = NearestFilter;
  }

  createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = this.tileSize;
    canvas.height = this.tileSize;
    return canvas;
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
        this.r,
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
