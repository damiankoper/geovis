import Visualization from "@/core/domain/Visualization/models/Visualization";
import * as THREE from "three";
import TrackballCamera from "@/core/domain/Camera/interfaces/TrackballCamera";
import Range from "@/core/domain/GeoPosition/models/Range";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import StarsVis from "@/core/domain/Visualization/examples/StarsVis/StarsVis";
import OsmTilesVisControls from "./OsmTilesVisControls.vue";
import { TrackballMode } from "@/core/domain/Camera/enums/TrackballMode";
import { TilesService } from "./TilesService";
import * as PerfMarks from "perf-marks";
import _ from "lodash";
import AtmosphereVis from "../AtmosphereVis/AtmosphereVis";
/**
 * @category VisualizationExamples
 */
export default class OsmTilesVis extends Visualization {
  camera: TrackballCamera | null = null;
  group: THREE.Group | null = null;
  sphereGroup = new THREE.Group();
  osmTilesService: TilesService;
  maxZoom = 2000;
  constructor() {
    super();
    this.addParent(new StarsVis());
    this.addParent(new AtmosphereVis(1000, 80));
    this.osmTilesService = new TilesService(
      [
        {
          tileUrl: (x, y, z) =>
            `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
          visible: true,
          filter: "brightness(100%)",
        },
        /* {
          tileUrl: (x, y, z) =>
            `https://tilecache.rainviewer.com/v2/coverage/0/256/${z}/${x}/${y}.png`,
          visible: true,
          filter: "opacity(10%)",
        },
        {
          tileUrl: (x, y, z) =>
            `https://tilecache.rainviewer.com/v2/radar/1595672400/256/${z}/${x}/${y}/4/1_1.png`,
            //`https://weather.openportguide.de/tiles/actual/wind_stream/0h/${z}/${x}/${y}.png`,
          visible: true,
          filter: "opacity(60%)",
        }, */
      ],
      1000
    );
    Object.seal(this);
  }

  setupCamera(camera: TrackballCamera): void {
    this.camera = camera;
    camera
      .setMode(TrackballMode.Compass)
      .setGlobalOrbitRadius(1000)
      .setZoomBounds(new Range(0.1, this.maxZoom))
      .setGlobalOrbitBounds(
        new Range(GeoPosition.fromDeg(-85, -180), GeoPosition.fromDeg(85, 180))
      )
      .setLocalOrbitRadius(this.maxZoom)
      .setGlobalOrbitSlowFactor(1);
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    this.group = group;
    this.group.renderOrder = 50;
    this.group.add(this.sphereGroup);

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

  private calcTiles(camera: TrackballCamera) {
    const R = camera.getLocalOrbitRadius();
    const desiredZoom =
      Math.max(Math.floor(-Math.log2(R) + Math.log2(this.maxZoom)), 0) + 3;

    PerfMarks.start("TilesCalc");
    this.osmTilesService.tileTreeRoot.calcDeep(
      camera,
      this.sphereGroup,
      desiredZoom
    );
    PerfMarks.end("TilesCalc");
  }

  update(deltaFactor: number): void {
    //
  }

  destroy(): void {
    console.info("destroy");
  }

  getControls() {
    return OsmTilesVisControls;
  }
}
