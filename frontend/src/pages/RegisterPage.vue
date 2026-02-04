<template>
  <div class="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-black/5 p-8">
    <h1 class="text-2xl font-semibold mb-2">Регистрация</h1>
    <p class="text-slate mb-6">Создайте аккаунт, чтобы начать выставлять счета.</p>

    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label class="text-sm text-slate">Имя</label>
        <input v-model="name" type="text" :class="inputClass(errors.name)" class="mt-2 w-full rounded-xl border px-4 py-3" />
        <p v-if="errors.name" class="mt-1 text-xs text-coral">{{ errors.name }}</p>
      </div>
      <div>
        <label class="text-sm text-slate">Email</label>
        <input v-model="email" type="email" :class="inputClass(errors.email)" class="mt-2 w-full rounded-xl border px-4 py-3" />
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
            class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate hover:text-ink"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? "Скрыть" : "Показать" }}
          </button>
        </div>
        <p v-if="errors.password" class="mt-1 text-xs text-coral">{{ errors.password }}</p>
      </div>

      <button class="w-full rounded-xl bg-ink text-white py-3 font-semibold">
        Создать аккаунт
      </button>
      <p v-if="error" class="text-sm text-coral">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api, setToken } from "../api";

const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const errors = ref({ name: "", email: "", password: "" });
const showPassword = ref(false);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function inputClass(hasError) {
  return hasError ? "border-coral focus:outline-none focus:ring-2 focus:ring-coral/40" : "border-black/10";
}

async function handleRegister() {
  error.value = "";
  errors.value = { name: "", email: "", password: "" };
  if (!name.value.trim()) {
    errors.value.name = "Обязательно к заполнению.";
  }
  if (!email.value.trim()) {
    errors.value.email = "Обязательно к заполнению.";
  } else if (!emailPattern.test(email.value.trim())) {
    errors.value.email = "Укажите корректный email.";
  }
  const pwd = password.value;
  const passwordIssues = [];
  if (!pwd.trim()) {
    errors.value.password = "Обязательно к заполнению.";
  } else {
    if (pwd.length < 8) passwordIssues.push("минимум 8 символов");
    if (!/[A-Z]/.test(pwd)) passwordIssues.push("1 заглавная буква");
    if (!/[0-9]/.test(pwd)) passwordIssues.push("1 цифра");
    if (!/[^A-Za-z0-9]/.test(pwd)) passwordIssues.push("1 символ");
    if (passwordIssues.length) {
      errors.value.password = `Пароль должен содержать: ${passwordIssues.join(", ")}.`;
    }
  }
  if (errors.value.name || errors.value.email || errors.value.password) {
    return;
  }
  try {
    const response = await api.register({
      name: name.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: password.value,
    });
    setToken(response.token);
    router.push("/dashboard");
  } catch (err) {
    error.value = err.message;
    if (err.message.toLowerCase().includes("email already registered")) {
      errors.value.email = "Этот email уже зарегистрирован.";
    }
  }
}
</script>
