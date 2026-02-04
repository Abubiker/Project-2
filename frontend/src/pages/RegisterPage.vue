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
        <div class="mt-2 space-y-1 text-xs">
          <div
            v-for="rule in passwordRules"
            :key="rule.label"
            :class="rule.ok ? 'text-mint' : 'text-slate'"
          >
            {{ rule.label }}
          </div>
        </div>
        <div v-if="password.length" class="mt-3">
          <div class="flex items-center justify-between text-xs text-slate">
            <span>Надежность пароля</span>
            <span :class="strengthTextClass">{{ strengthLabel }}</span>
          </div>
          <div class="mt-2 h-2 w-full rounded-full bg-black/10">
            <div
              class="h-2 rounded-full transition-all"
              :class="strengthBarClass"
              :style="{ width: strengthPercent + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <button class="w-full rounded-xl bg-ink text-white py-3 font-semibold">
        Создать аккаунт
      </button>
      <p v-if="error" class="text-sm text-coral">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
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

const passwordRules = computed(() => {
  const pwd = password.value || "";
  return [
    { label: "Минимум 8 символов", ok: pwd.length >= 8 },
    { label: "1 заглавная буква (A-Z)", ok: /[A-Z]/.test(pwd) },
    { label: "1 цифра (0-9)", ok: /[0-9]/.test(pwd) },
    { label: "1 символ (!@#)", ok: /[^A-Za-z0-9]/.test(pwd) },
  ];
});

const strengthScore = computed(() => passwordRules.value.filter((rule) => rule.ok).length);

const strengthPercent = computed(() => Math.min(100, (strengthScore.value / 4) * 100));

const strengthLabel = computed(() => {
  if (!password.value.length) return "";
  if (strengthScore.value <= 1) return "Слабый";
  if (strengthScore.value <= 3) return "Средний";
  return "Сильный";
});

const strengthBarClass = computed(() => {
  if (strengthScore.value <= 1) return "bg-coral";
  if (strengthScore.value <= 3) return "bg-amber-400";
  return "bg-mint";
});

const strengthTextClass = computed(() => {
  if (strengthScore.value <= 1) return "text-coral";
  if (strengthScore.value <= 3) return "text-amber-500";
  return "text-mint";
});

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
