<template>
  <div class="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.2fr,1fr]">
    <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
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
          @click="openClient(client)"
        >
          <div>
            <div class="font-semibold">{{ client.name }}</div>
            <div class="text-sm text-slate">{{ client.company || "Компания не указана" }}</div>
            <div class="text-xs text-slate">{{ client.email || "Email не указан" }}</div>
          </div>
          <button class="text-xs text-coral" @click.stop="removeClient(client.id)">
            Удалить
          </button>
        </div>

        <div v-if="clients.length === 0" class="text-slate text-sm">
          Пока нет клиентов. Добавьте первого клиента справа.
        </div>
      </div>
    </section>

    <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
      <h2 class="text-xl font-semibold mb-4">Новый клиент</h2>
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <label class="text-sm text-slate">Имя</label>
          <input v-model="form.name" :class="inputClass(errors.name)" class="mt-2 w-full rounded-xl border px-4 py-3" />
          <p v-if="errors.name" class="mt-1 text-xs text-coral">{{ errors.name }}</p>
        </div>
        <div>
          <label class="text-sm text-slate">Компания</label>
          <input v-model="form.company" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
        </div>
        <div>
          <label class="text-sm text-slate">Email</label>
          <input v-model="form.email" type="email" :class="inputClass(errors.email)" class="mt-2 w-full rounded-xl border px-4 py-3" />
          <p v-if="errors.email" class="mt-1 text-xs text-coral">{{ errors.email }}</p>
        </div>
        <div>
          <label class="text-sm text-slate">Телефон</label>
          <input v-model="form.phone" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
        </div>
        <div>
          <label class="text-sm text-slate">Адрес</label>
          <textarea v-model="form.address" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3"></textarea>
        </div>
        <div>
          <label class="text-sm text-slate">ИНН / Tax ID</label>
          <input v-model="form.taxId" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
        </div>

        <button class="w-full rounded-xl bg-ink text-white py-3 font-semibold">
          Сохранить клиента
        </button>
        <p v-if="formError" class="text-sm text-coral">{{ formError }}</p>
      </form>
    </section>

    <div v-if="selectedClient" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" @click.self="closeModal">
      <div class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-lg">
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

const clients = ref([]);
const loading = ref(false);
const error = ref("");
const formError = ref("");
const errors = ref({ name: "", email: "" });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

function inputClass(hasError) {
  return hasError
    ? "border-coral bg-coral/10 focus:outline-none focus:ring-2 focus:ring-coral/40"
    : "border-black/10";
}

function openClient(client) {
  selectedClient.value = client;
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
  if (!form.name.trim()) {
    errors.value.name = "Обязательно к заполнению.";
  }
  if (form.email && !emailPattern.test(form.email.trim())) {
    errors.value.email = "Email указан неверно.";
  }
  if (errors.value.name || errors.value.email) {
    return;
  }
  try {
    const payload = {
      name: form.name,
      email: form.email || null,
      company: form.company || null,
      phone: form.phone || null,
      address: form.address || null,
      taxId: form.taxId || null,
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
