<template>
  <div class="min-h-screen bg-sand">
    <header class="px-6 py-5 border-b border-black/10 bg-white/70 backdrop-blur">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <RouterLink to="/dashboard" class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-2xl bg-mint text-white grid place-items-center font-semibold">IG</div>
          <div>
            <div class="text-lg font-semibold">Invoice Generator</div>
            <div class="text-xs text-slate">Быстрое выставление счетов</div>
          </div>
        </RouterLink>
        <nav class="flex items-center gap-4 text-sm text-slate">
          <template v-if="isAuthed">
            <RouterLink to="/dashboard" v-slot="{ href, navigate, isActive }">
              <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Дашборд</a>
            </RouterLink>
            <RouterLink to="/clients" v-slot="{ href, navigate, isActive }">
              <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Клиенты</a>
            </RouterLink>
            <RouterLink to="/templates" v-slot="{ href, navigate, isActive }">
              <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Шаблоны</a>
            </RouterLink>
            <RouterLink to="/invoices/new" v-slot="{ href, navigate, isActive }">
              <a :href="href" @click="navigate" :class="navLinkClass(isActive)">Новый счет</a>
            </RouterLink>
            <RouterLink to="/profile" v-slot="{ href, navigate, isActive }">
              <a :href="href" @click="navigate" :class="navLinkClass(isActive)" class="flex items-center gap-2">
                <span class="h-8 w-8 rounded-full bg-ink text-white grid place-items-center text-xs font-semibold">
                  {{ userInitials }}
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
      <RouterView />
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
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { RouterLink, RouterView } from "vue-router";
import { api, clearToken, getToken } from "./api";

const router = useRouter();
const isAuthed = ref(Boolean(getToken()));
const user = ref(null);
const showLogoutConfirm = ref(false);

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
  } else {
    user.value = null;
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

async function fetchUser() {
  try {
    const data = await api.me();
    user.value = data.user;
  } catch (_err) {
    user.value = null;
  }
}

onMounted(() => {
  window.addEventListener("auth-changed", syncAuth);
  if (isAuthed.value) {
    fetchUser();
  }
});

onUnmounted(() => {
  window.removeEventListener("auth-changed", syncAuth);
});
</script>
