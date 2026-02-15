<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <header class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Мои счета</h1>
        <p class="text-slate">Все ваши счета в одном месте.</p>
      </div>
      <RouterLink
        to="/invoices/new"
        class="rounded-xl bg-ink text-white px-4 py-2 text-sm font-semibold"
      >
        Создать счет
      </RouterLink>
    </header>

    <section class="liquid-glass-surface liquid-glass-card p-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          class="rounded-full border px-4 py-2 text-xs font-semibold"
          :class="statusFilter === option.value ? 'border-ink text-ink' : 'border-black/10 text-slate'"
          @click="statusFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="ui-stagger grid gap-6 lg:grid-cols-3">
      <div class="liquid-glass-surface liquid-glass-card p-6">
        <div class="text-sm text-slate">Счетов</div>
        <div class="text-3xl font-semibold">{{ invoices.length }}</div>
      </div>
      <div class="liquid-glass-surface liquid-glass-card p-6">
        <div class="text-sm text-slate">Статус</div>
        <div class="text-3xl font-semibold">{{ statusSummary }}</div>
      </div>
      <div class="liquid-glass-surface liquid-glass-card p-6">
        <div class="text-sm text-slate">Сумма по валютам</div>
        <div class="mt-3 space-y-2">
          <div
            v-for="currency in supportedCurrencies"
            :key="currency"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-slate">{{ currency }}</span>
            <span class="font-semibold">{{ totalsByCurrency[currency] }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="liquid-glass-surface liquid-glass-card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Список счетов</h2>
        <span v-if="selectedCount > 0" class="text-sm text-slate">Выбрано: {{ selectedCount }}</span>
      </div>

      <div v-if="loading" class="text-slate">Загрузка...</div>
      <div v-else-if="error" class="text-coral">{{ error }}</div>

      <div v-else class="space-y-3">
        <div
          v-if="filteredInvoices.length > 0"
          class="mb-3 flex flex-col gap-3 rounded-2xl border border-black/10 p-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <label class="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              class="h-4 w-4 accent-ink"
              :checked="allFilteredSelected"
              @change="toggleSelectAllFiltered"
            />
            Выбрать все в текущем фильтре
          </label>

          <div class="flex flex-wrap items-center gap-2">
            <select v-model="bulkStatus" class="ui-field rounded-xl px-3 py-2 text-sm">
              <option v-for="option in invoiceStatusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <button
              type="button"
              class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold disabled:opacity-50"
              :disabled="bulkActionDisabled"
              @click="applyBulkStatus"
            >
              Сменить статус
            </button>
            <button
              type="button"
              class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold disabled:opacity-50"
              :disabled="bulkActionDisabled"
              @click="bulkSendEmail"
            >
              Массово Email
            </button>
            <button
              type="button"
              class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold disabled:opacity-50"
              :disabled="bulkActionDisabled"
              @click="bulkDownloadPdf"
            >
              Массово PDF
            </button>
            <button
              type="button"
              class="rounded-full border border-coral/40 px-3 py-2 text-xs font-semibold text-coral disabled:opacity-50"
              :disabled="bulkActionDisabled"
              @click="bulkDeleteInvoices"
            >
              Массово удалить
            </button>
          </div>
        </div>

        <div
          v-for="invoice in filteredInvoices"
          :key="invoice.id"
          class="flex flex-col gap-3 border border-black/5 rounded-2xl p-4 md:flex-row md:items-center md:justify-between"
        >
          <div class="flex flex-1 items-start gap-3">
            <input
              type="checkbox"
              class="mt-1 h-4 w-4 accent-ink"
              :checked="isSelected(invoice.id)"
              :aria-label="`Выбрать счет ${invoice.number}`"
              @change="toggleSelect(invoice.id)"
            />
            <div>
              <button
                type="button"
                class="text-left font-semibold hover:underline"
                :aria-label="`Открыть детали счета ${invoice.number}`"
                @click="openInvoicePreview(invoice)"
              >
                {{ invoice.number }} · {{ invoice.clientName }}
              </button>
              <div class="text-sm text-slate">{{ invoice.issueDate }} → {{ invoice.dueDate }}</div>
            </div>
          </div>

          <div class="flex items-center gap-3 md:justify-end">
            <div class="text-right">
              <div class="font-semibold">{{ invoice.total }} {{ invoice.currency }}</div>
              <span
                class="mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase"
                :class="statusBadgeClass(invoice.status)"
              >
                {{ statusLabel(invoice.status) }}
              </span>
            </div>

            <div class="relative" data-invoice-menu>
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-lg leading-none"
                :aria-label="`Действия для счета ${invoice.number}`"
                @click.stop="toggleRowMenu(invoice.id)"
              >
                ⋯
              </button>

              <div
                v-if="activeMenuInvoiceId === invoice.id"
                class="liquid-glass-surface invoice-actions-menu z-20 w-52 rounded-xl p-2 shadow-lg"
                @click.stop
              >
                <div class="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate">Сменить статус</div>
                <button
                  v-for="option in invoiceStatusOptions"
                  :key="`${invoice.id}-${option.value}`"
                  type="button"
                  class="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-black/5"
                  @click="changeSingleStatus(invoice, option.value)"
                >
                  {{ option.label }}
                </button>

                <div class="my-2 border-t border-black/10"></div>

                <button
                  type="button"
                  class="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-black/5"
                  @click="openInvoicePreview(invoice)"
                >
                  Открыть
                </button>

                <button
                  type="button"
                  class="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-black/5"
                  @click="downloadPdf(invoice)"
                >
                  Скачать PDF
                </button>
                <button
                  type="button"
                  class="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-black/5"
                  @click="sendEmail(invoice)"
                >
                  Отправить Email
                </button>
                <button
                  v-if="invoice.status === 'draft'"
                  type="button"
                  class="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-black/5"
                  @click="editDraftInvoice(invoice)"
                >
                  Редактировать draft
                </button>
                <button
                  type="button"
                  class="w-full rounded-lg px-2 py-1.5 text-left text-sm text-coral hover:bg-coral/10"
                  @click="deleteInvoice(invoice)"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="invoices.length === 0" class="text-slate text-sm">
          Пока нет счетов. Создайте первый счет, чтобы начать.
        </div>
        <div v-else-if="filteredInvoices.length === 0" class="text-slate text-sm">
          Нет счетов по выбранным фильтрам.
        </div>
      </div>

      <div v-if="actionMessage" class="mt-4 text-sm text-slate">{{ actionMessage }}</div>
    </section>

    <div
      v-if="previewState.open"
      class="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      @click.self="closeInvoicePreview"
    >
      <div class="liquid-glass-surface w-full max-w-2xl rounded-3xl p-6 shadow-lg">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-semibold">{{ previewState.base?.number || "Счет" }}</h3>
            <p class="text-sm text-slate">
              {{ previewState.base?.clientName || "Клиент не указан" }} · {{ statusLabel(previewState.base?.status) }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="previewState.base?.status === 'draft'"
              type="button"
              class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold"
              @click="editDraftInvoice(previewState.base)"
            >
              Редактировать
            </button>
            <button
              type="button"
              class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold"
              @click="closeInvoicePreview"
            >
              Закрыть
            </button>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-xs font-semibold"
            :class="previewState.tab === 'details' ? 'border-ink text-ink' : 'border-black/10 text-slate'"
            @click="previewState.tab = 'details'"
          >
            Детали
          </button>
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-xs font-semibold"
            :class="previewState.tab === 'payments' ? 'border-ink text-ink' : 'border-black/10 text-slate'"
            @click="previewState.tab = 'payments'"
          >
            Оплаты
          </button>
        </div>

        <div v-if="previewState.loading" class="text-sm text-slate">Загрузка счета...</div>
        <div v-else-if="previewState.error" class="text-sm text-coral">{{ previewState.error }}</div>
        <div v-else-if="previewState.details && previewState.tab === 'details'" class="space-y-5">
          <div class="grid gap-3 sm:grid-cols-2 text-sm">
            <div><span class="text-slate">Номер:</span> {{ previewState.details.number }}</div>
            <div><span class="text-slate">Статус:</span> {{ statusLabel(previewState.details.status) }}</div>
            <div><span class="text-slate">Валюта:</span> {{ previewState.details.currency }}</div>
            <div><span class="text-slate">Период:</span> {{ previewState.details.issueDate }} → {{ previewState.details.dueDate }}</div>
          </div>

          <div>
            <div class="mb-2 text-sm font-semibold">Позиции</div>
            <div v-if="!previewState.details.items?.length" class="text-sm text-slate">Нет позиций.</div>
            <div v-else class="space-y-2">
              <div
                v-for="item in previewState.details.items"
                :key="item.id"
                class="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2 text-sm"
              >
                <div>{{ item.description }} · {{ item.quantity }} × {{ item.unitPrice }}</div>
                <div class="font-semibold">{{ item.amount }}</div>
              </div>
            </div>
          </div>

          <div class="grid gap-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate">Подытог</span>
              <span class="font-semibold">{{ previewState.details.subtotal }} {{ previewState.details.currency }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate">Налог</span>
              <span class="font-semibold">{{ previewState.details.tax }} {{ previewState.details.currency }}</span>
            </div>
            <div class="flex items-center justify-between text-base">
              <span class="font-semibold">Итого</span>
              <span class="font-semibold">{{ previewState.details.total }} {{ previewState.details.currency }}</span>
            </div>
            <div v-if="previewState.details.notes" class="mt-1 rounded-xl border border-black/10 p-3">
              <div class="text-xs text-slate mb-1">Комментарий</div>
              <div class="text-sm">{{ previewState.details.notes }}</div>
            </div>
          </div>
        </div>

        <div v-else-if="previewState.details && previewState.tab === 'payments'" class="space-y-5">
          <div class="grid gap-3 sm:grid-cols-3 text-sm">
            <div class="rounded-2xl border border-black/10 p-3">
              <div class="text-xs text-slate mb-1">Итого</div>
              <div class="text-lg font-semibold">
                {{ previewState.balance?.total ?? previewState.details.total }} {{ previewState.details.currency }}
              </div>
            </div>
            <div class="rounded-2xl border border-black/10 p-3">
              <div class="text-xs text-slate mb-1">Оплачено</div>
              <div class="text-lg font-semibold">
                {{ previewState.balance?.paid ?? 0 }} {{ previewState.details.currency }}
              </div>
            </div>
            <div class="rounded-2xl border border-black/10 p-3">
              <div class="text-xs text-slate mb-1">Остаток</div>
              <div class="text-lg font-semibold">
                {{ previewState.balance?.balance ?? previewState.details.total }} {{ previewState.details.currency }}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm font-semibold">Платежи</div>
            <button
              type="button"
              class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold"
              @click="togglePaymentForm"
            >
              {{ previewState.addPaymentOpen ? "Закрыть" : "Добавить оплату" }}
            </button>
          </div>

          <div v-if="previewState.addPaymentOpen" class="rounded-2xl border border-black/10 p-4 space-y-3">
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="text-xs text-slate">Сумма</label>
                <input
                  v-model="previewState.addPaymentForm.amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  class="ui-field mt-2 w-full rounded-xl px-4 py-3"
                />
              </div>
              <div>
                <label class="text-xs text-slate">Дата оплаты</label>
                <input
                  v-model="previewState.addPaymentForm.paidAt"
                  type="date"
                  class="ui-field mt-2 w-full rounded-xl px-4 py-3"
                />
              </div>
              <div>
                <label class="text-xs text-slate">Способ</label>
                <input
                  v-model="previewState.addPaymentForm.method"
                  type="text"
                  placeholder="Наличные/Карта/Stripe"
                  class="ui-field mt-2 w-full rounded-xl px-4 py-3"
                />
              </div>
              <div>
                <label class="text-xs text-slate">Комментарий</label>
                <input
                  v-model="previewState.addPaymentForm.note"
                  type="text"
                  placeholder="ID транзакции"
                  class="ui-field mt-2 w-full rounded-xl px-4 py-3"
                />
              </div>
            </div>
            <div v-if="previewState.addPaymentError" class="text-xs text-coral">{{ previewState.addPaymentError }}</div>
            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                class="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold"
                @click="togglePaymentForm"
              >
                Отмена
              </button>
              <button
                type="button"
                class="rounded-full bg-ink text-white px-4 py-2 text-xs font-semibold disabled:opacity-60"
                :disabled="previewState.addPaymentLoading"
                @click="addPayment"
              >
                {{ previewState.addPaymentLoading ? "Сохраняем..." : "Сохранить оплату" }}
              </button>
            </div>
          </div>

          <div v-if="previewState.payments.length === 0" class="text-sm text-slate">
            Пока нет оплат.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="payment in previewState.payments"
              :key="payment.id"
              class="flex flex-col gap-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
            >
              <div class="flex items-center justify-between">
                <div class="font-semibold">
                  {{ payment.amount }} {{ payment.currency || previewState.details.currency }}
                </div>
                <div class="text-xs text-slate">{{ payment.paidAt?.slice(0, 10) || payment.createdAt?.slice(0, 10) }}</div>
              </div>
              <div class="text-xs text-slate">
                {{ payment.method || "manual" }} · {{ payment.note || "Без комментария" }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { api, getToken } from "../api";
import { pushToast } from "../toast";

const router = useRouter();
const invoices = ref([]);
const loading = ref(false);
const error = ref("");
const actionMessage = ref("");
const statusFilter = ref("all");
const activeMenuInvoiceId = ref("");
const selectedIds = ref([]);
const bulkStatus = ref("draft");
const bulkBusy = ref(false);
const previewState = ref({
  open: false,
  loading: false,
  error: "",
  base: null,
  details: null,
  payments: [],
  balance: null,
  tab: "details",
  addPaymentOpen: false,
  addPaymentLoading: false,
  addPaymentError: "",
  addPaymentForm: {
    amount: "",
    paidAt: "",
    method: "",
    note: "",
  },
});

const invoiceStatusOptions = [
  { value: "draft", label: "Черновик" },
  { value: "sent", label: "Отправлен" },
  { value: "paid", label: "Оплачен" },
  { value: "overdue", label: "Просрочен" },
];

const statusOptions = [
  { value: "all", label: "Все" },
  ...invoiceStatusOptions,
];

const supportedCurrencies = ["USD", "EUR", "RUB"];

const selectedSet = computed(() => new Set(selectedIds.value));

const selectedCount = computed(() => selectedIds.value.length);

const bulkActionDisabled = computed(() => selectedCount.value === 0 || bulkBusy.value);

const totalsByCurrency = computed(() => {
  const initialTotals = supportedCurrencies.reduce((acc, currency) => {
    acc[currency] = "0.00";
    return acc;
  }, {});

  const rawTotals = invoices.value.reduce((acc, invoice) => {
    const currency = String(invoice.currency || "").toUpperCase();
    if (!supportedCurrencies.includes(currency)) {
      return acc;
    }
    acc[currency] = (acc[currency] || 0) + Number(invoice.total || 0);
    return acc;
  }, {});

  supportedCurrencies.forEach((currency) => {
    const totalValue = Number(rawTotals[currency] || 0);
    initialTotals[currency] = totalValue.toFixed(2);
  });

  return initialTotals;
});

const statusSummary = computed(() => {
  if (invoices.value.length === 0) return "—";
  const counts = invoices.value.reduce((acc, invoice) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (${top[1]})` : "—";
});

const filteredInvoices = computed(() => {
  return invoices.value.filter((invoice) => {
    return statusFilter.value === "all" || invoice.status === statusFilter.value;
  });
});

const allFilteredSelected = computed(() => {
  if (!filteredInvoices.value.length) return false;
  return filteredInvoices.value.every((invoice) => selectedSet.value.has(invoice.id));
});

const selectedInvoices = computed(() => {
  return invoices.value.filter((invoice) => selectedSet.value.has(invoice.id));
});

function statusLabel(status) {
  if (!status) return "—";
  const option = invoiceStatusOptions.find((item) => item.value === status);
  return option?.label || status;
}

function statusBadgeClass(status) {
  if (status === "paid") return "bg-mint/20 text-mint";
  if (status === "sent") return "bg-sky-500/20 text-sky-600";
  if (status === "overdue") return "bg-coral/20 text-coral";
  return "bg-black/10 text-slate";
}

function isSelected(id) {
  return selectedSet.value.has(id);
}

function toggleSelect(id) {
  if (selectedSet.value.has(id)) {
    selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id);
    return;
  }
  selectedIds.value = [...selectedIds.value, id];
}

function toggleSelectAllFiltered() {
  const filteredIds = filteredInvoices.value.map((invoice) => invoice.id);
  if (allFilteredSelected.value) {
    selectedIds.value = selectedIds.value.filter((id) => !filteredIds.includes(id));
    return;
  }
  selectedIds.value = Array.from(new Set([...selectedIds.value, ...filteredIds]));
}

function closeMenu() {
  activeMenuInvoiceId.value = "";
}

function toggleRowMenu(invoiceId) {
  activeMenuInvoiceId.value = activeMenuInvoiceId.value === invoiceId ? "" : invoiceId;
}

function closeInvoicePreview() {
  previewState.value = {
    open: false,
    loading: false,
    error: "",
    base: null,
    details: null,
    payments: [],
    balance: null,
    tab: "details",
    addPaymentOpen: false,
    addPaymentLoading: false,
    addPaymentError: "",
    addPaymentForm: {
      amount: "",
      paidAt: "",
      method: "",
      note: "",
    },
  };
}

function editDraftInvoice(invoice) {
  if (!invoice || invoice.status !== "draft") {
    pushToast({ message: "Редактировать можно только счета со статусом draft", tone: "danger" });
    return;
  }
  closeMenu();
  closeInvoicePreview();
  router.push(`/invoices/${invoice.id}/edit`);
}

async function openInvoicePreview(invoice) {
  if (!invoice?.id) return;

  closeMenu();
  previewState.value = {
    open: true,
    loading: true,
    error: "",
    base: invoice,
    details: null,
    payments: [],
    balance: null,
    tab: "details",
    addPaymentOpen: false,
    addPaymentLoading: false,
    addPaymentError: "",
    addPaymentForm: {
      amount: "",
      paidAt: "",
      method: "",
      note: "",
    },
  };

  try {
    const [invoiceData, paymentData] = await Promise.all([
      api.getInvoice(invoice.id),
      api.listInvoicePayments(invoice.id),
    ]);
    previewState.value = {
      ...previewState.value,
      loading: false,
      details: invoiceData?.invoice || null,
      payments: paymentData?.payments || [],
      balance: paymentData?.balance || null,
    };
  } catch (err) {
    previewState.value = {
      ...previewState.value,
      loading: false,
      error: err.message || "Не удалось загрузить счет.",
    };
  }
}

function togglePaymentForm() {
  previewState.value.addPaymentOpen = !previewState.value.addPaymentOpen;
  previewState.value.addPaymentError = "";
}

function resetPaymentForm() {
  previewState.value.addPaymentForm = {
    amount: "",
    paidAt: "",
    method: "",
    note: "",
  };
  previewState.value.addPaymentError = "";
}

async function addPayment() {
  if (!previewState.value.details?.id) return;

  const amountValue = Number(previewState.value.addPaymentForm.amount);
  if (!amountValue || amountValue <= 0) {
    previewState.value.addPaymentError = "Введите сумму оплаты.";
    return;
  }

  previewState.value.addPaymentLoading = true;
  previewState.value.addPaymentError = "";

  try {
    const payload = {
      amount: amountValue,
      paidAt: previewState.value.addPaymentForm.paidAt || undefined,
      method: previewState.value.addPaymentForm.method || undefined,
      note: previewState.value.addPaymentForm.note || undefined,
      status: "completed",
    };

    const response = await api.createInvoicePayment(previewState.value.details.id, payload);
    previewState.value.payments = [response.payment, ...previewState.value.payments];
    previewState.value.balance = response.balance || previewState.value.balance;
    resetPaymentForm();
    previewState.value.addPaymentOpen = false;
    pushToast({ message: "Оплата добавлена", tone: "success" });
  } catch (err) {
    previewState.value.addPaymentError = err.message || "Не удалось добавить оплату.";
    pushToast({ message: err.message || "Ошибка добавления оплаты", tone: "danger" });
  } finally {
    previewState.value.addPaymentLoading = false;
  }
}

function handleDocumentClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest("[data-invoice-menu]")) {
    closeMenu();
  }
}

function updateLocalStatus(invoiceId, status) {
  const target = invoices.value.find((invoice) => invoice.id === invoiceId);
  if (!target) return;
  target.status = status;
}

function removeInvoicesFromList(ids) {
  const idsSet = new Set(ids);
  invoices.value = invoices.value.filter((invoice) => !idsSet.has(invoice.id));
  selectedIds.value = selectedIds.value.filter((id) => !idsSet.has(id));
}

async function downloadPdf(invoice, { silent = false } = {}) {
  actionMessage.value = "";
  if (!silent) closeMenu();
  try {
    const token = getToken();
    const res = await fetch(`/api/invoices/${invoice.id}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "PDF download failed");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.number}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    if (!silent) {
      pushToast({ message: `PDF ${invoice.number} скачан`, tone: "success" });
    }
    return true;
  } catch (err) {
    actionMessage.value = err.message;
    if (!silent) {
      pushToast({ message: err.message || "Ошибка скачивания PDF", tone: "danger" });
    }
    return false;
  }
}

async function sendEmail(invoice, { useDefaultRecipient = false, silent = false } = {}) {
  actionMessage.value = "";
  if (!silent) closeMenu();
  let to = "";
  if (!useDefaultRecipient) {
    const promptValue = window.prompt("Email получателя (оставьте пустым = email клиента):", "");
    if (promptValue === null) return false;
    to = promptValue;
  }
  try {
    await api.sendInvoiceEmail(invoice.id, to ? { to } : {});
    if (!silent) {
      pushToast({ message: `Счет ${invoice.number} отправлен`, tone: "success" });
    }
    return true;
  } catch (err) {
    actionMessage.value = err.message;
    if (!silent) {
      pushToast({ message: err.message || "Ошибка отправки email", tone: "danger" });
    }
    return false;
  }
}

async function changeSingleStatus(invoice, status) {
  try {
    await api.updateInvoiceStatus(invoice.id, status);
    updateLocalStatus(invoice.id, status);
    pushToast({ message: `Статус счета ${invoice.number} обновлен`, tone: "success" });
    closeMenu();
  } catch (err) {
    actionMessage.value = err.message;
    pushToast({ message: err.message || "Ошибка обновления статуса", tone: "danger" });
  }
}

async function deleteInvoice(invoice, { skipConfirm = false, silent = false } = {}) {
  if (!skipConfirm) {
    const confirmDelete = window.confirm(`Удалить счет ${invoice.number}?`);
    if (!confirmDelete) return false;
  }
  try {
    await api.deleteInvoice(invoice.id);
    removeInvoicesFromList([invoice.id]);
    closeMenu();
    if (!silent) {
      pushToast({ message: "Счет удален", tone: "danger" });
    }
    return true;
  } catch (err) {
    actionMessage.value = err.message;
    if (!silent) {
      pushToast({ message: err.message || "Ошибка удаления счета", tone: "danger" });
    }
    return false;
  }
}

async function applyBulkStatus() {
  if (bulkActionDisabled.value) return;

  bulkBusy.value = true;
  const targets = [...selectedInvoices.value];

  try {
    const response = await api.bulkUpdateInvoiceStatus(
      targets.map((invoice) => invoice.id),
      bulkStatus.value
    );
    const updatedIds = response?.invoices?.map((row) => row.id) || [];
    updatedIds.forEach((id) => updateLocalStatus(id, bulkStatus.value));
    pushToast({ message: `Статус обновлен для ${updatedIds.length} счетов`, tone: "success" });
  } catch (err) {
    pushToast({ message: err.message || "Ошибка массового обновления", tone: "danger" });
  } finally {
    bulkBusy.value = false;
    closeMenu();
  }
}

async function bulkSendEmail() {
  if (bulkActionDisabled.value) return;

  const confirmSend = window.confirm(`Отправить ${selectedCount.value} счетов на email клиентов?`);
  if (!confirmSend) return;

  bulkBusy.value = true;
  try {
    const response = await api.bulkSendInvoiceEmail(
      selectedInvoices.value.map((invoice) => invoice.id)
    );
    pushToast({ message: `Отправлено ${response?.sent || 0} счетов`, tone: "success" });
    if (response?.failed) {
      pushToast({ message: `Ошибок отправки: ${response.failed}`, tone: "danger" });
    }
  } catch (err) {
    pushToast({ message: err.message || "Ошибка массовой отправки", tone: "danger" });
  } finally {
    bulkBusy.value = false;
  }
}

async function bulkDownloadPdf() {
  if (bulkActionDisabled.value) return;

  bulkBusy.value = true;
  try {
    const response = await api.bulkDownloadPdf(
      selectedInvoices.value.map((invoice) => invoice.id)
    );
    const files = response?.files || [];

    for (const file of files) {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${file.pdfBase64}`;
      link.download = `${file.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    pushToast({ message: `Скачано ${files.length} PDF`, tone: "success" });
  } catch (err) {
    pushToast({ message: err.message || "Ошибка массового скачивания", tone: "danger" });
  } finally {
    bulkBusy.value = false;
  }
}

async function bulkDeleteInvoices() {
  if (bulkActionDisabled.value) return;

  const confirmDelete = window.confirm(`Удалить выбранные счета (${selectedCount.value})?`);
  if (!confirmDelete) return;

  bulkBusy.value = true;
  try {
    const response = await api.bulkDeleteInvoices(
      selectedInvoices.value.map((invoice) => invoice.id)
    );
    const removedIds = response?.invoiceIds || [];
    removeInvoicesFromList(removedIds);
    pushToast({ message: `Удалено ${removedIds.length} счетов`, tone: "success" });
  } catch (err) {
    pushToast({ message: err.message || "Ошибка массового удаления", tone: "danger" });
  } finally {
    bulkBusy.value = false;
    closeMenu();
  }
}

watch(invoices, () => {
  const existingIds = new Set(invoices.value.map((invoice) => invoice.id));
  selectedIds.value = selectedIds.value.filter((id) => existingIds.has(id));
  if (activeMenuInvoiceId.value && !existingIds.has(activeMenuInvoiceId.value)) {
    activeMenuInvoiceId.value = "";
  }
  if (previewState.value.base?.id && !existingIds.has(previewState.value.base.id)) {
    closeInvoicePreview();
  }
});

watch(statusFilter, () => {
  closeMenu();
});

onMounted(async () => {
  loading.value = true;
  error.value = "";
  document.addEventListener("click", handleDocumentClick);

  const createdNumber = sessionStorage.getItem("invoice_created");
  if (createdNumber) {
    pushToast({
      message: "Счет создан",
      tone: "success",
    });
    sessionStorage.removeItem("invoice_created");
  }
  const updatedNumber = sessionStorage.getItem("invoice_updated");
  if (updatedNumber) {
    pushToast({
      message: "Счет обновлен",
      tone: "success",
    });
    sessionStorage.removeItem("invoice_updated");
  }

  try {
    const [invoicesData] = await Promise.all([api.listInvoices()]);
    invoices.value = invoicesData.invoices || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>
