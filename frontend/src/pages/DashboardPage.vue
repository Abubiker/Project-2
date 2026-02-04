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

    <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
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
    <section class="grid gap-6 lg:grid-cols-3">
      <div class="rounded-3xl bg-white p-6 shadow-sm border border-black/5">
        <div class="text-sm text-slate">Счетов</div>
        <div class="text-3xl font-semibold">{{ invoices.length }}</div>
      </div>
      <div class="rounded-3xl bg-white p-6 shadow-sm border border-black/5">
        <div class="text-sm text-slate">Статус</div>
        <div class="text-3xl font-semibold">{{ statusSummary }}</div>
      </div>
      <div class="rounded-3xl bg-white p-6 shadow-sm border border-black/5">
        <div class="text-sm text-slate">Сумма (USD)</div>
        <div class="text-3xl font-semibold">{{ totalAmount }}</div>
      </div>
    </section>


    <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Список счетов</h2>
      </div>

      <div v-if="loading" class="text-slate">Загрузка...</div>
      <div v-else-if="error" class="text-coral">{{ error }}</div>

      <div v-else class="space-y-3">
        <div
          v-for="invoice in filteredInvoices"
          :key="invoice.id"
          class="flex flex-col gap-3 border border-black/5 rounded-2xl p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div class="font-semibold">{{ invoice.number }} · {{ invoice.clientName }}</div>
            <div class="text-sm text-slate">{{ invoice.issueDate }} → {{ invoice.dueDate }}</div>
          </div>
          <div class="flex items-center gap-3 md:justify-end">
            <div class="text-right">
              <div class="font-semibold">{{ invoice.total }} {{ invoice.currency }}</div>
              <div class="text-xs uppercase text-slate">{{ invoice.status }}</div>
            </div>
            <button class="rounded-full border border-black/10 px-3 py-1 text-xs" @click="downloadPdf(invoice)">
              PDF
            </button>
            <button class="rounded-full border border-black/10 px-3 py-1 text-xs" @click="sendEmail(invoice)">
              Email
            </button>
            <button class="rounded-full border border-black/10 px-3 py-1 text-xs text-coral" @click="deleteInvoice(invoice)">
              Удалить
            </button>
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
  </div>

</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, getToken } from "../api";
import { pushToast } from "../toast";

const invoices = ref([]);
const loading = ref(false);
const error = ref("");
const actionMessage = ref("");
const statusFilter = ref("all");

const statusOptions = [
  { value: "all", label: "Все" },
  { value: "draft", label: "Черновик" },
  { value: "sent", label: "Отправлен" },
  { value: "paid", label: "Оплачен" },
  { value: "overdue", label: "Просрочен" },
];

const totalAmount = computed(() => {
  const sum = invoices.value.reduce((acc, invoice) => acc + Number(invoice.total || 0), 0);
  return sum.toFixed(2);
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
    const matchesStatus = statusFilter.value === "all" || invoice.status === statusFilter.value;
    if (!matchesStatus) return false;
    return true;
  });
});

onMounted(async () => {
  loading.value = true;
  error.value = "";
  const createdNumber = sessionStorage.getItem("invoice_created");
  if (createdNumber) {
    pushToast({
      message: "Счет создан",
      tone: "success",
    });
    sessionStorage.removeItem("invoice_created");
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

onUnmounted(() => {});

async function downloadPdf(invoice) {
  actionMessage.value = "";
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
  } catch (err) {
    actionMessage.value = err.message;
  }
}

async function sendEmail(invoice) {
  actionMessage.value = "";
  const to = window.prompt("Email получателя (оставьте пустым = email клиента):", "");
  if (to === null) return;
  try {
    await api.sendInvoiceEmail(invoice.id, to ? { to } : {});
    actionMessage.value = `Счет ${invoice.number} отправлен.`;
  } catch (err) {
    actionMessage.value = err.message;
  }
}

async function deleteInvoice(invoice) {
  const confirmDelete = window.confirm(`Удалить счет ${invoice.number}?`);
  if (!confirmDelete) return;
  try {
    await api.deleteInvoice(invoice.id);
    invoices.value = invoices.value.filter((item) => item.id !== invoice.id);
    pushToast({ message: "Счет удален", tone: "danger" });
  } catch (err) {
    actionMessage.value = err.message;
    pushToast({ message: err.message || "Ошибка удаления счета", tone: "danger" });
  }
}
</script>
