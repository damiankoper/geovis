import * as THREE from "three";
import _ from "lodash";
import Visualization from "../../../../../core/domain/Visualization/models/Visualization";
import VisualizationMeta from "../../../../../core/domain/Visualization/models/VisualizationMeta";
import TrackballCamera from "../../../../../core/domain/Camera/interfaces/TrackballCamera";
import { TrackballMode } from "../../../../../core/domain/Camera/enums/TrackballMode";
import Range from "../../../../../core/domain/Utils/Range";
import GeoPosition from "../../../../../core/domain/GeoPosition/models/GeoPosition";

import OsmTilesVisControls from "./OsmTilesVisControls.vue";
import { TilesService } from "./TilesService";

import StarsVis from "../../../../../core/domain/Visualization/examples/StarsVis/StarsVis";
import AtmosphereVis from "../../../../../core/domain/Visualization/examples/AtmosphereVis/AtmosphereVis";

import thumbnail from "!!base64-image-loader!./assets/thumbnail.jpg";

/**
 * @category VisualizationExamples
 */
export default class OsmTilesVis extends Visualization {
  public camera: TrackballCamera | null = null;
  public group: THREE.Group | null = null;
  public sphereGroup = new THREE.Group();
  public osmTilesService: TilesService;
  public maxZoom = 200;

  public timestamps: number[] = [];
  public timestampIndex = 0;

  constructor() {
    super("tilesVis");
    this.addParent(new StarsVis());
    this.addParent(new AtmosphereVis(100, 8));

    this.osmTilesService = new TilesService(
      [
        {
          tileUrl: (x, y, z) =>
            `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
          visible: true,
          filter: "brightness(60%)",
        },
        {
          tileUrl: (x, y, z) =>
            `https://tilecache.rainviewer.com/v2/coverage/0/256/${z}/${x}/${y}.png`,
          visible: true,
          filter: "opacity(10%)",
        },
        {
          tileUrl: (x, y, z) =>
            `https://tilecache.rainviewer.com/v2/radar/${
              this.timestamps[this.timestampIndex]
            }/256/${z}/${x}/${y}/4/1_1.png`,
          visible: true,
          filter: "opacity(60%)",
        },
      ],
      100
    );
    Object.seal(this);
  }

  public setupCamera(camera: TrackballCamera): void {
    this.camera = camera;
    camera
      .setMode(TrackballMode.Compass)
      .setGlobalOrbitRadius(100)
      .setZoomBounds(new Range(0.1, this.maxZoom))
      .setGlobalOrbitBounds(
        new Range(GeoPosition.fromDeg(-85, -180), GeoPosition.fromDeg(85, 180))
      )
      .setLocalOrbitBounds(
        new Range<GeoPosition>(
          GeoPosition.fromDeg(5, -180),
          GeoPosition.fromDeg(89, 180)
        )
      )
      .setLocalOrbitRadius(this.maxZoom)
      .setGlobalOrbitSlowFactor(1);
  }

  public async setupScene(
    scene: THREE.Scene,
    group: THREE.Group
  ): Promise<void> {
    this.group = group;
    this.group.renderOrder = 50;
    this.group.add(this.sphereGroup);
    await this.updateTimestamps();

    if (this.camera) {
      this.sphereGroup.rotateY(-Math.PI / 2);
      this.camera.onGlobalOrbitChange.sub(
        _.throttle(this.calcTiles.bind(this), 300)
      );
      this.camera.onZoomChange.sub(_.debounce(this.calcTiles.bind(this), 150));
      this.calcTiles(this.camera);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    scene.add(directionalLight);
    directionalLight.position.set(0, 0, 10000);
  }

  public async updateTimestamps() {
    const data = await (
      await fetch("https://api.rainviewer.com/public/maps.json")
    ).json();
    if (!this.timestamps.length) this.timestampIndex = data.length - 1;
    this.timestamps = data;
  }

  private calcTiles(camera: TrackballCamera) {
    const R = camera.getLocalOrbitRadius();
    const desiredZoom =
      Math.max(Math.floor(-Math.log2(R) + Math.log2(this.maxZoom)), 0) + 3;

    this.osmTilesService.tileTreeRoot.calcDeep(
      camera,
      this.sphereGroup,
      desiredZoom
    );
  }

  public refreshDeep() {
    if (this.camera && this.group)
      this.osmTilesService.tileTreeRoot.refreshDeep(this.camera, this.group);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(deltaFactor: number): void {
    //
  }

  destroy(): void {
    //
  }

  getControls() {
    return OsmTilesVisControls;
  }

  setupOwnMeta(meta: VisualizationMeta) {
    meta.setTitle("OpenStreetMap and Weather Tiles");
    meta.setAuthor("Damian Koper");
    meta.setDescription(
      `Displays tiles map with adjustable layers - radar coverage and rain radar. Uses RainviewerAPI & OSM Standard Tile Layer.`
    );
    meta.addKeywords(["tiles", "weather"]);
    meta.setThumbnail(thumbnail);
  }
}
