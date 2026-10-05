import { createApp, createSSRApp } from 'vue';
import SolutionLandingView from '../presentation/SolutionLandingView.vue';
export function createSolutionApp(path, prerendered = true) {
  return (prerendered ? createSSRApp : createApp)(SolutionLandingView, { path });
}
