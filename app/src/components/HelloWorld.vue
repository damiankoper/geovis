<template>
  <v-container>
    <geo-vis-engine style="height:600px" :visualization="starsVis" />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import GeoVisEngine, { Examples } from "geo-vis-engine";
@Component({ components: { GeoVisEngine } })
export default class HelloWorld extends Vue {
  starsVis = new Examples.TilesVis();
}
</script>
