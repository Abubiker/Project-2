<template>
  <div class="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.1fr,1fr]">
    <UiCard>
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
                class="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                @click="triggerAvatar"
              >
                Загрузить
              </button>
              <button
                v-if="profileForm.avatarUrl"
                type="button"
                class="text-xs text-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 rounded-full px-2 py-1"
                @click="removeAvatar"
              >
                Удалить
              </button>
              <span v-if="avatarSaving" class="text-xs text-slate">Сохранение...</span>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" aria-label="Загрузка аватара" @change="onAvatarChange" />
            <p v-if="avatarError" class="mt-2 text-xs text-coral">{{ avatarError }}</p>
          </div>
        </div>

        <form @submit.prevent="handleProfileSave" class="space-y-4 text-sm">
          <div>
            <UiLabel for="profile-name">Имя</UiLabel>
            <UiInput
              id="profile-name"
              v-model="profileForm.name"
              class-name="mt-2"
              :invalid="Boolean(profileErrors.name)"
              :aria-invalid="Boolean(profileErrors.name)"
              :aria-describedby="profileErrors.name ? 'profile-name-error' : undefined"
            />
            <p v-if="profileErrors.name" id="profile-name-error" class="mt-1 text-xs text-coral">{{ profileErrors.name }}</p>
          </div>
          <div>
            <UiLabel for="profile-email">Email</UiLabel>
            <UiInput
              id="profile-email"
              v-model="profileForm.email"
              class-name="mt-2"
              :invalid="Boolean(profileErrors.email)"
              :aria-invalid="Boolean(profileErrors.email)"
              :aria-describedby="profileErrors.email ? 'profile-email-error' : undefined"
            />
            <p v-if="profileErrors.email" id="profile-email-error" class="mt-1 text-xs text-coral">{{ profileErrors.email }}</p>
          </div>
          <UiButton type="submit" class-name="w-full">Сохранить профиль</UiButton>
          <p v-if="profileSuccess" class="text-sm text-mint">{{ profileSuccess }}</p>
          <p v-if="profileError" class="text-sm text-coral">{{ profileError }}</p>
        </form>
      </div>
    </UiCard>

    <UiCard>
      <h2 class="text-xl font-semibold mb-2">Смена пароля</h2>
      <p class="text-slate mb-6">Используйте сильный пароль.</p>

      <form @submit.prevent="handleChangePassword" class="space-y-4">
        <div>
          <UiLabel for="profile-current-password">Текущий пароль</UiLabel>
          <UiInput
            id="profile-current-password"
            v-model="form.currentPassword"
            type="password"
            autocomplete="current-password"
            class-name="mt-2"
            :invalid="Boolean(errors.currentPassword)"
            :aria-invalid="Boolean(errors.currentPassword)"
            :aria-describedby="errors.currentPassword ? 'profile-current-password-error' : undefined"
          />
          <p v-if="errors.currentPassword" id="profile-current-password-error" class="mt-1 text-xs text-coral">{{ errors.currentPassword }}</p>
        </div>
        <div>
          <UiLabel for="profile-new-password">Новый пароль</UiLabel>
          <UiInput
            id="profile-new-password"
            v-model="form.newPassword"
            type="password"
            autocomplete="new-password"
            class-name="mt-2"
            :invalid="Boolean(errors.newPassword)"
            :aria-invalid="Boolean(errors.newPassword)"
            :aria-describedby="errors.newPassword ? 'profile-new-password-error' : undefined"
          />
          <p v-if="errors.newPassword" id="profile-new-password-error" class="mt-1 text-xs text-coral">{{ errors.newPassword }}</p>
        </div>
        <div>
          <UiLabel for="profile-confirm-password">Повторите новый пароль</UiLabel>
          <UiInput
            id="profile-confirm-password"
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            class-name="mt-2"
            :invalid="Boolean(errors.confirmPassword)"
            :aria-invalid="Boolean(errors.confirmPassword)"
            :aria-describedby="errors.confirmPassword ? 'profile-confirm-password-error' : undefined"
          />
          <p v-if="errors.confirmPassword" id="profile-confirm-password-error" class="mt-1 text-xs text-coral">{{ errors.confirmPassword }}</p>
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

        <UiButton type="submit" class-name="w-full">
          Обновить пароль
        </UiButton>
        <p v-if="success" class="text-sm text-mint">{{ success }}</p>
        <p v-if="formError" class="text-sm text-coral">{{ formError }}</p>
      </form>
    </UiCard>

    <div v-if="confirmPasswordChange" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" @click.self="confirmPasswordChange = false">
      <div class="liquid-glass-surface w-full max-w-md rounded-3xl p-6 shadow-lg">
        <h3 class="text-lg font-semibold mb-2">Подтвердить смену пароля?</h3>
        <p class="text-sm text-slate mb-6">Вы уверены, что хотите обновить пароль?</p>
        <div class="flex items-center justify-end gap-3">
          <UiButton variant="outline" size="sm" @click="confirmPasswordChange = false">
            Отмена
          </UiButton>
          <UiButton size="sm" @click="confirmChangePassword">
            Подтвердить
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { api } from "../api";
import { pushToast } from "../toast";
import {
  getPasswordIssues,
  getPasswordRuleStates,
  normalizeString,
  validateEmail,
  validateRequired,
} from "../utils/form";
import UiButton from "../components/ui/UiButton.vue";
import UiCard from "../components/ui/UiCard.vue";
import UiInput from "../components/ui/UiInput.vue";
import UiLabel from "../components/ui/UiLabel.vue";

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
const avatarSaving = ref(false);

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

