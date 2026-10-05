import "./style.css";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { installLandingMetadata } from "./modules/landing/seo/routeMetadata.js";

installLandingMetadata(router);

createApp(App).use(router).mount("#app");
