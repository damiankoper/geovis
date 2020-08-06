<template>
  <v-container>
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
        <h4>Satellites</h4>

        <v-checkbox
          hide-details
          v-model="issVisible"
          class="ma-0"
          label="ISS"
        />
        <v-checkbox
          hide-details
          v-model="hstVisible"
          class="ma-0"
          label="Hubble Space Telescope"
        />
        <v-checkbox
          hide-details
          v-model="hotbirdVisible"
          class="ma-0"
          label="Hot Bird 13C"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import IssVis from "./IssVis";
import { TrackballMode } from "@/core/domain/Camera/enums/TrackballMode";
@Component
export default class IssVisControls extends Vue {
  @Prop() vis!: IssVis;
  compassMode = this.vis.camera?.getMode() == TrackballMode.Compass;

  issVisible = true;
  hstVisible = true;
  hotbirdVisible = true;

  @Watch("compassMode")
  onCompassModeChange(v: boolean) {
    this.vis.camera?.setMode(v ? TrackballMode.Compass : TrackballMode.Free);
  }

  @Watch("issVisible")
  onIssVisibleChange(v: boolean) {
    this.vis.issObject?.visible(v);
  }
  @Watch("hstVisible")
  onHstVisibleChange(v: boolean) {
    this.vis.hstObject?.visible(v);
  }
  @Watch("hotbirdVisible")
  onHotbirdVisibleChange(v: boolean) {
    this.vis.hotbird13EObject?.visible(v);
  }
}
</script>

<style scoped></style>
