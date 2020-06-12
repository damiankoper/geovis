<template>
  <v-sheet
    color="rgba(255,255,255,0.5)"
    rounded
    :elevation="4"
    class="core-controls ma-2 pa-2 d-flex flex-column align-center"
  >
    <compass :angle="northAngle" />
    <v-btn fab small class="mb-2">
      <v-icon dark>mdi-plus</v-icon>
    </v-btn>
    <v-btn fab small>
      <v-icon dark>mdi-minus</v-icon>
    </v-btn>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import TrackballCamera from "../core/domain/Camera/interfaces/TrackballCamera";
import Compass from "./Compass.vue";

@Component({
  components: { Compass },
})
export default class CoreControls extends Vue {
  @Prop() camera!: TrackballCamera;
  northAngleEvent?: () => void;
  northAngle = 0;

  beforeMount() {
    this.northAngleEvent = this.camera.onNorthAngleChange.sub((e, angle) => {
      this.northAngle = angle;
    });
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
