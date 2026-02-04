import { createRouter, createWebHistory } from "vue-router";
import { getToken } from "./api";
import LoginPage from "./pages/LoginPage.vue";
import RegisterPage from "./pages/RegisterPage.vue";
import DashboardPage from "./pages/DashboardPage.vue";
import ClientsPage from "./pages/ClientsPage.vue";
import TemplatesPage from "./pages/TemplatesPage.vue";
import InvoiceCreatePage from "./pages/InvoiceCreatePage.vue";
import ProfilePage from "./pages/ProfilePage.vue";

const routes = [
  { path: "/", redirect: "/dashboard" },
  { path: "/login", component: LoginPage },
  { path: "/register", component: RegisterPage },
  { path: "/dashboard", component: DashboardPage, meta: { requiresAuth: true } },
  { path: "/clients", component: ClientsPage, meta: { requiresAuth: true } },
  { path: "/templates", component: TemplatesPage, meta: { requiresAuth: true } },
  { path: "/invoices/new", component: InvoiceCreatePage, meta: { requiresAuth: true } },
  { path: "/profile", component: ProfilePage, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = getToken();
  if (to.meta.requiresAuth && !token) {
    return "/login";
  }
  if ((to.path === "/login" || to.path === "/register") && token) {
    return "/dashboard";
  }
  return true;
});

export default router;
