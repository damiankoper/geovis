import Visualization from "@/core/domain/Visualization/models/Visualization";
import * as THREE from "three";
import TrackballCamera from "@/core/domain/Camera/interfaces/TrackballCamera";
import Range from "@/core/domain/GeoPosition/models/Range";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import StarsVis from "@/core/domain/Visualization/examples/StarsVis/StarsVis";
import OsmTilesVisControls from "./OsmTilesVisControls.vue";
import { TrackballMode } from "@/core/domain/Camera/enums/TrackballMode";
import { OsmTilesService } from "./OsmTilesService";
import * as PerfMarks from "perf-marks";
import _ from "lodash";
/**
 * @category VisualizationExamples
 */
export default class OsmTilesVis extends Visualization {
  camera: TrackballCamera | null = null;
  group: THREE.Group | null = null;
  sphereGroup = new THREE.Group();
  osmTilesService: OsmTilesService;
  constructor() {
    super();
    this.addParent(new StarsVis());
    this.osmTilesService = new OsmTilesService();
    Object.seal(this);
  }

  setupCamera(camera: TrackballCamera): void {
    this.camera = camera;
    camera
      .setMode(TrackballMode.Compass)
      .setZoomBounds(new Range(0.5, 20000))
      .setGlobalOrbitBounds(
        new Range(GeoPosition.fromDeg(-85, -180), GeoPosition.fromDeg(85, 180))
      );
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    this.group = group;
    this.group.add(this.sphereGroup);

    if (this.camera) {
      this.sphereGroup.rotateY(-Math.PI / 2);
      this.camera.onGlobalOrbitChange.sub(
        _.throttle(this.calcTiles.bind(this), 500)
      );
      this.camera.onZoomChange.sub(_.debounce(this.calcTiles.bind(this), 300));
      this.calcTiles(this.camera);
    }
    console.log(this.osmTilesService.tileTreeRoot);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    scene.add(directionalLight);
    directionalLight.position.set(0, 0, 1);
  }

  private calcTiles(camera: TrackballCamera) {
    console.log("Tiles recalculated");
    const R = camera.getLocalOrbitRadius();
    OsmTilesService.visibleTiles = 0;
    const desiredZoom =
      Math.max(Math.floor(-Math.log2(R) + Math.log2(10000)), 0) + 3;
    PerfMarks.start("TilesCalc");
    this.osmTilesService.tileTreeRoot.calcDeep(
      camera,
      this.sphereGroup,
      desiredZoom
    );
    PerfMarks.end("TilesCalc");
    console.log("VisibleTiles", OsmTilesService.visibleTiles);
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