const passwordRules = computed(() => {
  return getPasswordRuleStates(form.newPassword);
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

  errors.value.currentPassword = validateRequired(form.currentPassword);
  const newPasswordRequiredError = validateRequired(form.newPassword);
  if (newPasswordRequiredError) {
    errors.value.newPassword = newPasswordRequiredError;
  } else {
    const issues = getPasswordIssues(form.newPassword);
    if (issues.length) {
      errors.value.newPassword = `Пароль должен содержать: ${issues.join(", ")}.`;
    }
  }
  const confirmPasswordRequiredError = validateRequired(form.confirmPassword);
  if (confirmPasswordRequiredError) {
    errors.value.confirmPassword = confirmPasswordRequiredError;
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
  saveAvatar();
}

function onAvatarChange(event) {
  avatarError.value = "";
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    avatarError.value = "Можно загружать только изображения.";
    return;
  }
  if (file.size > 3 * 1024 * 1024) {
    avatarError.value = "Максимальный размер файла — 3MB.";
    return;
  }
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.onload = () => {
    const size = Math.min(img.width, img.height);
    const sx = Math.floor((img.width - size) / 2);
    const sy = Math.floor((img.height - size) / 2);
    const canvas = document.createElement("canvas");
    const target = 256;
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, size, size, 0, 0, target, target);
    profileForm.avatarUrl = canvas.toDataURL("image/jpeg", 0.9);
    URL.revokeObjectURL(objectUrl);
    saveAvatar();
  };
  img.onerror = () => {
    avatarError.value = "Не удалось обработать изображение.";
    URL.revokeObjectURL(objectUrl);
  };
  img.src = objectUrl;
}

async function saveAvatar() {
  avatarSaving.value = true;
  try {
    const data = await api.updateProfile({ avatarUrl: profileForm.avatarUrl || null });
    user.value = data.user;
    profileForm.avatarUrl = data.user.avatarUrl || "";
    pushToast({ message: "Аватар обновлен", tone: "success" });
    window.dispatchEvent(new Event("auth-changed"));
  } catch (err) {
    avatarError.value = err.message || "Не удалось сохранить аватар.";
    pushToast({ message: avatarError.value, tone: "danger" });
  } finally {
    avatarSaving.value = false;
  }
}

async function handleProfileSave() {
  profileErrors.value = { name: "", email: "" };
  profileError.value = "";
  profileSuccess.value = "";

  profileErrors.value.name = validateRequired(profileForm.name);
  profileErrors.value.email = validateEmail(profileForm.email, { required: true });

  if (profileErrors.value.name || profileErrors.value.email) {
    return;
  }

  try {
    const data = await api.updateProfile({
      name: normalizeString(profileForm.name),
      email: normalizeString(profileForm.email).toLowerCase(),
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
