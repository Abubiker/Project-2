<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <header class="flex items-center justify-between">
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
          v-for="invoice in invoices"
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
          </div>
        </div>

        <div v-if="invoices.length === 0" class="text-slate text-sm">
          Пока нет счетов. Создайте первый счет, чтобы начать.
        </div>
      </div>
      <div v-if="actionMessage" class="mt-4 text-sm text-slate">{{ actionMessage }}</div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { api, getToken } from "../api";

const invoices = ref([]);
const loading = ref(false);
const error = ref("");
const actionMessage = ref("");

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

onMounted(async () => {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.listInvoices();
    invoices.value = data.invoices || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

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
</script>
