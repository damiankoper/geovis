import _, { times } from "lodash";
import * as THREE from "three";
import { TrackballCamera } from "@/GeoVisEngine";
import Visualization from "../../models/Visualization";
import EarthVis from "../EarthVis/EarthVis";
import Range from "@/core/domain/GeoPosition/models/Range";
import moment, { Moment } from "moment";
import ActiveSatellitesVisControls from "./ActiveSatellitesVisControls.vue";

import { TrackballMode } from "@/core/domain/Camera/enums/TrackballMode";
import VisualizationMeta from "../../models/VisualizationMeta";
import SatelliteObject from "../IssVis/SatelliteObject";
import TLEService from "../IssVis/TLEService";
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

  setupCamera(camera: TrackballCamera) {
    this.camera = camera;
    this.camera
      .setZoomBounds(new Range(200, 30000))
      .setMode(TrackballMode.Free);
  }

  async setupScene(scene: THREE.Scene, group: THREE.Group) {
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

  update(deltaFrac: number) {
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

  setTimestamp(m: Moment) {
    this.timestamp = m;
    this.earthVis.timestamp = m;
  }

  destroy() {
    this.pointsMaterial.dispose();
    this.points.geometry.dispose();
  }

  getControls() {
    return ActiveSatellitesVisControls;
  }

  setupMeta(meta: VisualizationMeta) {
    meta.setTitle("Active satellites");
    meta.setAuthor("Damian Koper");
    meta.setDescription(
      `Shows position relative to earth of all active satelices from celestrak.com.
Position is calculated using TLE records.`
    );
    meta.setKeywords(["satellites", "celestrack", "active"]);
  }
}
