<template>
  <div class="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-black/5 p-8">
    <h1 class="text-2xl font-semibold mb-2">Вход в систему</h1>
    <p class="text-slate mb-6">Используйте email и пароль, чтобы получить доступ к счетам.</p>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="text-sm text-slate">Email</label>
        <input
          v-model="email"
          type="email"
          :class="inputClass(errors.email)"
          class="mt-2 w-full rounded-xl border px-4 py-3"
        />
        <p v-if="errors.email" class="mt-1 text-xs text-coral">{{ errors.email }}</p>
      </div>
      <div>
        <label class="text-sm text-slate">Пароль</label>
        <div class="relative mt-2">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :class="inputClass(errors.password)"
            class="w-full rounded-xl border px-4 py-3 pr-12"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
          >
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3l18 18" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.477 10.48a3 3 0 0 0 4.243 4.243" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.88 5.09A9.974 9.974 0 0 1 12 5c4.477 0 8.268 2.943 9.542 7a9.993 9.993 0 0 1-4.222 5.135" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.228 6.228A9.993 9.993 0 0 0 2.458 12c1.274 4.057 5.065 7 9.542 7 1.246 0 2.442-.23 3.542-.65" />
            </svg>
          </button>
        </div>
        <p v-if="errors.password" class="mt-1 text-xs text-coral">{{ errors.password }}</p>
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
const errors = ref({ email: "", password: "" });
const showPassword = ref(false);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function inputClass(hasError) {
  return hasError
    ? "border-coral bg-coral/10 focus:outline-none focus:ring-2 focus:ring-coral/40"
    : "border-black/10";
}

async function handleLogin() {
  error.value = "";
  errors.value = { email: "", password: "" };
  if (!email.value.trim()) {
    errors.value.email = "Обязательно к заполнению.";
    return;
  }
  if (!emailPattern.test(email.value.trim())) {
    errors.value.email = "Email указан неверно.";
    return;
  }
  if (!password.value.trim()) {
    errors.value.password = "Обязательно к заполнению.";
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
    if (err.message.toLowerCase().includes("invalid email or password")) {
      errors.value.email = "Неверный email или пароль.";
      errors.value.password = "Неверный email или пароль.";
    }
  }
}
</script>
