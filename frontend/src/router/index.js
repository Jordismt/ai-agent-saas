import { createRouter, createWebHistory } from "vue-router";

import DashboardLayout from "../layouts/DashboardLayout.vue";

import LandingView from "../modules/landing/presentation/LandingView.vue";
import LoginView from "../modules/auth/presentation/LoginView.vue";
import RegisterView from "../modules/auth/presentation/RegisterView.vue";
import DashboardView from "../modules/dashboard/presentation/DashboardView.vue";
import BookingListView from "../modules/bookings/presentation/BookingListView.vue";
import ManageBookingView from "../modules/bookings/presentation/ManageBookingView.vue";
import CreateBusinessView from "../modules/businesses/presentation/CreateBusinessView.vue";
import BusinessListView from "../modules/businesses/presentation/BusinessListView.vue";
import BusinessDetailView from "../modules/businesses/presentation/BusinessDetailView.vue";
import BusinessAgentConfigView from "../modules/businesses/presentation/BusinessAgentConfigView.vue";
import ConversationListView from "../modules/conversations/presentation/ConversationListView.vue";
import ConversationDetailView from "../modules/conversations/presentation/ConversationDetailView.vue";
import LeadListView from "../modules/leads/presentation/LeadListView.vue";
import EmployeeListView from "../modules/employees/presentation/EmployeeListView.vue";
import EmployeeDetailView from "../modules/employees/presentation/EmployeeDetailView.vue";
import ChatView from "../modules/public/presentation/ChatView.vue";
import PublicPageSettingsView from "../modules/publicPages/presentation/PublicPageSettingsView.vue";
import PublicBusinessView from "../modules/publicPages/presentation/PublicBusinessView.vue";

import { authGuard } from "./authGuard.js";

const routes = [
  {
    path: "/",
    name: "landing",
    component: LandingView,
  },

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
   * Gestión pública de una reserva.
   *
   * No requiere login.
   * La autenticación es el token secreto recibido
   * por email.
   *
   * IMPORTANTE:
   * debe estar antes de /:slug.
   */
  {
    path: "/booking/:token",
    name: "manage-booking",
    component: ManageBookingView,
  },

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

      {
        path: "businesses/:id/employees",
        name: "business-employees",
        component: EmployeeListView,
      },

      {
        path: "businesses/:id/employees/:employeeId",
        name: "employee-detail",
        component: EmployeeDetailView,
      },

      {
        path: "businesses/:id/public-page",
        name: "business-public-page",
        component: PublicPageSettingsView,
      },
    ],
  },

  /*
   * Página pública del negocio.
   *
   * Debe permanecer después de todas las rutas
   * reservadas de Resbix.
   */
  {
    path: "/:slug",
    name: "public-business-page",
    component: PublicBusinessView,
  },

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

    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 80,
      };
    }

    return {
      top: 0,
      behavior: "smooth",
    };
  },
});

export default router;
