<template>
  <div class="max-w-lg mx-auto bg-white rounded-3xl shadow-sm border border-black/5 p-8">
    <h1 class="text-2xl font-semibold mb-2">Регистрация</h1>
    <p class="text-slate mb-6">Создайте аккаунт, чтобы начать выставлять счета.</p>

    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label class="text-sm text-slate">Имя</label>
        <input v-model="name" type="text" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
      </div>
      <div>
        <label class="text-sm text-slate">Email</label>
        <input v-model="email" type="email" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
      </div>
      <div>
        <label class="text-sm text-slate">Пароль</label>
        <input v-model="password" type="password" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handleRegister() {
  error.value = "";
  if (!name.value.trim()) {
    error.value = "Укажите имя.";
    return;
  }
  if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
    error.value = "Укажите корректный email.";
    return;
  }
  const pwd = password.value;
  const passwordIssues = [];
  if (pwd.length < 8) passwordIssues.push("минимум 8 символов");
  if (!/[A-Z]/.test(pwd)) passwordIssues.push("1 заглавная буква");
  if (!/[0-9]/.test(pwd)) passwordIssues.push("1 цифра");
  if (!/[^A-Za-z0-9]/.test(pwd)) passwordIssues.push("1 символ");
  if (passwordIssues.length) {
    error.value = `Пароль должен содержать: ${passwordIssues.join(", ")}.`;
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
  }
}
</script>
