<template>
  <v-container fluid>
    <v-row align="end" class="mx-0">
      <v-col cols="auto" class="pr-0">
        <v-btn
          @click="visControlPanel = true"
          fab
          x-small
          v-if="!visControlPanel"
          class="clickable"
          cy-data="open-control-panel"
        >
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <v-sheet
          color="rgba(255,255,255,0.7)"
          rounded
          :elevation="4"
          v-if="visControlPanel"
          class="clickable"
        >
          <v-toolbar color="transparent" elevation="0">
            <v-btn
              @click="visControlPanel = false"
              icon
              cy-data="close-control-panel"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title cy-data="title">
              {{ visTitle }}
            </v-toolbar-title>
          </v-toolbar>

          <v-tabs background-color="transparent" v-model="tab" vertical>
            <v-tab cy-data="tab-info">
              Info
            </v-tab>
            <v-tab v-if="hasVisControls" cy-data="tab-controls">
              Controls
            </v-tab>
            <v-tabs-items
              :value="tab"
              vertical=""
              style="background: transparent;"
            >
              <v-tab-item> <slot name="info" /> </v-tab-item>
              <v-tab-item v-if="hasVisControls"> <slot /> </v-tab-item>
            </v-tabs-items>
          </v-tabs>
        </v-sheet>
      </v-col>
      <v-spacer />
      <v-col cols="auto" class="pr-0">
        <v-sheet
          color="rgba(255,255,255,0.7)"
          rounded
          :elevation="4"
          class="px-2 py-1 d-flex flex-column align-center caption"
          cy-data="position"
        >
          {{ latFormatted }} | {{ longFormatted }}
        </v-sheet>
      </v-col>
      <v-col cols="auto">
        <v-sheet
          color="rgba(255,255,255,0.7)"
          rounded
          :elevation="4"
          class="pa-2 d-flex flex-column align-center clickable"
        >
          <compass
            :angle="northAngle"
            @click="rotateNorth"
            title="Rotate towards north"
          />
          <v-btn fab x-small class="mb-2" @click="zoomIn" title="Zoom in">
            <v-icon dark>mdi-plus</v-icon>
          </v-btn>
          <v-btn fab x-small @click="zoomOut" title="Zoom out">
            <v-icon dark>mdi-minus</v-icon>
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import _ from "lodash";
import TrackballCamera from "../core/domain/Camera/interfaces/TrackballCamera";
import Compass from "./Compass.vue";
import GeoPosition from "../core/domain/GeoPosition/models/GeoPosition";
@Component({ components: { Compass } })
export default class CoreControls extends Vue {
  @Prop() camera!: TrackballCamera;
  @Prop({ default: false }) hasVisControls!: boolean;
  @Prop({ default: "Visualization controls" }) visTitle!: string;

  readonly refreshInterval = 1000 / 7;

  visControlPanel = false;
  tab = 0;

  globalOrbitChange?: () => void;
  northAngleEvent?: () => void;
  northAngle = 0;

  globalOrbitPosition: GeoPosition = new GeoPosition();

  /**
   * Setup event handlers
   */
  beforeMount() {
    this.northAngleEvent = this.camera.onNorthAngleChange.sub(
      _.throttle((e, angle) => {
        this.northAngle = angle;
      }, this.refreshInterval)
    );
    this.globalOrbitChange = this.camera.onGlobalOrbitChange.sub(
      _.throttle((e, orbit) => {
        this.globalOrbitPosition = orbit.getGeoPosition();
      }, this.refreshInterval)
    );
  }

  /**
   * Destroy event handlers
   */
  destroyed() {
    if (this.northAngleEvent) this.northAngleEvent();
    if (this.globalOrbitChange) this.globalOrbitChange();
  }

  get latFormatted() {
    if (this.globalOrbitPosition) {
      return this.formatDMS(this.globalOrbitPosition.latDMS);
    }
    return "";
  }

  get longFormatted() {
    if (this.globalOrbitPosition) {
      return this.formatDMS(this.globalOrbitPosition.longDMS);
    }
    return "";
  }

  private formatDMS(l: { dir: string; d: number; m: number; s: number }) {
    return `${String(l.d)}\u00B0 ${String(l.m).padStart(2, "0")}" ${String(
      l.s
    ).padStart(2, "0")}' ${l.dir}`;
  }
  private rotateNorth() {
    this.camera.rotateNorth();
  }
  private zoomIn() {
    this.camera.zoomIn(1);
  }
  private zoomOut() {
    this.camera.zoomOut(1);
  }
}
</script>

<style scoped lang="scss">
.clickable {
  pointer-events: all;
}
</style>
