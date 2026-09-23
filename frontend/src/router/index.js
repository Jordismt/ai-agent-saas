import { createRouter, createWebHistory } from "vue-router";

import DashboardLayout from "../layouts/DashboardLayout.vue";

import LandingView from "../modules/landing/presentation/LandingView.vue";

import LoginView from "../modules/auth/presentation/LoginView.vue";
import RegisterView from "../modules/auth/presentation/RegisterView.vue";

import DashboardView from "../modules/dashboard/presentation/DashboardView.vue";

import BookingListView from "../modules/bookings/presentation/BookingListView.vue";

import CreateBusinessView from "../modules/businesses/presentation/CreateBusinessView.vue";
import BusinessListView from "../modules/businesses/presentation/BusinessListView.vue";
import BusinessDetailView from "../modules/businesses/presentation/BusinessDetailView.vue";
import BusinessAgentConfigView from "../modules/businesses/presentation/BusinessAgentConfigView.vue";

import ConversationListView from "../modules/conversations/presentation/ConversationListView.vue";
import ConversationDetailView from "../modules/conversations/presentation/ConversationDetailView.vue";

import LeadListView from "../modules/leads/presentation/LeadListView.vue";

import ChatView from "../modules/public/presentation/ChatView.vue";

import { authGuard } from "./authGuard.js";

const routes = [
  /*
  |--------------------------------------------------------------------------
  | LANDING
  |--------------------------------------------------------------------------
  */

  {
    path: "/",
    name: "landing",
    component: LandingView,
  },

  /*
  |--------------------------------------------------------------------------
  | RUTAS PÚBLICAS
  |--------------------------------------------------------------------------
  */

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
    path: "/chat/:businessId",
    name: "public-chat",
    component: ChatView,
  },

  /*
  |--------------------------------------------------------------------------
  | APLICACIÓN PRIVADA
  |--------------------------------------------------------------------------
  */

  {
    path: "/",
    component: DashboardLayout,
    beforeEnter: authGuard,

    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: DashboardView,
      },

      /*
      |--------------------------------------------------------------------------
      | NEGOCIOS
      |--------------------------------------------------------------------------
      */

      {
        path: "businesses",
        name: "businesses",
        component: BusinessListView,
      },

      {
        path: "businesses/create",
        name: "create-business",
        component: CreateBusinessView,
      },

      {
        path: "businesses/:id",
        name: "business-detail",
        component: BusinessDetailView,
      },

      {
        path: "businesses/:id/agent-config",
        name: "business-agent-config",
        component: BusinessAgentConfigView,
      },

      /*
      |--------------------------------------------------------------------------
      | CONVERSACIONES
      |--------------------------------------------------------------------------
      */

      {
        path: "businesses/:id/conversations",
        name: "business-conversations",
        component: ConversationListView,
      },

      {
        path: "businesses/:id/conversations/:conversationId",
        name: "conversation-detail",
        component: ConversationDetailView,
      },

      /*
      |--------------------------------------------------------------------------
      | LEADS
      |--------------------------------------------------------------------------
      */

      {
        path: "businesses/:id/leads",
        name: "business-leads",
        component: LeadListView,
      },

      {
        path: "businesses/:id/bookings",
        name: "business-bookings",
        component: BookingListView,
      },
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | FALLBACK
  |--------------------------------------------------------------------------
  */

  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,

  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    return {
      top: 0,
      behavior: "smooth",
    };
  },
});

export default router;
