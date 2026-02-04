<template>
  <div class="min-h-screen bg-sand">
    <header class="px-6 py-5 border-b border-black/10 bg-white/70 backdrop-blur">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-2xl bg-mint text-white grid place-items-center font-semibold">IG</div>
          <div>
            <div class="text-lg font-semibold">Invoice Generator</div>
            <div class="text-xs text-slate">Быстрое выставление счетов</div>
          </div>
        </div>
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
            <button class="text-slate hover:text-ink" @click="logout">Выход</button>
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
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { RouterLink, RouterView } from "vue-router";
import { clearToken, getToken } from "./api";

const router = useRouter();
const isAuthed = ref(Boolean(getToken()));

function navLinkClass(isActive) {
  return isActive
    ? "text-ink font-semibold border-b-2 border-ink pb-1"
    : "text-slate hover:text-ink";
}

function syncAuth() {
  isAuthed.value = Boolean(getToken());
}

function logout() {
  clearToken();
  router.push("/login");
}

onMounted(() => {
  window.addEventListener("auth-changed", syncAuth);
});

onUnmounted(() => {
  window.removeEventListener("auth-changed", syncAuth);
});
</script>
