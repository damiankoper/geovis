import * as THREE from "three";
import { SphereBufferGeometry, TextureLoader, NearestFilter } from "three";
import { TileTreeNode } from "./TileTreeNode";
import { TileLayerConfig } from "./TileLayerConfig";
import TilePainterWorker from "worker-loader!./TilePainter.worker";
import { PaintTileLayersMessageData } from "./TilePainter.worker";
import _ from "lodash";
import bgTile from "@/assets/textures/tile_bg.png";
export class TilesService {
  public thetaShift = THREE.MathUtils.degToRad(90 - 85.0511);
  public thetaBound = THREE.MathUtils.degToRad(85.0511);
  public geometryMap = new Map<number, Map<number, SphereBufferGeometry>>();
  public bgTile = new THREE.ImageLoader().load(bgTile);
  public tileSize = 256;

  public tilePainter = new TilePainterWorker();
  public canvasDrawnHandlerMap = new Map<
    string,
    (message: MessageEvent) => void
  >();

  public tileTreeRoot = new TileTreeNode(this, 0, 0, 0);

  constructor(
    public readonly layers: TileLayerConfig[] = [],
    public readonly r: number = 6371
  ) {
    this.tilePainter.onmessage = (message) => {
      const handler = this.canvasDrawnHandlerMap.get(message.data.tileKey);
      if (handler) {
        handler(message);
      }
    };
  }

  createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = this.tileSize;
    canvas.height = this.tileSize;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(this.bgTile, 0, 0);
    return canvas;
  }

  requestCanvasDraw(tile: TileTreeNode, tileDistance: number) {
    const data: PaintTileLayersMessageData = {
      layers: this.layers.map((layer) => {
        const l = _.cloneDeep(layer);
        if (typeof l.tileUrl === "function")
          l.tileUrl = l.tileUrl(tile.x, tile.y, tile.zoom);
        return l;
      }),
      name: "paintTileLayers",
      tileKey: tile.key,
      priority: tile.zoom - tileDistance,
    };

    this.tilePainter.postMessage(data);
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
