<template>
  <v-container class="pt-0" style="min-width: 600px;">
    <v-row>
      <v-col :cols="6">
        <h4>Camera</h4>
        <v-checkbox
          hide-details
          v-model="compassMode"
          class="ma-0"
          label="Compass mode"
        />
      </v-col>
      <v-col :cols="6">
        <h4>Layers</h4>

        <v-checkbox hide-details v-model="ground" class="ma-0" label="Ground" />
        <v-checkbox
          hide-details
          v-model="coverage"
          class="ma-0"
          label="Radar coverage"
        />
        <v-checkbox
          hide-details
          v-model="radar"
          class="ma-0"
          label="Rain radar"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col :cols="12">
        <h4>Time</h4>
        <v-row dense align="center">
          <v-col :cols="1">
            <v-btn fab x-small @click="playPause">
              <v-icon v-if="!playing"> mdi-play </v-icon>
              <v-icon v-else> mdi-pause </v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <v-slider
              v-model="timestampIndex"
              hide-details
              thumb-label="always"
              :min="0"
              :max="vis.timestamps.length - 1"
            >
              <template v-slot:thumb-label="{ value }">
                {{ getLabel(value) }}
              </template>
            </v-slider>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import OsmTilesVis from "./OsmTilesVis";
import { TrackballMode } from "../../../Camera/enums/TrackballMode";
import moment from "moment";
@Component
export default class OsmTilesVisControls extends Vue {
  @Prop() vis!: OsmTilesVis;
  compassMode = this.vis.camera?.getMode() == TrackballMode.Compass;
  ground = this.vis.osmTilesService.layers[0].visible;
  coverage = this.vis.osmTilesService.layers[1].visible;
  radar = this.vis.osmTilesService.layers[2].visible;

  timestampIndex = this.vis.timestampIndex;

  playing = false;
  playingInterval = 0;

  play() {
    this.timestampIndex =
      (this.timestampIndex + 1) % this.vis.timestamps.length;
  }

  playPause() {
    this.playing = !this.playing;
    clearInterval(this.playingInterval);
    if (this.playing) this.playingInterval = setInterval(this.play, 1000);
  }

  getLabel(i: number) {
    return moment(this.vis.timestamps[i] * 1000).format("HH:mm");
  }

  @Watch("compassMode")
  onCompassModeChange(v: boolean) {
    this.vis.camera?.setMode(v ? TrackballMode.Compass : TrackballMode.Free);
  }

  @Watch("timestampIndex")
  onTimeChange(i: number) {
    this.vis.timestampIndex = i;
    this.vis.refreshDeep();
  }

  @Watch("ground")
  @Watch("coverage")
  @Watch("radar")
  onLayersUpdate() {
    this.vis.osmTilesService.layers[0].visible = this.ground;
    this.vis.osmTilesService.layers[1].visible = this.coverage;
    this.vis.osmTilesService.layers[2].visible = this.radar;

    if (this.coverage || this.radar) {
      this.vis.osmTilesService.layers[0].filter = "brightness(60%)";
    } else {
      this.vis.osmTilesService.layers[0].filter = "";
    }
    this.vis.refreshDeep();
  }
}
</script>

<style scoped></style>
