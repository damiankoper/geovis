import * as THREE from "three";
import { TrackballCamera } from "@/GeoVisEngine";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import { TilesService } from "./TilesService";
import * as PerfMarks from "perf-marks";
export class TileTreeNode {
  canvas: HTMLCanvasElement = this.service.createCanvas();
  canvasCtx = this.canvas.getContext("bitmaprenderer");
  tileDrawRequested = false;

  material = new THREE.MeshPhongMaterial({
    shininess: 5,
    map: new THREE.CanvasTexture(this.canvas),
  });

  mesh: THREE.Mesh | null = null;

  public readonly children: TileTreeNode[] = [];

  geometry: THREE.SphereBufferGeometry;
  position: GeoPosition;
  positionCenter: GeoPosition;

  getTilesDistance(desiredZoom: number) {
    if (this.zoom > desiredZoom - 3) return 4;

    if (this.zoom === 1) return 2;
    if (this.zoom === 2) return 3;
    if (this.zoom === 4) return 4;

    return 2;
  }

  constructor(
    public readonly service: TilesService,
    public readonly x: number,
    public readonly y: number,
    public readonly zoom: number,
    public readonly parent?: TileTreeNode,
    public readonly key = `${x}${y}${zoom}`
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

    this.service.canvasDrawnHandlerMap.set(
      this.key,
      this.onCanvasDraw.bind(this)
    );
    Object.seal(this);
  }

  private onCanvasDraw(message: MessageEvent) {
    this.canvasCtx?.transferFromImageBitmap(message.data.image);
    if (this.material.map) this.material.map.needsUpdate = true;
  }

  calcDeep(
    camera: TrackballCamera,
    group: THREE.Group,
    desiredZoom: number
  ): boolean {
    let propagateUpper = false;
    const visibleByTileDistance = this.isVisibleByTileDistance(
      camera,
      this.getTilesDistance(desiredZoom)
    );
    this.hideTile();
    if (this.zoom < desiredZoom) {
      if (visibleByTileDistance) {
        this.generateChildren();
      }
    }

    if (this.zoom === desiredZoom) {
      if (visibleByTileDistance) {
        this.showTile(camera, group);
        propagateUpper = true;
      }
    } else {
      this.children
        .map((c) => c.calcDeep(camera, group, desiredZoom))
        .forEach((showDeeper, i) => {
          if (!showDeeper) this.children[i].showTile(camera, group);
          else propagateUpper = true;
        });
    }

    if (!this.parent) {
      this.destroyDangling(camera, group, desiredZoom);
    }

    return propagateUpper;
  }

  refreshDeep(camera: TrackballCamera, group: THREE.Group) {
    this.tileDrawRequested = false;
    if (this.mesh?.visible) this.showTile(camera, group);
    this.children.forEach((c) => c.refreshDeep(camera, group));
  }

  showTile(camera: TrackballCamera, group: THREE.Group) {
    if (this.isVisibleByAngle(camera, (Math.PI / 2) * 0.8)) {
      if (!this.tileDrawRequested) {
        this.tileDrawRequested = true;
        this.service.requestCanvasDraw(this, this.tileDistance(camera));
      }

      if (!this.mesh) {
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.matrixAutoUpdate = false;
        this.mesh.matrix = new THREE.Matrix4().makeRotationY(
          this.service.phiStart(this.x, this.zoom)
        );
        this.mesh.renderOrder = this.zoom;
        group.add(this.mesh);
      }
    }
    if (this.mesh) this.mesh.visible = true;
    this.hideSubtree();
  }

  hideTile() {
    if (this.mesh) this.mesh.visible = false;
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
      !this.isVisibleByTileDistance(
        camera,
        this.getTilesDistance(desiredZoom) + 2
      ) ||
      this.zoom > desiredZoom
    ) {
      this.children.forEach((c) => c.destroy(group));
      this.children.splice(0, this.children.length);
    }
  }

  destroy(group: THREE.Group) {
    if (this.mesh) group.remove(this.mesh);
    this.service.tilePainter.postMessage({
      name: "abortTile",
      tileKey: this.key,
    });
    this.geometry.dispose();
    this.material.map?.dispose();
    this.material.dispose();
    this.service.canvasDrawnHandlerMap.delete(this.key);
  }

  isVisibleByTileDistance(camera: TrackballCamera, manhattanDistance: number) {
    return this.tileDistance(camera) <= manhattanDistance;
  }

  tileDistance(camera: TrackballCamera) {
    const pos = camera.getGlobalOrbitPosition();
    const tileX = this.service.long2tile(pos.long, this.zoom);
    const tileY = this.service.lat2tile(pos.lat, this.zoom);
    const tiles = 2 ** this.zoom;

    let x = Math.abs(tileX - this.x);
    let y = Math.abs(tileY - this.y);

    if (x > tiles / 2) x = tiles - x;
    if (y > tiles / 2) y = tiles - y;

    return new THREE.Vector2(x, y).manhattanLength();
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
    return B >= angle;
  }

  generateChildren() {
    if (this.children.length === 0)
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          const tile = new TileTreeNode(
            this.service,
            this.x * 2 + x,
            this.y * 2 + y,
            this.zoom + 1,
            this
          );
          this.children.push(tile);
        }
      }
  }
}
