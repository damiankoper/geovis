<template>
  <div class="geo-vis">
    <div class="three-container" ref="threeContainer"></div>
    <div class="core-controls"></div>
    <div class="vis-controls"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import GeoVisCore from "../core/GeoVisCore";
import Visualization from "../core/domain/Visualization/models/Visualization";

@Component
export default class GeoVisCoreVue extends Vue {
  geoVisCore: GeoVisCore | null = null;
  @Prop() visualization!: Visualization;

  mounted() {
    const container = this.$refs.threeContainer;
    if (container) {
      this.geoVisCore = new GeoVisCore(container as HTMLElement);
      this.onVisChange(this.visualization);

      const resizeObserver = new window.ResizeObserver(entry => {
        entry.forEach(() => {
          if (this.geoVisCore) this.geoVisCore.setSize();
        });
      });
      resizeObserver.observe(container);
    }
  }

  @Watch("visualization")
  onVisChange(v?: Visualization) {
    if (v && this.geoVisCore) {
      this.geoVisCore.run(v);
    }
  }
}
</script>

<style scoped lang="scss">
.geo-vis {
  width: 100%;
  height: 100%;
  position: relative;
  .three-container {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
}
</style>
