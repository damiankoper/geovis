<template>
  <div>
    <router-view :visualizations="visualizations" v-model="visualization" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Examples, Visualization } from "geo-vis-engine";
import Component from "vue-class-component";

@Component
export default class App extends Vue {
  visualizations?: Visualization[];
  visualization: Visualization | null = null;

  beforeMount() {
    this.visualizations = [
      new Examples.EarthVis(),
      new Examples.AtmosphereVis(),
      new Examples.ActiveSatellitesVis(),
      new Examples.IssVis(),
      new Examples.TilesVis(),
      new Examples.StarsVis(),
      new Examples.EmptyVis(),
    ];
  }
}
</script>
