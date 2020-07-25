/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import GeoVisCore from "@/components/GeoVisCore.vue";
import AtmosphereVis from "@/core/domain/Visualization/examples/AtmosphereVis/AtmosphereVis";
import Vuetify, { VApp } from "vuetify/lib";
import Vue from "vue";
import "@mdi/font/css/materialdesignicons.css";
import addons from "@storybook/addons";
addons.setConfig({
  showPanel: false,
  panelPosition: "right",
});
Vue.use(Vuetify, {
  components: {
    VApp,
  },
});
export default {
  title: "AtmosphereVis",
  component: GeoVisCore,
  options: { showPanel: false },
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
    vis: { default: new AtmosphereVis() },
  },
});
