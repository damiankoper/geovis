/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import GeoVisCore from "@/components/GeoVisCore.vue";
import IssVis from "@/core/domain/Visualization/examples/IssVis/IssVis";
import Vuetify, { VApp } from "vuetify/lib";
import Vue from "vue";
import "@mdi/font/css/materialdesignicons.css";

Vue.use(Vuetify, {
  components: {
    VApp,
  },
});
export default {
  title: "IssVis",
  component: GeoVisCore,
  decorators: [
    () => ({
      vuetify: new Vuetify({}),
      render(h: any) {
        return (
          <v-app>
            <story />
          </v-app>
        );
      },
    }),
  ],
};

export const Basic = () => ({
  components: { GeoVisCore },
  render(h: any) {
    return (
      <geo-vis-core
        style="height:99.9999vh"
        visualization={(this as any).vis}
      />
    );
  },
  props: {
    vis: { default: new IssVis() },
  },
});