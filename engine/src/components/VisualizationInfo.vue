<template>
  <v-container class="pt-0" style="max-width: 400px;">
    <v-row dense>
      <v-col :cols="3" class="text-right font-weight-bold">Author</v-col>
      <v-col :cols="9">{{ info.author }}</v-col>
      <v-col :cols="3" class="text-right font-weight-bold">Description</v-col>
      <v-col
        :cols="9"
        style="white-space: pre-wrap; word-break: break-word;"
        v-html="info.description"
      ></v-col>
      <v-col :cols="3" class="text-right font-weight-bold">Keywords</v-col>
      <v-col :cols="9"> {{ info.keywords.join(", ") }} </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import Visualization from "@/core/domain/Visualization/models/Visualization";
import VisualizationMeta from "@/core/domain/Visualization/models/VisualizationMeta";

@Component
export default class VisualizationInfo extends Vue {
  @Prop() vis!: Visualization;
  info = new VisualizationMeta().getData();

  @Watch("vis", { immediate: true })
  onVisChange(v?: Visualization) {
    if (v) {
      this.info = v.meta.getData();
    }
  }
}
</script>

<style scoped lang="scss"></style>
