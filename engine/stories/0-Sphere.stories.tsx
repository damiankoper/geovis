/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import GeoVisCore from "@/components/GeoVisCore.vue";
import SphereVis from "@/core/domain/Visualization/examples/SphereVis";
import Vuetify, { VApp } from "vuetify/lib";
import Vue from "vue";
import '@mdi/font/css/materialdesignicons.css'

Vue.use(Vuetify, {
  components: {
    VApp,
  },
});
export default {
  title: "SphereVis",
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
      <div style="width:95vw; height:95vh">
        <geo-vis-core visualization={(this as any).vis} />
      </div>
    );
  },
  props: {
    vis: { default: new SphereVis() },
  },
});
