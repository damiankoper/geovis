import _ from "lodash";
import * as THREE from "three";
import moment, { Moment } from "moment";
import Range from "../../../../../core/domain/Utils/Range";
import EarthVis from "../../../../../core/domain/Visualization/examples/EarthVis/EarthVis";
import Visualization from "../../../../../core/domain/Visualization/models/Visualization";
import { TrackballCamera } from "../../../../../GeoVisEngine";
import { TrackballMode } from "../../../../../core/domain/Camera/enums/TrackballMode";
import ActiveSatellitesVisControls from "./ActiveSatellitesVisControls.vue";

import VisualizationMeta from "../../../../../core/domain/Visualization/models/VisualizationMeta";
import SatelliteObject from "../../../../../core/domain/Visualization/examples/EarthCommon/SatelliteObject";
import TLEService from "../../../../../core/domain/Visualization/examples/EarthCommon/TLEService";

import thumbnail from "!!base64-image-loader!./assets/thumbnail.jpg";

/**
 * @category VisualizationExamples
 */
export default class ActiveSatellitesVis extends Visualization {
  readonly r = 6371;
  public camera: TrackballCamera | null = null;
  public group: THREE.Group | null = null;

  private pointsMaterial = new THREE.PointsMaterial({
    transparent: true,
    color: 0xffffff,
    size: 5,
    sizeAttenuation: false,
  });
  private sateliteObjects: SatelliteObject[] = [];
  private points = new THREE.Points(
    new THREE.BufferGeometry(),
    this.pointsMaterial
  );

  private tleService = new TLEService();

  public speed = 1;
  public timestamp = moment.utc();
  public prevTimestamp: Moment | null = null;

  private earthVis: EarthVis;
  constructor() {
    super();
    this.addParent((this.earthVis = new EarthVis()));
    this.earthVis.timestamp = this.timestamp;
    Object.seal(this);
  }

  public setupCamera(camera: TrackballCamera) {
    this.camera = camera;
    this.camera
      .setZoomBounds(new Range(200, 30000))
      .setMode(TrackballMode.Free);
  }

  public async setupScene(scene: THREE.Scene, group: THREE.Group) {
    this.group = group;
    const tleData = _.shuffle(await this.tleService.update());

    for (const data in tleData) {
      const object = new SatelliteObject(
        tleData[data],
        this.r,
        undefined,
        undefined,
        false,
        false,
        false,
        false
      );
      this.sateliteObjects.push(object);
    }

    group.add(this.points);
  }

  public update(deltaFrac: number) {
    this.timestamp.add((1000 / 60) * deltaFrac * this.speed, "ms");
    if (
      !this.prevTimestamp ||
      this.timestamp.diff(this.prevTimestamp, "ms") > 100 ||
      this.prevTimestamp.isAfter(this.timestamp)
    ) {
      const points: number[] = [];
      this.sateliteObjects.forEach((o) => {
        const p = o.getPosition(this.timestamp);
        points.push(p.x, p.y, p.z);
      });
      this.points.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(points), 3)
      );
      this.prevTimestamp = this.timestamp.clone();
    }
  }

  public setTimestamp(m: Moment) {
    this.timestamp = m;
    this.earthVis.timestamp = m;
  }

  public destroy() {
    this.pointsMaterial.dispose();
    this.points.geometry.dispose();
  }

  public getControls() {
    return ActiveSatellitesVisControls;
  }

  public setupOwnMeta(meta: VisualizationMeta) {
    meta.setTitle("Active satellites");
    meta.setAuthor("Damian Koper");
    meta.setDescription(
      `Shows position relative to earth of all active satelices from celestrak.com.
Position is calculated using TLE records.`
    );
    meta.addKeywords(["satellites", "celestrack", "active"]);
    meta.setThumbnail(thumbnail);
  }
}
