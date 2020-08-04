<template>
  <v-container>
    <v-row>
      <v-col>
        <v-checkbox
          hide-details
          v-model="compassMode"
          class="ma-0"
          label="Compass mode"
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

  @Watch("compassMode")
  onCompassModeChange(v: boolean) {
    this.vis.camera?.setMode(v ? TrackballMode.Compass : TrackballMode.Free);
  }
}
</script>

<style scoped></style>
