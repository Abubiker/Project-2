<template>
  <div class="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.2fr,1fr]">
    <UiCard>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Клиенты</h2>
        <span class="text-sm text-slate">{{ clients.length }} всего</span>
      </div>

      <div v-if="loading" class="text-slate">Загрузка...</div>
      <div v-else-if="error" class="text-coral">{{ error }}</div>

      <div v-else class="space-y-3">
        <div
          v-for="client in clients"
          :key="client.id"
          class="border border-black/5 rounded-2xl p-4 flex items-start justify-between cursor-pointer hover:border-black/10"
          role="button"
          tabindex="0"
          :aria-label="`Открыть клиента ${client.name}`"
          @click="openClient(client)"
          @keydown="handleClientCardKeydown($event, client)"
        >
          <div>
            <div class="font-semibold">{{ client.name }}</div>
            <div class="text-sm text-slate">{{ client.company || "Компания не указана" }}</div>
            <div class="text-xs text-slate">{{ client.email || "Email не указан" }}</div>
          </div>
          <UiButton type="button" variant="ghost" size="sm" class-name="text-coral hover:text-coral" @click.stop="removeClient(client.id)">
            Удалить
          </UiButton>
        </div>

        <div v-if="clients.length === 0" class="text-slate text-sm">
          Пока нет клиентов. Добавьте первого клиента справа.
        </div>
      </div>
    </UiCard>

    <UiCard>
      <h2 class="text-xl font-semibold mb-4">Новый клиент</h2>
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <UiLabel for="client-name">Имя</UiLabel>
          <UiInput
            id="client-name"
            v-model="form.name"
            class-name="mt-2"
            :invalid="Boolean(errors.name)"
            :aria-invalid="Boolean(errors.name)"
            :aria-describedby="errors.name ? 'client-name-error' : undefined"
          />
          <p v-if="errors.name" id="client-name-error" class="mt-1 text-xs text-coral">{{ errors.name }}</p>
        </div>
        <div>
          <UiLabel for="client-company">Компания</UiLabel>
          <UiInput id="client-company" v-model="form.company" class-name="mt-2" />
        </div>
        <div>
          <UiLabel for="client-email">Email</UiLabel>
          <UiInput
            id="client-email"
            v-model="form.email"
            type="email"
            class-name="mt-2"
            :invalid="Boolean(errors.email)"
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'client-email-error' : undefined"
          />
          <p v-if="errors.email" id="client-email-error" class="mt-1 text-xs text-coral">{{ errors.email }}</p>
        </div>
        <div>
          <UiLabel for="client-phone">Телефон</UiLabel>
          <UiInput id="client-phone" v-model="form.phone" class-name="mt-2" />
        </div>
        <div>
          <UiLabel for="client-address">Адрес</UiLabel>
          <UiTextarea id="client-address" v-model="form.address" class-name="mt-2" />
        </div>
        <div>
          <UiLabel for="client-tax-id">ИНН / Tax ID</UiLabel>
          <UiInput id="client-tax-id" v-model="form.taxId" class-name="mt-2" />
        </div>

        <UiButton type="submit" class-name="w-full">
          Сохранить клиента
        </UiButton>
        <p v-if="formError" class="text-sm text-coral">{{ formError }}</p>
      </form>
    </UiCard>

    <div v-if="selectedClient" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" @click.self="closeModal">
      <div class="liquid-glass-surface w-full max-w-lg rounded-3xl p-6 shadow-lg">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold">{{ selectedClient.name }}</h3>
            <p class="text-sm text-slate">{{ selectedClient.company || "Компания не указана" }}</p>
          </div>
          <button class="text-sm text-slate hover:text-ink" @click="closeModal">Закрыть</button>
        </div>
        <div class="mt-4 space-y-2 text-sm">
          <div><span class="text-slate">Email:</span> {{ selectedClient.email || "Не указан" }}</div>
          <div><span class="text-slate">Телефон:</span> {{ selectedClient.phone || "Не указан" }}</div>
          <div><span class="text-slate">Адрес:</span> {{ selectedClient.address || "Не указан" }}</div>
          <div><span class="text-slate">ИНН / Tax ID:</span> {{ selectedClient.taxId || "Не указан" }}</div>
          <div><span class="text-slate">Создан:</span> {{ selectedClient.createdAt || "—" }}</div>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { api } from "../api";
import { pushToast } from "../toast";
import { normalizeString, validateEmail, validateRequired } from "../utils/form";
import UiButton from "../components/ui/UiButton.vue";
import UiCard from "../components/ui/UiCard.vue";
import UiInput from "../components/ui/UiInput.vue";
import UiLabel from "../components/ui/UiLabel.vue";
import UiTextarea from "../components/ui/UiTextarea.vue";

const clients = ref([]);
const loading = ref(false);
const error = ref("");
const formError = ref("");
const errors = ref({ name: "", email: "" });
const selectedClient = ref(null);

const form = reactive({
  name: "",
  email: "",
  company: "",
  phone: "",
  address: "",
  taxId: "",
});

function resetForm() {
  form.name = "";
  form.email = "";
  form.company = "";
  form.phone = "";
  form.address = "";
  form.taxId = "";
}

function openClient(client) {
  selectedClient.value = client;
}

function handleClientCardKeydown(event, client) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openClient(client);
}

function closeModal() {
  selectedClient.value = null;
}

function onEsc(event) {
  if (event.key === "Escape") {
    closeModal();
  }
}

async function fetchClients() {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.listClients();
    clients.value = data.clients || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  formError.value = "";
  errors.value = { name: "", email: "" };
  errors.value.name = validateRequired(form.name);
  errors.value.email = validateEmail(form.email);
  if (errors.value.name || errors.value.email) return;

  try {
    const payload = {
      name: normalizeString(form.name),
      email: normalizeString(form.email) || null,
      company: normalizeString(form.company) || null,
      phone: normalizeString(form.phone) || null,
      address: normalizeString(form.address) || null,
      taxId: normalizeString(form.taxId) || null,
    };
    const data = await api.createClient(payload);
    clients.value = [data.client, ...clients.value];
    resetForm();
    pushToast({ message: "Клиент создан", tone: "success" });
  } catch (err) {
    formError.value = err.message;
    pushToast({ message: err.message || "Ошибка создания клиента", tone: "danger" });
  }
}

async function removeClient(id) {
  try {
    await api.deleteClient(id);
    const removed = clients.value.find((client) => client.id === id);
    clients.value = clients.value.filter((client) => client.id !== id);
    if (removed) {
      pushToast({ message: "Клиент удален", tone: "danger" });
    }
  } catch (err) {
    error.value = err.message;
    pushToast({ message: err.message || "Ошибка удаления клиента", tone: "danger" });
  }
}

onMounted(() => {
  fetchClients();
  window.addEventListener("keydown", onEsc);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onEsc);
});
</script>
