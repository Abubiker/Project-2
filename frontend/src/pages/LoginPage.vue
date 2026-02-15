<template>
  <UiCard class-name="mx-auto max-w-lg p-8">
    <h1 class="text-2xl font-semibold mb-2">Вход в систему</h1>
    <p class="text-slate mb-6">Используйте email и пароль, чтобы получить доступ к счетам.</p>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <UiLabel for="login-email">Email</UiLabel>
        <UiInput
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          class-name="mt-2"
          :invalid="Boolean(errors.email)"
          :aria-invalid="Boolean(errors.email)"
          :aria-describedby="errors.email ? 'login-email-error' : undefined"
        />
        <p v-if="errors.email" id="login-email-error" class="mt-1 text-xs text-coral">{{ errors.email }}</p>
      </div>
      <div>
        <UiLabel for="login-password">Пароль</UiLabel>
        <div class="relative mt-2">
          <UiInput
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class-name="pr-12"
            :invalid="Boolean(errors.password)"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? 'login-password-error' : undefined"
          />
          <UiButton
            type="button"
            variant="ghost"
            size="icon"
            class-name="absolute right-1 top-1/2 -translate-y-1/2"
            @click="handleTogglePassword"
            :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
            :aria-pressed="showPassword"
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
          </UiButton>
        </div>
        <p v-if="errors.password" id="login-password-error" class="mt-1 text-xs text-coral">{{ errors.password }}</p>
      </div>

      <UiButton type="submit" class-name="w-full">
        Войти
      </UiButton>
      <p v-if="error" class="text-sm text-coral">{{ error }}</p>
    </form>

    <div class="mt-6 text-sm text-slate">
      Нет аккаунта?
      <RouterLink to="/register" class="text-ink font-semibold">Зарегистрироваться</RouterLink>
    </div>
  </UiCard>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { api, setToken } from "../api";
import { normalizeString, validateEmail, validateRequired } from "../utils/form";
import UiButton from "../components/ui/UiButton.vue";
import UiCard from "../components/ui/UiCard.vue";
import UiInput from "../components/ui/UiInput.vue";
import UiLabel from "../components/ui/UiLabel.vue";

const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const errors = ref({ email: "", password: "" });
const showPassword = ref(false);

const handleTogglePassword = () => {
  showPassword.value = !showPassword.value;
};

async function handleLogin() {
  error.value = "";
  errors.value = { email: "", password: "" };
  errors.value.email = validateEmail(email.value, { required: true });
  errors.value.password = validateRequired(password.value);
  if (errors.value.email || errors.value.password) return;

  try {
    const response = await api.login({
      email: normalizeString(email.value).toLowerCase(),
      password: password.value,
    });
    setToken(response.token);
    router.push("/dashboard");
  } catch (err) {
    const message = String(err?.message || "Ошибка авторизации");
    error.value = message;
    if (message.toLowerCase().includes("invalid email or password")) {
      errors.value.email = "Неверный email или пароль.";
      errors.value.password = "Неверный email или пароль.";
    }
  }
}
</script>
