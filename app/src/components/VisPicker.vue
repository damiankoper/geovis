<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-icon left large>mdi-earth</v-icon>
      <v-toolbar-title>
        GeoVis
      </v-toolbar-title>
      <v-spacer />
      <v-text-field
        v-model="search"
        dense
        outlined
        hide-details
        label="Search"
        width="100"
        prepend-icon="mdi-magnify"
        style="max-width: 300px;"
        cy-data="search"
      ></v-text-field>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row>
          <v-col
            v-for="v in visibleVisualizations"
            :key="v.name"
            :xl="3"
            :lg="4"
            :sm="6"
            :cols="12"
            cy-data="vis-card"
          >
            <vis-card :v="v" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Model, Prop } from "vue-property-decorator";
import GeoVisEngine, { Visualization } from "geo-vis-engine";
import VisCard from "./VisCard.vue";
@Component({ components: { GeoVisEngine, VisCard } })
export default class VisPicker extends Vue {
  @Model() visualization!: Visualization | null;
  @Prop() visualizations!: Visualization[] | undefined;

  search = "";

  get visibleVisualizations() {
    return (this.visualizations || []).filter((v) => {
      const meta = v.meta.getData();
      const search = this.search.toLowerCase().trim();
      return (
        search
          .split(" ")
          .filter((s) => !!s)
          .some(
            (s) =>
              meta.keywords.some((k: string) => k.toLowerCase().includes(s)) ||
              meta.title.toLowerCase().includes(s) ||
              meta.author.toLowerCase().includes(s) ||
              meta.description.toLowerCase().includes(s)
          ) || !search
      );
    });
  }
}
</script>
