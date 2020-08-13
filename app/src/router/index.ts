import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import VisPicker from "@/components/VisPicker.vue";
import VisViewer from "@/components/VisViewer.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "VisPicker",
    component: VisPicker,
  },
  {
    path: "/:vis",
    name: "VisViewer",
    component: VisViewer,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
