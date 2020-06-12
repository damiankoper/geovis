<template>
  <v-btn class="compass mb-2" fab>
    <v-img
      class="needle"
      src="@/assets/icons/needle.svg"
      :aspect-ratio="1"
      :style="{ transform: `rotate(${-angle}rad)` }"
      width="48px"
    />
  </v-btn>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class Compass extends Vue {
  @Prop({ default: 0 }) angle!: number;
}
</script>

<style scoped lang="scss"></style>
