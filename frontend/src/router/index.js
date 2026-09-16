import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../modules/auth/presentation/LoginView.vue";
import RegisterView from "../modules/auth/presentation/RegisterView.vue";
import CreateBusinessView from "../modules/businesses/presentation/CreateBusinessView.vue";
import BusinessListView from "../modules/businesses/presentation/BusinessListView.vue";
import DashboardView from "../modules/dashboard/presentation/DashboardView.vue";
import BusinessDetailView from "../modules/businesses/presentation/BusinessDetailView.vue";

import { authGuard } from "./authGuard.js";

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    beforeEnter: authGuard,
  },
  {
    path: "/businesses/create",
    name: "create-business",
    component: CreateBusinessView,
    beforeEnter: authGuard,
  },
  {
    path: "/businesses/:id",
    name: "business-detail",
    component: BusinessDetailView,
    beforeEnter: authGuard,
  },
  {
    path: "/businesses",
    name: "businesses",
    component: BusinessListView,
    beforeEnter: authGuard,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
