<template>
  <v-container class="pt-0" style="min-width: 300px;">
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
    </v-row>
    <v-row>
      <v-col :cols="12">
        <h4>Time</h4>
        <v-row dense align="center">
          <v-col cols="auto">
            <v-btn fab x-small @click="reset">
              <v-icon> mdi-restart </v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <v-slider
              v-model="speed"
              hide-details
              thumb-label="always"
              :min="1"
              :max="500"
              label="Speed"
            >
              <template v-slot:thumb-label="{ value }"> {{ value }}x </template>
            </v-slider>
          </v-col>
          <v-col :cols="12">
            <p>{{ datetime }} UTC</p>
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
import ActiveSatellitesVis from "./ActiveSatellitesVis";
import { TrackballMode } from "@/core/domain/Camera/enums/TrackballMode";
import moment from "moment";
@Component
export default class ActiveSatellitesVisControls extends Vue {
  @Prop() vis!: ActiveSatellitesVis;
  compassMode = this.vis.camera?.getMode() == TrackballMode.Compass;
  speed = this.vis.speed;
  datetime = "";

  @Watch("compassMode")
  onCompassModeChange(v: boolean) {
    this.vis.camera?.setMode(v ? TrackballMode.Compass : TrackballMode.Free);
  }

  @Watch("speed")
  onSpeedChange(s: number) {
    this.vis.speed = s;
  }

  timeInterval = 0;
  mounted() {
    this.timeInterval = setInterval(() => {
      this.datetime = this.vis.timestamp.format("YYYY-MM-DD HH:mm:ss");
    }, 200);
  }

  destroyed() {
    clearInterval(this.timeInterval);
  }

  reset() {
    this.speed = 1;
    this.vis.setTimestamp(moment.utc());
  }
}
</script>

<style scoped></style>
