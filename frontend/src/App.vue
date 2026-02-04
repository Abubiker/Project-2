<template>
  <div class="min-h-screen bg-sand">
    <header class="px-6 py-5 border-b border-black/10 bg-white/70 backdrop-blur">
      <div class="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <RouterLink to="/dashboard" class="flex items-center">
            <img
              src="/abuinv-logo.png"
              alt="AbuInv"
              class="h-20 w-auto"
            />
          </RouterLink>
          <div v-if="isAuthed" ref="searchRef" class="relative w-full max-w-sm">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Поиск по счетам, клиентам, шаблонам"
              class="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm"
              @focus="openSearch"
            />
            <div
              v-if="searchOpen"
              class="absolute left-0 right-0 mt-2 rounded-2xl border border-black/10 bg-white shadow-lg"
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
                  class="w-full text-left px-4 py-2 hover:bg-black/5"
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
        </div>
        <nav class="flex items-center gap-4 text-sm text-slate">
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
              <a :href="href" @click="navigate" :class="navLinkClass(isActive)" class="flex items-center gap-2">
                <span class="h-8 w-8 rounded-full bg-ink/10 text-ink grid place-items-center text-xs font-semibold overflow-hidden">
                  <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="Avatar" class="h-full w-full object-cover" />
                  <span v-else>{{ userInitials }}</span>
                </span>
                Профиль
              </a>
            </RouterLink>
            <button class="text-slate hover:text-ink" @click="showLogoutConfirm = true">Выход</button>
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
      </div>
    </header>

    <main class="px-6 py-10">
      <div class="page-enter">
        <RouterView />
      </div>
    </main>

    <div v-if="showLogoutConfirm" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" @click.self="showLogoutConfirm = false">
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">
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
        class="rounded-2xl px-4 py-3 text-sm shadow-lg cursor-pointer"
        @click="removeToast(toast.id)"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { RouterLink, RouterView } from "vue-router";
import { api, clearToken, getToken } from "./api";
import { toastState, removeToast } from "./toast";

const router = useRouter();
const isAuthed = ref(Boolean(getToken()));
const user = ref(null);
const showLogoutConfirm = ref(false);
const searchTerm = ref("");
const searchOpen = ref(false);
const searchRef = ref(null);
const invoices = ref([]);
const clients = ref([]);
const templates = ref([]);

const userInitials = computed(() => {
  if (!user.value) return "IG";
  const name = user.value.name || user.value.email || "";
  const parts = name.trim().split(" ");
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || "U";
  return initials.toUpperCase();
});

function navLinkClass(isActive) {
  return isActive
    ? "text-ink font-semibold border-b-2 border-ink pb-1"
    : "text-slate hover:text-ink";
}

function syncAuth() {
  isAuthed.value = Boolean(getToken());
  if (isAuthed.value) {
    fetchUser();
    fetchSearchData();
  } else {
    user.value = null;
    invoices.value = [];
    clients.value = [];
    templates.value = [];
  }
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
  switch (tone) {
    case "danger":
      return "bg-coral text-white";
    case "success":
      return "bg-mint text-white";
    default:
      return "bg-ink text-white";
  }
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
  window.addEventListener("auth-changed", syncAuth);
  document.addEventListener("click", handleClickOutside);
  if (isAuthed.value) {
    fetchUser();
    fetchSearchData();
  }
});

onUnmounted(() => {
  window.removeEventListener("auth-changed", syncAuth);
  document.removeEventListener("click", handleClickOutside);
});
</script>
