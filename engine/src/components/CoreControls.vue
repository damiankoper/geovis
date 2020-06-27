<template>
  <v-sheet
    color="rgba(255,255,255,0.5)"
    rounded
    :elevation="4"
    class="core-controls ma-2 pa-2 d-flex flex-column align-center"
  >
    &deg;
    <compass :angle="northAngle" @click="rotateNorth" />
    <v-btn fab small class="mb-2" @click="zoomIn">
      <v-icon dark>mdi-plus</v-icon>
    </v-btn>
    <v-btn fab small @click="zoomOut">
      <v-icon dark>mdi-minus</v-icon>
    </v-btn>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import TrackballCamera from "../core/domain/Camera/interfaces/TrackballCamera";
import Compass from "./Compass.vue";
import _ from "lodash";
@Component({ components: { Compass } })
export default class CoreControls extends Vue {
  @Prop() camera!: TrackballCamera;
  northAngleEvent?: () => void;
  northAngle = 0;

  beforeMount() {
    this.northAngleEvent = this.camera.onNorthAngleChange.sub(
      _.throttle((e, angle) => {
        this.northAngle = angle;
      }, 16)
    );
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
  }
}
</script>

<style scoped lang="scss">
.core-controls {
  position: absolute;
  right: 0;
  bottom: 0;
}
</style>
