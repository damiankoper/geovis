<template>
  <v-container fluid>
    <v-row align="end" class="mx-0">
      <v-col v-if="hasVisControls" cols="auto" class="pr-0">
        <v-btn @click="visControls = true" fab x-small v-if="!visControls">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <v-sheet
          color="rgba(255,255,255,0.7)"
          rounded
          :elevation="4"
          v-if="visControls"
        >
          <v-toolbar color="transparent" elevation="0">
            <v-btn @click="visControls = false" icon>
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title>
              {{ visTitle }}
            </v-toolbar-title>
          </v-toolbar>
          <slot />
        </v-sheet>
      </v-col>
      <v-spacer />
      <v-col cols="auto" class="pr-0">
        <v-sheet
          color="rgba(255,255,255,0.7)"
          rounded
          :elevation="4"
          class="px-2 py-1 d-flex flex-column align-center caption"
        >
          {{ latFormatted }} |
          {{ longFormatted }}
        </v-sheet>
      </v-col>
      <v-col cols="auto">
        <v-sheet
          color="rgba(255,255,255,0.7)"
          rounded
          :elevation="4"
          class="pa-2 d-flex flex-column align-center"
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
import TrackballCamera from "../core/domain/Camera/interfaces/TrackballCamera";
import Compass from "./Compass.vue";
import _ from "lodash";
import GeoPosition from "../core/domain/GeoPosition/models/GeoPosition";
@Component({ components: { Compass } })
export default class CoreControls extends Vue {
  @Prop() camera!: TrackballCamera;
  @Prop({ default: false }) hasVisControls!: boolean;
  @Prop({ default: "Visualization controls" }) visTitle!: string;

  visControls = false;

  globalOrbitChange?: () => void;
  globalOrbitPosition: GeoPosition = new GeoPosition();
  northAngleEvent?: () => void;
  northAngle = 0;

  beforeMount() {
    this.northAngleEvent = this.camera.onNorthAngleChange.sub(
      _.throttle((e, angle) => {
        this.northAngle = angle;
      }, 1000 / 30)
    );
    this.globalOrbitChange = this.camera.onGlobalOrbitChange.sub(
      _.throttle((e, orbit) => {
        this.globalOrbitPosition = orbit.getGeoPosition();
      }, 1000 / 15)
    );
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
    return `
      ${String(l.d)}\u00B0
      ${String(l.m).padStart(2, "0")}"
      ${String(l.s).padStart(2, "0")}'
      ${l.dir}`;
  }

  rotateNorth() {
    this.camera.rotateNorth();
  }
  zoomIn() {
    this.camera.zoomIn(1);
  }
  zoomOut() {
    this.camera.zoomOut(1);
  }

  destroyed() {
    if (this.northAngleEvent) this.northAngleEvent();
    if (this.globalOrbitChange) this.globalOrbitChange();
  }
}
</script>

<style scoped lang="scss"></style>
