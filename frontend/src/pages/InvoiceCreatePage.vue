<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">{{ isEditMode ? "Редактировать счет" : "Новый счет" }}</h1>
        <p class="text-slate">
          {{
            isEditMode
              ? "Редактирование доступно только для счетов со статусом draft."
              : "Данные клиента и шаблон подтянутся автоматически после выбора."
          }}
        </p>
      </div>
      <UiButton class-name="px-6" @click="handleSave">
        {{ isEditMode ? "Сохранить изменения" : "Сохранить счет" }}
      </UiButton>
    </header>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <UiCard class-name="space-y-6">
        <div>
          <h2 class="text-lg font-semibold mb-3">Шаблон</h2>
          <div v-if="templatesLoading" class="text-slate">Загрузка шаблонов...</div>
          <div v-else-if="templatesError" class="text-coral">{{ templatesError }}</div>
          <div v-else>
            <UiSelect id="invoice-template" v-model="form.templateId">
              <option value="">Без шаблона</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.name }}
              </option>
            </UiSelect>
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
            <UiSelect
              id="invoice-client"
              v-model="form.clientId"
              :invalid="Boolean(errors.clientId)"
              :aria-invalid="Boolean(errors.clientId)"
              :aria-describedby="errors.clientId ? 'invoice-client-error' : undefined"
            >
              <option value="">Выберите клиента</option>
              <option v-for="client in clients" :key="client.id" :value="client.id">
                {{ client.name }} — {{ client.company || "Без компании" }}
              </option>
            </UiSelect>
            <p v-if="errors.clientId" id="invoice-client-error" class="mt-1 text-xs text-coral">{{ errors.clientId }}</p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <UiLabel for="invoice-number">Номер счета</UiLabel>
            <UiInput
              id="invoice-number"
              v-model="form.number"
              :placeholder="autoNumberPlaceholder"
              class-name="mt-2"
            />
          </div>
          <div>
            <UiLabel for="invoice-currency">Валюта</UiLabel>
            <UiSelect id="invoice-currency" v-model="form.currency" class-name="mt-2">
              <option
                v-for="currencyOption in currencyOptions"
                :key="currencyOption"
                :value="currencyOption"
              >
                {{ currencyOption }}
              </option>
            </UiSelect>
          </div>
          <div>
            <UiLabel for="invoice-issue-date">Дата выставления</UiLabel>
            <input
              id="invoice-issue-date"
              v-model="form.issueDate"
              type="date"
              class="ui-field mt-2 w-full rounded-xl px-4 py-3"
            />
          </div>
          <div>
            <UiLabel for="invoice-due-date">Срок оплаты</UiLabel>
            <input
              id="invoice-due-date"
              v-model="form.dueDate"
              type="date"
              class="ui-field mt-2 w-full rounded-xl px-4 py-3"
            />
          </div>
        </div>

        <div>
          <h2 class="text-lg font-semibold mb-3">Позиции</h2>
          <div class="space-y-3">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] items-center"
            >
              <UiInput
                v-model="item.description"
                placeholder="Описание услуги"
                :aria-label="`Описание позиции ${index + 1}`"
                :invalid="Boolean(itemErrors[index]?.description)"
              />
              <input
                v-model.number="item.quantity"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Кол-во"
                :aria-label="`Количество позиции ${index + 1}`"
                :class="getInputClass(itemErrors[index]?.quantity)"
                class="ui-field w-full rounded-xl px-4 py-3"
              />
              <input
                v-model.number="item.unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Цена"
                :aria-label="`Цена позиции ${index + 1}`"
                :class="getInputClass(itemErrors[index]?.unitPrice)"
                class="ui-field w-full rounded-xl px-4 py-3"
              />
              <div class="text-right text-sm text-slate">
                {{ formatMoney(item.quantity * item.unitPrice) }}
              </div>
              <button
                v-if="form.items.length > 1"
                type="button"
                class="text-xs text-coral md:col-span-4 text-left"
                @click="removeItem(index)"
              >
                Удалить позицию
              </button>
            </div>
          </div>
          <p v-if="errors.items" class="mt-2 text-xs text-coral">{{ errors.items }}</p>
          <UiButton type="button" variant="ghost" class-name="mt-4 px-0 font-semibold text-ink" @click="addItem">
            + Добавить позицию
          </UiButton>
        </div>

        <div>
          <UiLabel for="invoice-notes">Комментарий</UiLabel>
          <UiTextarea id="invoice-notes" v-model="form.notes" class-name="mt-2" />
        </div>

        <p v-if="formError" class="text-sm text-coral">{{ formError }}</p>
      </UiCard>

      <aside class="space-y-6">
        <UiCard>
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
        </UiCard>

        <UiCard class-name="space-y-4">
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
              class="ui-field w-24 rounded-xl px-3 py-2 text-right"
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
        </UiCard>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { api } from "../api";
