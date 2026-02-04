<template>
  <div class="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.1fr,1fr]">
    <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
      <h1 class="text-2xl font-semibold mb-2">Профиль</h1>
      <p class="text-slate mb-6">Личная информация, указанная при регистрации.</p>

      <div v-if="loading" class="text-slate">Загрузка...</div>
      <div v-else-if="error" class="text-coral">{{ error }}</div>

      <div v-else class="space-y-4 text-sm">
        <div>
          <div class="text-slate">Имя</div>
          <div class="font-semibold">{{ user?.name }}</div>
        </div>
        <div>
          <div class="text-slate">Email</div>
          <div class="font-semibold">{{ user?.email }}</div>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
      <h2 class="text-xl font-semibold mb-2">Смена пароля</h2>
      <p class="text-slate mb-6">Используйте сильный пароль.</p>

      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <div>
          <label class="text-sm text-slate">Текущий пароль</label>
          <input
            v-model="form.currentPassword"
            type="password"
            :class="inputClass(errors.currentPassword)"
            class="mt-2 w-full rounded-xl border px-4 py-3"
          />
          <p v-if="errors.currentPassword" class="mt-1 text-xs text-coral">{{ errors.currentPassword }}</p>
        </div>
        <div>
          <label class="text-sm text-slate">Новый пароль</label>
          <input
            v-model="form.newPassword"
            type="password"
            :class="inputClass(errors.newPassword)"
            class="mt-2 w-full rounded-xl border px-4 py-3"
          />
          <p v-if="errors.newPassword" class="mt-1 text-xs text-coral">{{ errors.newPassword }}</p>
        </div>
        <div>
          <label class="text-sm text-slate">Повторите новый пароль</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            :class="inputClass(errors.confirmPassword)"
            class="mt-2 w-full rounded-xl border px-4 py-3"
          />
          <p v-if="errors.confirmPassword" class="mt-1 text-xs text-coral">{{ errors.confirmPassword }}</p>
        </div>

        <div class="mt-2 space-y-1 text-xs">
          <div
            v-for="rule in passwordRules"
            :key="rule.label"
            :class="rule.ok ? 'text-mint' : 'text-slate'"
          >
            {{ rule.label }}
          </div>
        </div>

        <button class="w-full rounded-xl bg-ink text-white py-3 font-semibold">
          Обновить пароль
        </button>
        <p v-if="success" class="text-sm text-mint">{{ success }}</p>
        <p v-if="formError" class="text-sm text-coral">{{ formError }}</p>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { api } from "../api";

const user = ref(null);
const loading = ref(false);
const error = ref("");
const success = ref("");
const formError = ref("");

const form = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const errors = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

function inputClass(hasError) {
  return hasError ? "border-coral focus:outline-none focus:ring-2 focus:ring-coral/40" : "border-black/10";
}

const passwordRules = computed(() => {
  const pwd = form.newPassword || "";
  return [
    { label: "Минимум 8 символов", ok: pwd.length >= 8 },
    { label: "1 заглавная буква (A-Z)", ok: /[A-Z]/.test(pwd) },
    { label: "1 цифра (0-9)", ok: /[0-9]/.test(pwd) },
    { label: "1 символ (!@#)", ok: /[^A-Za-z0-9]/.test(pwd) },
  ];
});

async function loadUser() {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.me();
    user.value = data.user;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.currentPassword = "";
  form.newPassword = "";
  form.confirmPassword = "";
  errors.value = { currentPassword: "", newPassword: "", confirmPassword: "" };
}

async function handleChangePassword() {
  formError.value = "";
  success.value = "";
  errors.value = { currentPassword: "", newPassword: "", confirmPassword: "" };

  if (!form.currentPassword.trim()) {
    errors.value.currentPassword = "Обязательно к заполнению.";
  }
  if (!form.newPassword.trim()) {
    errors.value.newPassword = "Обязательно к заполнению.";
  } else {
    const issues = [];
    if (form.newPassword.length < 8) issues.push("минимум 8 символов");
    if (!/[A-Z]/.test(form.newPassword)) issues.push("1 заглавная буква");
    if (!/[0-9]/.test(form.newPassword)) issues.push("1 цифра");
    if (!/[^A-Za-z0-9]/.test(form.newPassword)) issues.push("1 символ");
    if (issues.length) {
      errors.value.newPassword = `Пароль должен содержать: ${issues.join(", ")}.`;
    }
  }
  if (!form.confirmPassword.trim()) {
    errors.value.confirmPassword = "Обязательно к заполнению.";
  } else if (form.confirmPassword !== form.newPassword) {
    errors.value.confirmPassword = "Пароли не совпадают.";
  }

  if (errors.value.currentPassword || errors.value.newPassword || errors.value.confirmPassword) {
    return;
  }

  try {
    await api.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    success.value = "Пароль обновлен.";
    resetForm();
  } catch (err) {
    formError.value = err.message;
  }
}

onMounted(loadUser);
</script>
