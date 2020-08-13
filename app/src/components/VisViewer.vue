<template>
  <v-app>
    <v-app-bar app collapse dark>
      <v-btn icon :to="{ name: 'VisPicker' }">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
    </v-app-bar>

    <geo-vis-engine
      style="width: 100%; height: 99.99999vh;"
      :visualization="vis"
    />
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import GeoVisEngine, { Visualization } from "geo-vis-engine";
@Component({ components: { GeoVisEngine } })
export default class VisViewer extends Vue {
  @Prop() visualizations!: Visualization[] | undefined;
  get vis() {
    console.log(this.visualizations, this.$route.params.vis);

    return this.visualizations?.filter((v) => {
      return v.constructor.name === this.$route.params.vis;
    })[0];
  }
}
</script>
