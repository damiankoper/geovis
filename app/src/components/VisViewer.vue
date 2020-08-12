<template>
  <v-app>
    <v-app-bar app> </v-app-bar>

    <v-main>
      <v-container> </v-container>
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import GeoVisEngine from "geo-vis-engine";
@Component({ components: { GeoVisEngine } })
export default class VisViewer extends Vue {}
</script>
