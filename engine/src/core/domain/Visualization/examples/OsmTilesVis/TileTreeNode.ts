import * as THREE from "three";
import { TrackballCamera } from "@/GeoVisEngine";
import { SphereBufferGeometry, Mesh, CanvasTexture } from "three";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import * as PerfMarks from "perf-marks";
import { TilesService } from "./TilesService";
export class TileTreeNode {
  canvas: HTMLCanvasElement = this.service.createCanvas();
  canvasCtx: CanvasRenderingContext2D | null = this.canvas.getContext("2d", {
    alpha: false,
  });
  tilesDrawn = false;
  tilesDrawRequested = false;

  material = new THREE.MeshPhongMaterial({
    shininess: 5,
    depthWrite: false,
    map: new CanvasTexture(this.canvas),
  });

  mesh?: Mesh;

  public readonly children: TileTreeNode[] = [];

  geometry: SphereBufferGeometry;
  position: GeoPosition;
  positionCenter: GeoPosition;

  get tilesDistance() {
    return this.zoom < 2 ? 2 : this.zoom < 3 ? 3 : 4;
  }

  constructor(
    public readonly service: TilesService,
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

  drawCanvas() {
    PerfMarks.start("DrawCanvas");
    this.tilesDrawRequested = true;
    const promises = this.service.layers.map((layerConfig) => {
      return new Promise<any>((resolve, reject) => {
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
      .then(() => {
        this.tilesDrawn = true;
        PerfMarks.end("DrawCanvas");
      })
      .catch(() => undefined);
  }

  calcDeep(
    camera: TrackballCamera,
    group: THREE.Group,
    desiredZoom: number
  ): boolean {
    TileTreeNode.tiles++;
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
      this.destroyDangling(camera, group, desiredZoom);
    }

    return propagateUpper;
  }

  showTile(group: THREE.Group) {
    if (!this.tilesDrawn && !this.tilesDrawRequested) {
      this.drawCanvas();
    }

    if (!this.mesh) {
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.matrixAutoUpdate = false;
      this.mesh.rotateY(this.service.phiStart(this.x, this.zoom));
      this.mesh.updateMatrix();
      this.mesh.renderOrder = this.zoom;
      group.add(this.mesh);
    }
    this.mesh.visible = true;
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
      !this.isVisibleByTileDistance(camera, this.tilesDistance + 2) ||
      this.zoom > desiredZoom
    ) {
      this.children.forEach((c) => c.destroy(group));
      this.children.splice(0, this.children.length);
    }
  }

  destroy(group: THREE.Group) {
    if (this.mesh) group.remove(this.mesh);
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

          if (tile.canvasCtx) {
            const tileSize = this.service.tileSize;
            const tileSizeDv = tileSize / 2;
            tile.canvasCtx.drawImage(
              this.canvas,
              tileSizeDv * x,
              tileSizeDv * y,
              tileSizeDv,
              tileSizeDv,
              0,
              0,
              tileSize,
              tileSize
            );
          }
          this.children.push(tile);
        }
      }
  }
}
