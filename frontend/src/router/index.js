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
import AccountSettingsView from "../modules/account/presentation/AccountSettingsView.vue";

import { authGuard } from "./authGuard.js";
import { BillingService } from "../modules/billing/infrastructure/BillingService.js";
import BusinessBillingView from "../modules/billing/presentation/BusinessBillingView.vue";

// Páginas legales
import AvisoLegalView from "../modules/legal/presentation/AvisoLegalView.vue";

import PrivacidadView from "../modules/legal/presentation/PrivacidadView.vue";

import CookiesView from "../modules/legal/presentation/CookiesView.vue";

import TerminosView from "../modules/legal/presentation/TerminosView.vue";

import TratamientoDatosView from "../modules/legal/presentation/TratamientoDatosView.vue";

import ForgotPasswordView from "../modules/auth/presentation/ForgotPasswordView.vue";
import ResetPasswordView from "../modules/auth/presentation/ResetPasswordView.vue";

const billingService = new BillingService();
async function paidBusinessGuard(to) {
  try {
    const { billing } = await billingService.getStatus(to.params.id);
    if (["active", "trialing"].includes(billing?.status)) return true;
    return { name: "business-billing", params: { id: to.params.id } };
  } catch {
    return { name: "business-billing", params: { id: to.params.id } };
  }
}

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
    path: "/aviso-legal",
    name: "aviso-legal",
    component: AvisoLegalView,
  },
  {
    path: "/privacidad",
    name: "privacidad",
    component: PrivacidadView,
  },
  {
    path: "/cookies",
    name: "cookies",
    component: CookiesView,
  },
  {
    path: "/terminos",
    name: "terminos",
    component: TerminosView,
  },
  {
    path: "/tratamiento-datos",
    name: "tratamiento-datos",
    component: TratamientoDatosView,
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

      { path: "businesses/:id/billing", name: "business-billing", component: BusinessBillingView },
      {
        path: "businesses/:id",
        name: "business-detail",
        component: BusinessDetailView,
        beforeEnter: paidBusinessGuard,
      },

      {
        path: "businesses/:id/agent-config",
        name: "business-agent-config",
        component: BusinessAgentConfigView,
        beforeEnter: paidBusinessGuard,
      },

      {
        path: "businesses/:id/conversations",
        name: "business-conversations",
        component: ConversationListView,
        beforeEnter: paidBusinessGuard,
      },

      {
        path: "businesses/:id/conversations/:conversationId",
        name: "conversation-detail",
        component: ConversationDetailView,
        beforeEnter: paidBusinessGuard,
      },

      {
        path: "businesses/:id/leads",
        name: "business-leads",
        component: LeadListView,
        beforeEnter: paidBusinessGuard,
      },

      {
        path: "businesses/:id/bookings",
        name: "business-bookings",
        component: BookingListView,
        beforeEnter: paidBusinessGuard,
      },

      {
        path: "businesses/:id/employees",
        name: "business-employees",
        component: EmployeeListView,
        beforeEnter: paidBusinessGuard,
      },

      {
        path: "businesses/:id/employees/:employeeId",
        name: "employee-detail",
        component: EmployeeDetailView,
        beforeEnter: paidBusinessGuard,
      },

      {
        path: "businesses/:id/public-page",
        name: "business-public-page",
        component: PublicPageSettingsView,
        beforeEnter: paidBusinessGuard,
      },
      {
        path: "settings",
        name: "account-settings",
        component: AccountSettingsView,
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
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: ForgotPasswordView,
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: ResetPasswordView,
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
