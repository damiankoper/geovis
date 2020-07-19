export interface TileLayerConfig {
  tileUrl: (x: number, y: number, zoom: number) => string;
  visible: boolean;
  filter?: string;
}
