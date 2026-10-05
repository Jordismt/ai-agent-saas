import { renderToString } from "vue/server-renderer";
import { createLandingApp } from "./landingApp.js";

export function render() {
  return renderToString(createLandingApp());
}

export async function renderSolution(path) {
  const { createSolutionApp } = await import('./solutionApp.js');
  return renderToString(createSolutionApp(path));
}
