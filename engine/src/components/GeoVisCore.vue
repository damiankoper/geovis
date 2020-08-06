<template>
  <div class="geo-vis">
    <div class="three-container" ref="threeContainer"></div>
    <core-controls
      class="core-controls"
      :camera="camera"
      :hasVisControls="visualization.getControls() != null"
      v-if="camera"
      :visTitle="visInfo.title"
    >
      <component
        :vis="visualization"
        class="vis-controls"
        :is="visualization.getControls()"
      />
      <template v-slot:info>
        <visualization-info :info="visInfo" />
      </template>
    </core-controls>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import GeoVisCore from "../core/GeoVisCore";
import Visualization from "../core/domain/Visualization/models/Visualization";
import CoreControls from "./CoreControls.vue";
import VisualizationInfo from "./VisualizationInfo.vue";
import VisualizationMeta from "@/core/domain/Visualization/models/VisualizationMeta";

@Component({
  components: { CoreControls, VisualizationInfo },
})
export default class GeoVisCoreVue extends Vue {
  geoVisCore: GeoVisCore | null = null;
  @Prop() visualization!: Visualization;
  visInfo = new VisualizationMeta().getData();

  get camera() {
    return this.geoVisCore?.cameraController;
  }

  mounted() {
    const container = this.$refs.threeContainer;
    if (container) {
      this.geoVisCore = new GeoVisCore(container as HTMLElement);
      this.onVisChange(this.visualization);

      const resizeObserver = new window.ResizeObserver((entry) => {
        entry.forEach(() => {
          if (this.geoVisCore) this.geoVisCore.setSize();
        });
      });
      resizeObserver.observe(container);
    }
  }

  destroyed() {
    console.log("Vue destroyed");

    if (this.geoVisCore) this.geoVisCore.destroy();
  }

  @Watch("visualization")
  onVisChange(v?: Visualization) {
    if (v && this.geoVisCore) {
      this.geoVisCore.run(v);
      v._setupMeta();
      this.visInfo = v.meta.getData();
    }
  }
}
</script>

<style scoped lang="scss">
.geo-vis {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  .three-container {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
  .core-controls {
    position: absolute;
    right: 0;
    bottom: 0;
    user-select: none;
    pointer-events: none;
  }
}
</style>
