import { TileLayerConfig } from "./TileLayerConfig";
import * as THREE from "three";
interface TileKey {
  tileKey: string;
}

export interface PaintTileLayersMessageData extends TileKey {
  name: "paintTileLayers";
  layers: TileLayerConfig[];
}

class TilePainter {
  // eslint-disable-next-line
  ctx: Worker = self as any;
  offscreen = new OffscreenCanvas(256, 256);
  loader = new THREE.FileLoader();
  tileCache = new Map<string, Blob>();

  constructor() {
    this.ctx.onmessage = this.onMessage.bind(this);
    this.loader.setResponseType("blob");
  }

  async onMessage(event: MessageEvent) {
    switch (event.data.name) {
      case "paintTileLayers": {
        const data = event.data as PaintTileLayersMessageData;
        await this.paintTileLayers(data);
        break;
      }
      default:
        console.warn("Unknown message name");
    }
  }

  async paintTileLayers(data: PaintTileLayersMessageData) {
    const cacheBlob = this.tileCache.get(data.tileKey);
    if (cacheBlob) {
      const image = await createImageBitmap(cacheBlob);
      this.ctx.postMessage({ tileKey: data.tileKey, image }, [image]);
    } else {
      const images = [];
      for (const layer in data.layers) {
        const url = data.layers[layer].tileUrl as string;
        images.push(await this.createBitmap(url));
      }

      const ctx = this.offscreen.getContext("2d", { alpha: false });
      if (ctx)
        for (let i = 0; i < data.layers.length; i++) {
          ctx.filter = data.layers[i].filter || "none";
          ctx.drawImage(images[i], 0, 0);
        }

      this.offscreen
        .convertToBlob()
        .then((blob) => this.tileCache.set(data.tileKey, blob));
      const image = this.offscreen.transferToImageBitmap();
      this.ctx.postMessage({ tileKey: data.tileKey, image }, [image]);
    }
  }

  async createBitmap(url: string) {
    const imgData = await fetch(url).then((r) => r.blob());
    return createImageBitmap(imgData);
  }
}

new TilePainter();
