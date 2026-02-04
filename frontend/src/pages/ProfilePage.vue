<template>
  <div class="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.1fr,1fr]">
    <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
      <h1 class="text-2xl font-semibold mb-2">Профиль</h1>
      <p class="text-slate mb-6">Личная информация, указанная при регистрации.</p>

      <div v-if="loading" class="text-slate">Загрузка...</div>
      <div v-else-if="error" class="text-coral">{{ error }}</div>

      <div v-else class="space-y-6">
        <div class="flex items-center gap-4">
          <div class="h-16 w-16 rounded-full bg-ink/10 overflow-hidden grid place-items-center text-lg font-semibold text-ink">
            <img v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" alt="Avatar" class="h-full w-full object-cover" />
            <span v-else>{{ initials }}</span>
          </div>
          <div>
            <div class="text-sm text-slate">Аватар</div>
            <div class="flex items-center gap-3 mt-2">
              <button
                type="button"
                class="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
                @click="triggerAvatar"
              >
                Загрузить
              </button>
              <button
                v-if="profileForm.avatarUrl"
                type="button"
                class="text-xs text-coral"
                @click="removeAvatar"
              >
                Удалить
              </button>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
            <p v-if="avatarError" class="mt-2 text-xs text-coral">{{ avatarError }}</p>
          </div>
        </div>

        <form @submit.prevent="handleProfileSave" class="space-y-4 text-sm">
          <div>
            <label class="text-slate">Имя</label>
            <input v-model="profileForm.name" :class="inputClass(profileErrors.name)" class="mt-2 w-full rounded-xl border px-4 py-3" />
            <p v-if="profileErrors.name" class="mt-1 text-xs text-coral">{{ profileErrors.name }}</p>
          </div>
          <div>
            <label class="text-slate">Email</label>
            <input v-model="profileForm.email" :class="inputClass(profileErrors.email)" class="mt-2 w-full rounded-xl border px-4 py-3" />
            <p v-if="profileErrors.email" class="mt-1 text-xs text-coral">{{ profileErrors.email }}</p>
          </div>
          <button class="w-full rounded-xl bg-ink text-white py-3 font-semibold">Сохранить профиль</button>
          <p v-if="profileSuccess" class="text-sm text-mint">{{ profileSuccess }}</p>
          <p v-if="profileError" class="text-sm text-coral">{{ profileError }}</p>
        </form>
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

    <div v-if="confirmPasswordChange" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" @click.self="confirmPasswordChange = false">
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">
        <h3 class="text-lg font-semibold mb-2">Подтвердить смену пароля?</h3>
        <p class="text-sm text-slate mb-6">Вы уверены, что хотите обновить пароль?</p>
        <div class="flex items-center justify-end gap-3">
          <button class="rounded-full border border-black/10 px-4 py-2 text-sm" @click="confirmPasswordChange = false">
            Отмена
          </button>
          <button class="rounded-full bg-ink text-white px-4 py-2 text-sm" @click="confirmChangePassword">
            Подтвердить
          </button>
        </div>
      </div>
    </div>
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
const profileSuccess = ref("");
const profileError = ref("");
const avatarError = ref("");
const confirmPasswordChange = ref(false);
const pendingPasswordPayload = ref(null);

const fileInput = ref(null);

const form = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const profileForm = reactive({
  name: "",
  email: "",
  avatarUrl: "",
});

const profileErrors = ref({ name: "", email: "" });

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

const initials = computed(() => {
  const name = profileForm.name || user.value?.name || user.value?.email || "";
  const parts = name.trim().split(" ");
  const initial = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || "U";
  return initial.toUpperCase();
});

async function loadUser() {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.me();
    user.value = data.user;
    profileForm.name = data.user.name || "";
    profileForm.email = data.user.email || "";
    profileForm.avatarUrl = data.user.avatarUrl || "";
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

  pendingPasswordPayload.value = {
    currentPassword: form.currentPassword,
    newPassword: form.newPassword,
  };
  confirmPasswordChange.value = true;
}

async function confirmChangePassword() {
  if (!pendingPasswordPayload.value) return;
  confirmPasswordChange.value = false;
  try {
    await api.changePassword(pendingPasswordPayload.value);
    success.value = "Пароль обновлен.";
    resetForm();
  } catch (err) {
    formError.value = err.message;
  } finally {
    pendingPasswordPayload.value = null;
  }
}

function triggerAvatar() {
  fileInput.value?.click();
}

function removeAvatar() {
  profileForm.avatarUrl = "";
}

function onAvatarChange(event) {
  avatarError.value = "";
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    avatarError.value = "Можно загружать только изображения.";
    return;
  }
  if (file.size > 1024 * 1024) {
    avatarError.value = "Максимальный размер файла — 1MB.";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    profileForm.avatarUrl = reader.result;
  };
  reader.readAsDataURL(file);
}

async function handleProfileSave() {
  profileErrors.value = { name: "", email: "" };
  profileError.value = "";
  profileSuccess.value = "";

  if (!profileForm.name.trim()) {
    profileErrors.value.name = "Обязательно к заполнению.";
  }
  if (!profileForm.email.trim()) {
    profileErrors.value.email = "Обязательно к заполнению.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
    profileErrors.value.email = "Email указан неверно.";
  }

  if (profileErrors.value.name || profileErrors.value.email) {
    return;
  }

  try {
    const data = await api.updateProfile({
      name: profileForm.name.trim(),
      email: profileForm.email.trim().toLowerCase(),
      avatarUrl: profileForm.avatarUrl || null,
    });
    user.value = data.user;
    profileSuccess.value = "Профиль обновлен.";
    window.dispatchEvent(new Event("auth-changed"));
  } catch (err) {
    profileError.value = err.message;
  }
}

onMounted(loadUser);
</script>
