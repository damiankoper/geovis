import PQueue from "p-queue";
import * as THREE from "three";
import { TileLayerConfig } from "./TileLayerConfig";

/**
 * @category VisualizationHelper
 */
interface TileKey {
  tileKey: string;
}

/**
 * @category VisualizationHelper
 */
export interface PaintTileLayersMessageData extends TileKey {
  name: "paintTileLayers";
  layers: TileLayerConfig[];
  priority: number;
}

/**
 * @category VisualizationHelper
 */
export interface AbortTileMessageData extends TileKey {
  name: "abortTile";
}

/**
 * @category VisualizationHelper
 */
class TilePainter {
  // eslint-disable-next-line
  ctx: Worker = self as any;
  offscreen = new OffscreenCanvas(256, 256);
  loader = new THREE.FileLoader();
  tileCache = new Map<string, Blob>();
  abortControllers = new Map<string, AbortController>();

  queue = new PQueue({ concurrency: navigator.hardwareConcurrency * 2 });

  constructor() {
    this.ctx.onmessage = this.onMessage.bind(this);
    this.loader.setResponseType("blob");
  }

  async onMessage(event: MessageEvent) {
    switch (event.data.name) {
      case "paintTileLayers": {
        const data = event.data as PaintTileLayersMessageData;
        this.queue.add(() => this.paintTileLayers(data), {
          priority: data.priority,
        });
        break;
      }
      case "abortTile": {
        const data = event.data as AbortTileMessageData;
        this.abortControllers.get(data.tileKey)?.abort();
        break;
      }
      default:
        console.warn("Unknown message name");
    }
  }

  async paintTileLayers(data: PaintTileLayersMessageData) {
    const visibleLayers = data.layers.filter((layer) => layer.visible);
    const cacheKey = visibleLayers.reduce((r, layer) => r + layer.tileUrl, "");
    const cacheBlob = this.tileCache.get(cacheKey);
    if (cacheBlob) {
      const image = await createImageBitmap(cacheBlob);
      this.ctx.postMessage({ tileKey: data.tileKey, image }, [image]);
    } else {
      try {
        const abortController =
          this.abortControllers.get(cacheKey) || new AbortController();
        this.abortControllers.set(cacheKey, abortController);
        const images = await Promise.all(
          visibleLayers.map((layer) => {
            const url = layer.tileUrl as string;
            return this.createBitmap(url, abortController.signal);
          })
        );

        const ctx = this.offscreen.getContext("2d", { alpha: false });
        if (ctx)
          for (let i = 0; i < visibleLayers.length; i++) {
            ctx.filter = visibleLayers[i].filter || "none";
            ctx.drawImage(images[i], 0, 0);
          }

        this.offscreen
          .convertToBlob()
          .then((blob) => this.tileCache.set(cacheKey, blob));
        const image = this.offscreen.transferToImageBitmap();
        this.ctx.postMessage({ tileKey: data.tileKey, image }, [image]);
      } catch (e) {
        ///
      }
    }
  }

  async createBitmap(url: string, signal: AbortSignal) {
    const imgData = await fetch(url, { signal }).then((r) => r.blob());
    return createImageBitmap(imgData);
  }
}

new TilePainter();
