<template>
  <div class="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-black/5 p-8">
    <h1 class="text-2xl font-semibold mb-2">Вход в систему</h1>
    <p class="text-slate mb-6">Используйте email и пароль, чтобы получить доступ к счетам.</p>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="text-sm text-slate">Email</label>
        <input v-model="email" type="email" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
      </div>
      <div>
        <label class="text-sm text-slate">Пароль</label>
        <input v-model="password" type="password" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
      </div>

      <button class="w-full rounded-xl bg-ink text-white py-3 font-semibold">
        Войти
      </button>
      <p v-if="error" class="text-sm text-coral">{{ error }}</p>
    </form>

    <div class="mt-6 text-sm text-slate">
      Нет аккаунта?
      <RouterLink to="/register" class="text-ink font-semibold">Зарегистрироваться</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { api, setToken } from "../api";

const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handleLogin() {
  error.value = "";
  if (!email.value.trim()) {
    error.value = "Укажите email.";
    return;
  }
  if (!emailPattern.test(email.value.trim())) {
    error.value = "Email указан неверно.";
    return;
  }
  if (!password.value.trim()) {
    error.value = "Укажите пароль.";
    return;
  }
  try {
    const response = await api.login({
      email: email.value.trim().toLowerCase(),
      password: password.value,
    });
    setToken(response.token);
    router.push("/dashboard");
  } catch (err) {
    error.value = err.message;
  }
}
</script>
