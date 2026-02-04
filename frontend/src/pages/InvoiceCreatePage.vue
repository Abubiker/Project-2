<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Новый счет</h1>
        <p class="text-slate">Данные клиента и шаблон подтянутся автоматически после выбора.</p>
      </div>
      <button class="rounded-xl bg-ink text-white px-6 py-3 font-semibold" @click="handleSave">
        Сохранить счет
      </button>
    </header>

    <div class="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
      <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6 space-y-6">
        <div>
          <h2 class="text-lg font-semibold mb-3">Шаблон</h2>
          <div v-if="templatesLoading" class="text-slate">Загрузка шаблонов...</div>
          <div v-else-if="templatesError" class="text-coral">{{ templatesError }}</div>
          <div v-else>
            <select v-model="form.templateId" class="w-full rounded-xl border border-black/10 px-4 py-3">
              <option value="">Без шаблона</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.name }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <h2 class="text-lg font-semibold mb-3">Клиент</h2>
          <div v-if="clientsLoading" class="text-slate">Загрузка клиентов...</div>
          <div v-else-if="clientsError" class="text-coral">{{ clientsError }}</div>
          <div v-else-if="clients.length === 0" class="text-slate">
            Нет клиентов. Добавьте клиента, чтобы создать счет.
            <RouterLink to="/clients" class="text-ink font-semibold">Перейти к клиентам</RouterLink>
          </div>
          <div v-else>
            <select v-model="form.clientId" class="w-full rounded-xl border border-black/10 px-4 py-3">
              <option value="">Выберите клиента</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">
                {{ client.name }} — {{ client.company || "Без компании" }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm text-slate">Номер счета</label>
            <input
              v-model="form.number"
              :placeholder="autoNumberPlaceholder"
              class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3"
            />
          </div>
          <div>
            <label class="text-sm text-slate">Валюта</label>
            <input v-model="form.currency" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
          </div>
          <div>
            <label class="text-sm text-slate">Дата выставления</label>
            <input v-model="form.issueDate" type="date" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
          </div>
          <div>
            <label class="text-sm text-slate">Срок оплаты</label>
            <input v-model="form.dueDate" type="date" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
          </div>
        </div>

        <div>
          <h2 class="text-lg font-semibold mb-3">Позиции</h2>
          <div class="space-y-3">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto] items-center"
            >
              <input
                v-model="item.description"
                placeholder="Описание услуги"
                class="rounded-xl border border-black/10 px-4 py-3"
              />
              <input
                v-model.number="item.quantity"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Кол-во"
                class="rounded-xl border border-black/10 px-4 py-3"
              />
              <input
                v-model.number="item.unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Цена"
                class="rounded-xl border border-black/10 px-4 py-3"
              />
              <div class="text-right text-sm text-slate">
                {{ formatMoney(item.quantity * item.unitPrice) }}
              </div>
              <button
                v-if="form.items.length > 1"
                class="text-xs text-coral md:col-span-4 text-left"
                @click="removeItem(index)"
              >
                Удалить позицию
              </button>
            </div>
          </div>
          <button class="mt-4 text-sm text-ink font-semibold" @click="addItem">
            + Добавить позицию
          </button>
        </div>

        <div>
          <label class="text-sm text-slate">Комментарий</label>
          <textarea v-model="form.notes" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3"></textarea>
        </div>

        <p v-if="formError" class="text-sm text-coral">{{ formError }}</p>
      </section>

      <aside class="space-y-6">
        <div class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
          <h3 class="text-lg font-semibold mb-3">Данные клиента</h3>
          <div v-if="!selectedClient" class="text-slate text-sm">
            Выберите клиента, чтобы увидеть детали.
          </div>
          <div v-else class="space-y-2 text-sm">
            <div class="font-semibold">{{ selectedClient.name }}</div>
            <div>{{ selectedClient.company || "Компания не указана" }}</div>
            <div>{{ selectedClient.email || "Email не указан" }}</div>
            <div>{{ selectedClient.phone || "Телефон не указан" }}</div>
            <div>{{ selectedClient.address || "Адрес не указан" }}</div>
            <div>{{ selectedClient.taxId || "ИНН не указан" }}</div>
          </div>
        </div>

        <div class="bg-white rounded-3xl shadow-sm border border-black/5 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate">Подытог</span>
            <span class="font-semibold">{{ formatMoney(subtotal) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate">Налог, %</span>
            <input
              v-model.number="form.taxPercent"
              type="number"
              min="0"
              step="0.01"
              class="w-24 rounded-xl border border-black/10 px-3 py-2 text-right"
            />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate">Налог ({{ form.currency }})</span>
            <span class="font-semibold">{{ formatMoney(taxAmount) }}</span>
          </div>
          <div class="flex items-center justify-between text-lg">
            <span class="font-semibold">Итого</span>
            <span class="font-semibold">{{ formatMoney(totalAmount) }}</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { api } from "../api";

const router = useRouter();
const clients = ref([]);
const clientsLoading = ref(false);
const clientsError = ref("");
const templates = ref([]);
const templatesLoading = ref(false);
const templatesError = ref("");
const formError = ref("");
const autoNumberPlaceholder = ref("AUTO-INV-0001");

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

const today = new Date();
const due = new Date();
due.setDate(today.getDate() + 14);

const form = reactive({
  clientId: "",
  templateId: "",
  number: "",
  currency: "USD",
  issueDate: formatDate(today),
  dueDate: formatDate(due),
  notes: "",
  taxPercent: 0,
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
});

const selectedClient = computed(() =>
  clients.value.find((client) => client.id === form.clientId)
);

const selectedTemplate = computed(() =>
  templates.value.find((template) => template.id === form.templateId)
);

const subtotal = computed(() =>
  form.items.reduce((acc, item) => acc + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0)
);

const taxAmount = computed(() => subtotal.value * (Number(form.taxPercent || 0) / 100));

const totalAmount = computed(() => subtotal.value + taxAmount.value);

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function addItem() {
  form.items.push({ description: "", quantity: 1, unitPrice: 0 });
}

function removeItem(index) {
  form.items.splice(index, 1);
}

async function fetchClients() {
  clientsLoading.value = true;
  clientsError.value = "";
  try {
    const data = await api.listClients();
    clients.value = data.clients || [];
  } catch (err) {
    clientsError.value = err.message;
  } finally {
    clientsLoading.value = false;
  }
}

async function fetchTemplates() {
  templatesLoading.value = true;
  templatesError.value = "";
  try {
    const data = await api.listTemplates();
    templates.value = data.templates || [];
  } catch (err) {
    templatesError.value = err.message;
  } finally {
    templatesLoading.value = false;
  }
}

async function fetchAutoNumber() {
  try {
    const data = await api.getNextInvoiceNumber();
    autoNumberPlaceholder.value = data.number || autoNumberPlaceholder.value;
  } catch (_err) {
    autoNumberPlaceholder.value = "AUTO-INV-0001";
  }
}

watch(selectedTemplate, (template) => {
  if (!template) return;
  const data = template.data || {};
  form.currency = data.currency || form.currency;
  form.taxPercent = Number(data.taxPercent || 0);
  form.notes = data.notes || "";
  if (Array.isArray(data.items) && data.items.length > 0) {
    form.items = data.items.map((item) => ({
      description: item.description || "",
      quantity: Number(item.quantity || 0) || 1,
      unitPrice: Number(item.unitPrice || 0),
    }));
  }
});

async function handleSave() {
  formError.value = "";
  if (!form.clientId) {
    formError.value = "Выберите клиента.";
    return;
  }
  const filteredItems = form.items.filter((item) => item.description.trim());
  if (!filteredItems.length) {
    formError.value = "Добавьте хотя бы одну позицию.";
    return;
  }

  try {
    await api.createInvoice({
      clientId: form.clientId,
      templateId: form.templateId || null,
      number: form.number ? form.number.trim() : null,
      currency: form.currency,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      notes: form.notes || null,
      status: "draft",
      taxRate: Number(form.taxPercent || 0) / 100,
      items: filteredItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
      })),
    });
    router.push("/dashboard");
  } catch (err) {
    formError.value = err.message;
  }
}

onMounted(() => {
  fetchClients();
  fetchTemplates();
  fetchAutoNumber();
});
</script>
