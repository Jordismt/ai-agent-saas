import { createApp, createSSRApp, h } from "vue";
import LandingView from "../presentation/LandingView.vue";

export function createLandingApp(prerendered = true) {
  const app = (prerendered ? createSSRApp : createApp)(LandingView);
  // Real destination links; keep the landing independent from authenticated services.
  app.component("RouterLink", {
    props: ["to"],
    setup(props, { slots }) {
      return () => h("a", { href: props.to }, slots.default?.());
    },
  });
  return app;
}
