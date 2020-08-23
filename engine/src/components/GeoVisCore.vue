<template>
  <div class="geo-vis" ref="geoVis">
    <div class="three-container" ref="threeContainer"></div>
    <core-controls
      class="core-controls"
      :camera="camera"
      :hasVisControls="visualization.getControls() != null"
      v-if="camera"
      :visTitle="meta.getData().title"
    >
      <component
        :vis="visualization"
        class="vis-controls"
        :is="visualization.getControls()"
      />
      <template v-slot:info>
        <visualization-info :vis="visualization" />
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
import Vuetify from "vuetify/lib";
import VisualizationMeta from "@/core/domain/Visualization/models/VisualizationMeta";
if (process.env.NODE_ENV === "production") Vue.use(Vuetify);

@Component({
  components: { CoreControls, VisualizationInfo },
})
export default class GeoVisCoreVue extends Vue {
  @Prop() visualization!: Visualization;
  geoVisCore: GeoVisCore | null = null;
  observer!: ResizeObserver;
  meta: VisualizationMeta = new VisualizationMeta();

  get camera() {
    return this.geoVisCore?.cameraController;
  }

  mounted() {
    const container = this.$refs.threeContainer;
    if (container) {
      this.geoVisCore = new GeoVisCore(container as HTMLElement);
      this.onVisChange(this.visualization);
      this.observer = new window.ResizeObserver((entry) => {
        entry.forEach(() => {
          if (this.geoVisCore) this.geoVisCore.setSize();
        });
      });
      this.observer.observe(this.$refs.geoVis as HTMLElement);
    }
  }

  destroyed() {
    this.observer.disconnect();
    if (this.geoVisCore) this.geoVisCore.destroy();
  }

  @Watch("visualization")
  onVisChange(v?: Visualization) {
    if (v && this.geoVisCore) {
      this.geoVisCore.run(v);
      this.meta = v.meta;
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
