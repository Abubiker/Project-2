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
          <RouterLink to="/dashboard" class="hover:text-ink">Дашборд</RouterLink>
          <RouterLink to="/clients" class="hover:text-ink">Клиенты</RouterLink>
          <RouterLink to="/templates" class="hover:text-ink">Шаблоны</RouterLink>
          <RouterLink
            to="/invoices/new"
            class="rounded-full bg-ink text-white px-4 py-2 text-xs font-semibold"
          >
            Новый счет
          </RouterLink>
          <RouterLink v-if="!isAuthed" to="/login" class="hover:text-ink">
            Войти
          </RouterLink>
          <RouterLink v-if="!isAuthed" to="/register" class="hover:text-ink">
            Регистрация
          </RouterLink>
          <button v-if="isAuthed" class="text-slate hover:text-ink" @click="logout">
            Выход
          </button>
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
