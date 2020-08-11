/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import GeoVisCore from "@/components/GeoVisCore.vue";
import EarthVis from "@/core/domain/Visualization/examples/EarthVis/EarthVis";
import Vuetify, { VApp } from "vuetify/lib";
import Vue from "vue";
import "@mdi/font/css/materialdesignicons.css";
import { withKnobs, boolean } from "@storybook/addon-knobs";

Vue.use(Vuetify, {
  components: {
    VApp,
  },
});
export default {
  title: "EarthVis",
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
    withKnobs,
  ],
};

export const Basic = () => ({
  components: { GeoVisCore },
  render(h: any) {
    if (this.visible)
      return (
        <div>
          <geo-vis-core
            style="height:99.9999vh"
            visualization={(this as any).vis}
          />
        </div>
      );
    else return <div></div>;
  },
  props: {
    vis: { default: new EarthVis() },
    visible: {
      default: boolean("Visible", true),
    },
  },
});