import { getInputClass, normalizeString, validateRequired } from "../utils/form";
import UiButton from "../components/ui/UiButton.vue";
import UiCard from "../components/ui/UiCard.vue";
import UiInput from "../components/ui/UiInput.vue";
import UiLabel from "../components/ui/UiLabel.vue";
import UiSelect from "../components/ui/UiSelect.vue";
import UiTextarea from "../components/ui/UiTextarea.vue";

const router = useRouter();
const route = useRoute();
const clients = ref([]);
const clientsLoading = ref(false);
const clientsError = ref("");
const templates = ref([]);
const templatesLoading = ref(false);
const templatesError = ref("");
const formError = ref("");
const errors = ref({ clientId: "", items: "" });
const itemErrors = ref([]);
const autoNumberPlaceholder = ref("AUTO-INV-0001");
const currencyOptions = ["USD", "EUR", "RUB"];
const currentInvoiceStatus = ref("draft");
const originalInvoiceNumber = ref("");
const templateAutofillEnabled = ref(true);
const initialTemplateId = ref("");

const invoiceId = computed(() => {
  const id = route.params.id;
  return id ? String(id) : "";
});

const isEditMode = computed(() => Boolean(invoiceId.value));

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function toDateInputValue(value) {
  return String(value || "").slice(0, 10);
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

const selectedClient = computed(() => {
  const selectedId = String(form.clientId || "");
  if (!selectedId) return null;
  return clients.value.find((client) => String(client.id) === selectedId) || null;
});

const selectedTemplate = computed(() => {
  const selectedId = String(form.templateId || "");
  if (!selectedId) return null;
  return templates.value.find((template) => String(template.id) === selectedId) || null;
});

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

async function fetchInvoiceForEdit() {
  if (!isEditMode.value) return;

  try {
    const data = await api.getInvoice(invoiceId.value);
    const invoice = data?.invoice;
    if (!invoice) {
      formError.value = "Счет не найден.";
      return;
    }

    currentInvoiceStatus.value = String(invoice.status || "draft");
    originalInvoiceNumber.value = String(invoice.number || "");
    templateAutofillEnabled.value = false;

    form.clientId = String(invoice.clientId || "");
    form.templateId = String(invoice.templateId || "");
    form.number = String(invoice.number || "");

    const normalizedCurrency = String(invoice.currency || "USD").toUpperCase();
    form.currency = currencyOptions.includes(normalizedCurrency) ? normalizedCurrency : "USD";

    form.issueDate = toDateInputValue(invoice.issueDate) || formatDate(today);
    form.dueDate = toDateInputValue(invoice.dueDate) || formatDate(due);
    form.notes = String(invoice.notes || "");

    const subtotalValue = Number(invoice.subtotal || 0);
    const taxValue = Number(invoice.tax || 0);
    form.taxPercent = subtotalValue > 0 ? Number(((taxValue / subtotalValue) * 100).toFixed(2)) : 0;

    const normalizedItems = Array.isArray(invoice.items)
      ? invoice.items.map((item) => ({
          description: String(item.description || ""),
          quantity: Number(item.quantity || 0) || 1,
          unitPrice: Number(item.unitPrice || 0),
        }))
      : [];

    form.items = normalizedItems.length ? normalizedItems : [{ description: "", quantity: 1, unitPrice: 0 }];
    initialTemplateId.value = String(form.templateId || "");
  } catch (err) {
    formError.value = err.message || "Не удалось загрузить счет для редактирования.";
  }
}

watch(
  () => form.templateId,
  (nextTemplateId) => {
    if (!isEditMode.value) return;
    if (!initialTemplateId.value) return;
    if (String(nextTemplateId || "") !== initialTemplateId.value) {
      templateAutofillEnabled.value = true;
    }
  }
);

watch(selectedTemplate, (template) => {
  if (!template) return;
  if (isEditMode.value && !templateAutofillEnabled.value) return;

  const data = template.data || {};
  const templateCurrency = normalizeString(data.currency).toUpperCase();
  form.currency = currencyOptions.includes(templateCurrency) ? templateCurrency : "USD";
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
  errors.value = { clientId: "", items: "" };
  itemErrors.value = [];

  errors.value.clientId = validateRequired(form.clientId);

  const filteredItems = form.items.filter((item) => normalizeString(item.description));

  form.items.forEach((item, index) => {
    const itemError = { description: "", quantity: "", unitPrice: "" };
    if (!normalizeString(item.description)) itemError.description = "Заполните описание.";
    if (!item.quantity || Number(item.quantity) <= 0) itemError.quantity = "Укажите количество.";
    if (Number(item.unitPrice) < 0) itemError.unitPrice = "Цена не может быть отрицательной.";
    itemErrors.value[index] = itemError;
  });

  const hasItemErrors = itemErrors.value.some(
    (item) => item.description || item.quantity || item.unitPrice
  );

  if (!filteredItems.length) {
    errors.value.items = "Добавьте хотя бы одну позицию.";
  } else if (hasItemErrors) {
    errors.value.items = "Заполните обязательные поля в позициях.";
  }

  if (errors.value.clientId || errors.value.items) {
    return;
  }

  const payload = {
    clientId: selectedClient.value?.id ?? form.clientId,
    templateId: form.templateId || null,
    currency: currencyOptions.includes(form.currency) ? form.currency : "USD",
    issueDate: form.issueDate,
    dueDate: form.dueDate,
    notes: normalizeString(form.notes) || null,
    taxRate: Number(form.taxPercent || 0) / 100,
    items: filteredItems.map((item) => ({
      description: normalizeString(item.description),
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
    })),
  };

  try {
    if (isEditMode.value) {
      if (currentInvoiceStatus.value !== "draft") {
        formError.value = "Редактировать можно только счета со статусом draft.";
        return;
      }

      const normalizedNumber = normalizeString(form.number) || originalInvoiceNumber.value;
      if (!normalizedNumber) {
        formError.value = "Укажите номер счета.";
        return;
      }

      const updated = await api.updateInvoice(invoiceId.value, {
        ...payload,
        number: normalizedNumber,
        status: currentInvoiceStatus.value,
      });

      const updatedNumber = updated?.invoice?.number || normalizedNumber;
      sessionStorage.setItem("invoice_updated", updatedNumber);
      router.push("/dashboard");
      return;
    }

    const created = await api.createInvoice({
      ...payload,
      number: normalizeString(form.number) || null,
      status: "draft",
    });

    const createdNumber = created?.invoice?.number;
    if (createdNumber) {
      sessionStorage.setItem("invoice_created", createdNumber);
    } else {
      sessionStorage.setItem("invoice_created", "Счет создан");
    }
    router.push("/dashboard");
  } catch (err) {
    formError.value = err.message;
  }
}

onMounted(async () => {
  await Promise.all([fetchClients(), fetchTemplates()]);

  if (isEditMode.value) {
    await fetchInvoiceForEdit();
    return;
  }

  fetchAutoNumber();
});
</script>
