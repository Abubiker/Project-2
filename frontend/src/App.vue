<template>
  <div class="min-h-screen app-shell-bg text-ink">
    <header class="app-header">
      <div class="mx-auto w-full max-w-[1800px] px-4 py-5 sm:px-6 sm:py-6">
        <div class="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_1fr_360px] lg:items-center">
          <div class="flex items-center justify-between lg:justify-start">
            <RouterLink to="/dashboard" class="liquid-logo-link flex shrink-0 items-center">
              <img src="/abuinv-logo.png" alt="AbuInv" class="h-11 w-auto" />
            </RouterLink>
            <button
              type="button"
              class="theme-toggle-button lg:hidden"
              :aria-label="isDarkTheme ? 'Переключить на дневную тему' : 'Переключить на ночную тему'"
              @click="toggleTheme"
            >
              <Sun v-if="isDarkTheme" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </button>
          </div>

          <nav class="app-nav flex items-center justify-center gap-1 sm:gap-2">
            <template v-if="isAuthed">
              <RouterLink to="/dashboard" v-slot="{ href, navigate, isActive }">
                <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Мои счета</a>
              </RouterLink>
              <RouterLink to="/clients" v-slot="{ href, navigate, isActive }">
                <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Клиенты</a>
              </RouterLink>
              <RouterLink to="/templates" v-slot="{ href, navigate, isActive }">
                <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Шаблоны</a>
              </RouterLink>
              <RouterLink to="/profile" v-slot="{ href, navigate, isActive }">
                <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Профиль</a>
              </RouterLink>
              <button type="button" class="nav-link-reference nav-link-reference--idle whitespace-nowrap" @click="showLogoutConfirm = true">Выход</button>
            </template>
            <template v-else>
              <RouterLink to="/login" v-slot="{ href, navigate, isActive }">
                <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Войти</a>
              </RouterLink>
              <RouterLink to="/register" v-slot="{ href, navigate, isActive }">
                <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Регистрация</a>
              </RouterLink>
            </template>
          </nav>

          <div class="flex items-center gap-2 lg:justify-end">
            <div v-if="isAuthed" ref="searchRef" class="relative flex-1 lg:max-w-sm">
              <label for="global-search" class="sr-only">Глобальный поиск</label>
              <input
                id="global-search"
                v-model="searchTerm"
                type="text"
                placeholder="Поиск по счетам, клиентам"
                aria-label="Поиск по счетам, клиентам и шаблонам"
                :aria-expanded="searchOpen"
                aria-haspopup="listbox"
                class="glass-search-input w-full"
                @focus="openSearch"
              />
              <div
                v-if="searchOpen"
                role="listbox"
                class="liquid-glass-surface search-dropdown z-40 rounded-2xl shadow-lg"
              >
                <div v-if="!searchTerm.trim()" class="px-4 py-3 text-sm text-slate">
                  Введите запрос для поиска.
                </div>
                <div v-else-if="searchResults.length === 0" class="px-4 py-3 text-sm text-slate">
                  Ничего не найдено.
                </div>
                <div v-else class="max-h-64 overflow-auto py-2">
                  <button
                    v-for="result in searchResults"
                    :key="result.key"
                    type="button"
                    role="option"
                    :aria-label="`${result.section}: ${result.title}`"
                    class="search-result-item w-full text-left px-4 py-2"
                    @mousedown.prevent
                    @click="goToResult(result)"
                  >
                    <div class="text-sm font-semibold">{{ result.title }}</div>
                    <div class="text-xs text-slate flex items-center justify-between">
                      <span>{{ result.meta }}</span>
                      <span class="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-slate">
                        {{ result.section }}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              class="theme-toggle-button hidden lg:inline-flex"
              :aria-label="isDarkTheme ? 'Переключить на дневную тему' : 'Переключить на ночную тему'"
              @click="toggleTheme"
            >
              <Sun v-if="isDarkTheme" class="h-4 w-4" />
              <Moon v-else class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main px-6 py-10">
      <div class="page-enter ui-fade-slide">
        <RouterView />
      </div>
    </main>

    <div v-if="showLogoutConfirm" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" @click.self="showLogoutConfirm = false">
      <div class="liquid-glass-surface w-full max-w-md rounded-3xl p-6 shadow-lg">
        <h3 class="text-lg font-semibold mb-2">Выйти из аккаунта?</h3>
        <p class="text-sm text-slate mb-6">Вы уверены, что хотите выйти?</p>
        <div class="flex items-center justify-end gap-3">
          <button class="rounded-full border border-black/10 px-4 py-2 text-sm" @click="showLogoutConfirm = false">
            Отмена
          </button>
          <button class="rounded-full bg-ink text-white px-4 py-2 text-sm" @click="confirmLogout">
            Выйти
          </button>
        </div>
      </div>
    </div>

    <div class="fixed top-6 right-6 z-50 flex flex-col gap-2">
      <div
        v-for="toast in toastState.items"
        :key="toast.id"
        :class="toastClass(toast.tone)"
        class="glass-toast rounded-2xl px-4 py-3 text-sm shadow-lg cursor-pointer"
        @click="removeToast(toast.id)"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { Moon, Sun } from "lucide-vue-next";
