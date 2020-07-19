export interface TileLayerConfig {
  tileUrl: string | ((x: number, y: number, zoom: number) => string);
  visible: boolean;
  filter?: string;
}
