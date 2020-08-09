/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import GeoVisCore from "@/components/GeoVisCore.vue";
import EmptyVis from "@/core/domain/Visualization/examples/EmptyVis/EmptyVis";
import Vuetify, { VApp } from "vuetify/lib";
import Vue from "vue";
import "@mdi/font/css/materialdesignicons.css";

Vue.use(Vuetify, {
  components: {
    VApp,
  },
});
export default {
  title: "EmptyVis",
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
      <div>
        <geo-vis-core
          style="height:600px;width:100vw"
          visualization={(this as any).vis}
        />
      </div>
    );
  },
  props: {
    vis: { default: new EmptyVis() },
  },
});