import { api, clearToken, getToken } from "./api";
import { toastState, removeToast } from "./toast";

const router = useRouter();
const isAuthed = ref(Boolean(getToken()));
const showLogoutConfirm = ref(false);
const user = ref(null);
const searchTerm = ref("");
const searchOpen = ref(false);
const searchRef = ref(null);
const invoices = ref([]);
const clients = ref([]);
const templates = ref([]);
const theme = ref("light");
const isDarkTheme = computed(() => theme.value === "dark");
const toastToneClasses = {
  danger: "glass-toast--danger text-white",
  success: "glass-toast--success text-white",
  info: "glass-toast--info text-white",
};

function navLinkClass(isActive) {
  return isActive
    ? "nav-link-reference nav-link-reference--active"
    : "nav-link-reference nav-link-reference--idle";
}

function syncAuth() {
  isAuthed.value = Boolean(getToken());
  if (isAuthed.value) {
    fetchUser();
    fetchSearchData();
    return;
  }

  user.value = null;
  invoices.value = [];
  clients.value = [];
  templates.value = [];
  searchTerm.value = "";
  searchOpen.value = false;
}

function logout() {
  clearToken();
  router.push("/login");
}

function confirmLogout() {
  showLogoutConfirm.value = false;
  logout();
}

function toastClass(tone) {
  return toastToneClasses[tone] || toastToneClasses.info;
}

function detectTheme() {
  if (typeof window === "undefined") return "light";
  const persistedTheme = localStorage.getItem("abuinv_theme");
  if (persistedTheme === "light" || persistedTheme === "dark") return persistedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(nextTheme) {
  theme.value = nextTheme;
  document.documentElement.setAttribute("data-theme", nextTheme);
  localStorage.setItem("abuinv_theme", nextTheme);
}

function toggleTheme() {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

async function fetchUser() {
  try {
    const data = await api.me();
    user.value = data.user;
  } catch (_err) {
    user.value = null;
  }
}

async function fetchSearchData() {
  try {
    const [invoicesData, clientsData, templatesData] = await Promise.all([
      api.listInvoices(),
      api.listClients(),
      api.listTemplates(),
    ]);
    invoices.value = invoicesData.invoices || [];
    clients.value = clientsData.clients || [];
    templates.value = templatesData.templates || [];
  } catch (_err) {
    invoices.value = [];
    clients.value = [];
    templates.value = [];
  }
}

const normalizedSearch = computed(() => searchTerm.value.trim().toLowerCase());

const searchResults = computed(() => {
  const term = normalizedSearch.value;
  if (!term) return [];

  const results = [];

  invoices.value.forEach((invoice) => {
    const haystack = `${invoice.number} ${invoice.clientName} ${invoice.status}`.toLowerCase();
    if (haystack.includes(term)) {
      results.push({
        key: `invoice-${invoice.id}`,
        section: "Счета",
        title: `${invoice.number} · ${invoice.clientName}`,
        meta: `${invoice.status} · ${invoice.total} ${invoice.currency}`,
        route: "/dashboard",
      });
    }
  });

  clients.value.forEach((client) => {
    const haystack = `${client.name} ${client.company || ""} ${client.email || ""}`.toLowerCase();
    if (haystack.includes(term)) {
      results.push({
        key: `client-${client.id}`,
        section: "Клиенты",
        title: client.name,
        meta: `${client.company || "Без компании"} · ${client.email || "Без email"}`,
        route: "/clients",
      });
    }
  });

  templates.value.forEach((template) => {
    const haystack = `${template.name} ${template.data?.currency || ""}`.toLowerCase();
    if (haystack.includes(term)) {
      results.push({
        key: `template-${template.id}`,
        section: "Шаблоны",
        title: template.name,
        meta: `Валюта: ${template.data?.currency || "USD"} · Налог: ${template.data?.taxPercent || 0}%`,
        route: "/templates",
      });
    }
  });

  return results;
});

function openSearch() {
  searchOpen.value = true;
}

function goToResult(result) {
  searchOpen.value = false;
  router.push(result.route);
}

function handleClickOutside(event) {
  if (!searchRef.value) return;
  if (!searchRef.value.contains(event.target)) {
    searchOpen.value = false;
  }
}

onMounted(() => {
  applyTheme(detectTheme());
  window.addEventListener("auth-changed", syncAuth);
  document.addEventListener("click", handleClickOutside);
  syncAuth();
});

onUnmounted(() => {
  window.removeEventListener("auth-changed", syncAuth);
  document.removeEventListener("click", handleClickOutside);
});
</script>
