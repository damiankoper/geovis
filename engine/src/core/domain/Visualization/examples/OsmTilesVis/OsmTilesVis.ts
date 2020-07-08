import Visualization from "@/core/domain/Visualization/models/Visualization";
import * as THREE from "three";
import TrackballCamera from "@/core/domain/Camera/interfaces/TrackballCamera";
import Range from "@/core/domain/GeoPosition/models/Range";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import StarsVis from "@/core/domain/Visualization/examples/StarsVis/StarsVis";
import OsmTilesVisControls from "./OsmTilesVisControls.vue";
import { TrackballMode } from "@/core/domain/Camera/enums/TrackballMode";
import { OsmTilesService } from "./OsmTilesService";
import { Quaternion, Mesh, Vector3 } from "three";
import _ from "lodash";
import SphereVis from "../SphereVis/SphereVis";
import GeoPosMapper from "@/core/domain/GeoPosition/services/GeoPosMapper";
/**
 * @category VisualizationExamples
 */
export default class OsmTilesVis extends Visualization {
  camera?: TrackballCamera;
  group?: THREE.Group;
  sphereGroup = new THREE.Group();
  osmTilesService: OsmTilesService;
  constructor() {
    super();
    this.addParent(new StarsVis());
    this.osmTilesService = new OsmTilesService();
  }

  setupCamera(camera: TrackballCamera): void {
    this.camera = camera;
    camera
      .setMode(TrackballMode.Compass)
      .setZoomBounds(new Range(0.001, 20000))
      .setGlobalOrbitBounds(
        new Range(GeoPosition.fromDeg(-85, -180), GeoPosition.fromDeg(85, 180))
      );
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    this.group = group;
    this.group.add(this.sphereGroup);

    if (this.camera) {
      this.sphereGroup.rotateY(-Math.PI / 2);
      this.camera.onGlobalOrbitChange.sub(this.calcTiles.bind(this));
      this.camera.onZoomChange.sub(this.calcTiles.bind(this));
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
    this.osmTilesService.tileTreeRoot.calcDeep(camera, this.sphereGroup);
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
