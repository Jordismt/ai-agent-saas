import { renderToString } from "vue/server-renderer";
import { createLandingApp } from "./landingApp.js";

export function render() {
  return renderToString(createLandingApp());
}
