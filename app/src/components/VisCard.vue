<template>
  <v-card>
    <v-img
      v-if="meta.thumbnailB64"
      class="white--text align-end"
      height="200px"
      :src="meta.thumbnailB64"
    >
      <v-card-title>{{ meta.title }}</v-card-title>
    </v-img>
    <v-sheet
      class="white--text d-flex flex-column justify-space-between"
      v-else
      color="secondary lighten-2"
      height="200px"
    >
      <div
        class="d-flex justify-center align-center flex-grow-1"
        style="position: absolute; height:200px; width:100%"
      >
        <v-icon size="60" color="white"> mdi-image-off-outline </v-icon>
      </div>
      <div></div>
      <v-card-title>{{ meta.title }}</v-card-title>
    </v-sheet>

    <v-card-subtitle class="pb-0">{{ meta.author }}</v-card-subtitle>

    <v-card-text class="text--primary">
      <div>{{ meta.description }}</div>
      <v-divider class="my-2" />
      <div class="subheading">Keywords</div>
      <v-chip x-small v-for="keyword in keywords" :key="keyword" class="mr-1">
        {{ keyword }}
      </v-chip>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" text @click="$emit('show', v)">
        Show
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { Visualization, VisualizationMeta } from "geo-vis-engine";
import _ from "lodash";
@Component
export default class VisCard extends Vue {
  @Prop() v!: Visualization;
  meta = new VisualizationMeta().getData();

  @Watch("v", { immediate: true })
  onVChange(v: Visualization | null) {
    if (v) {
      v.setupMeta();
      this.meta = v.meta.getData();
    }
  }

  get keywords() {
    return _.uniq(((this.meta as any).keywords || []).reverse());
  }
}
</script>

<style scoped></style>
