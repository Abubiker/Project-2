<template>
  <div class="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.2fr,1fr]">
    <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Шаблоны счетов</h2>
        <span class="text-sm text-slate">{{ templates.length }} всего</span>
      </div>

      <div v-if="loading" class="text-slate">Загрузка...</div>
      <div v-else-if="error" class="text-coral">{{ error }}</div>

      <div v-else class="space-y-3">
        <div
          v-for="template in templates"
          :key="template.id"
          class="border border-black/5 rounded-2xl p-4 flex items-start justify-between cursor-pointer hover:border-black/10"
          @click="openTemplate(template)"
        >
          <div>
            <div class="font-semibold">{{ template.name }}</div>
            <div class="text-sm text-slate">
              Валюта: {{ template.data?.currency || "USD" }} · Налог: {{ template.data?.taxPercent || 0 }}%
            </div>
          </div>
          <button class="text-xs text-coral" @click.stop="removeTemplate(template.id)">
            Удалить
          </button>
        </div>

        <div v-if="templates.length === 0" class="text-slate text-sm">
          Пока нет шаблонов. Добавьте шаблон справа.
        </div>
      </div>
    </section>

    <section class="bg-white rounded-3xl shadow-sm border border-black/5 p-6">
      <h2 class="text-xl font-semibold mb-4">Новый шаблон</h2>
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <label class="text-sm text-slate">Название</label>
          <input v-model="form.name" :class="inputClass(errors.name)" class="mt-2 w-full rounded-xl border px-4 py-3" />
          <p v-if="errors.name" class="mt-1 text-xs text-coral">{{ errors.name }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="text-sm text-slate">Валюта</label>
            <input v-model="form.currency" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
          </div>
          <div>
            <label class="text-sm text-slate">Налог, %</label>
            <input v-model.number="form.taxPercent" type="number" min="0" step="0.01" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
          </div>
        </div>
        <div>
          <label class="text-sm text-slate">Комментарий</label>
          <textarea v-model="form.notes" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3"></textarea>
        </div>

        <div>
          <label class="text-sm text-slate">Позиции по умолчанию</label>
          <div class="space-y-3 mt-2">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto] items-center"
            >
              <input v-model="item.description" placeholder="Описание" :class="inputClass(itemErrors[index]?.description)" class="rounded-xl border px-4 py-3" />
              <input v-model.number="item.quantity" type="number" min="0.01" step="0.01" placeholder="Кол-во" :class="inputClass(itemErrors[index]?.quantity)" class="rounded-xl border px-4 py-3" />
              <input v-model.number="item.unitPrice" type="number" min="0" step="0.01" placeholder="Цена" :class="inputClass(itemErrors[index]?.unitPrice)" class="rounded-xl border px-4 py-3" />
              <button
                v-if="form.items.length > 1"
                type="button"
                class="text-xs text-coral"
                @click="removeItem(index)"
              >
                Удалить
              </button>
            </div>
          </div>
          <p v-if="errors.items" class="mt-2 text-xs text-coral">{{ errors.items }}</p>
          <button type="button" class="mt-3 text-sm text-ink font-semibold" @click="addItem">
            + Добавить позицию
          </button>
        </div>

        <button class="w-full rounded-xl bg-ink text-white py-3 font-semibold">
          Сохранить шаблон
        </button>
        <p v-if="formError" class="text-sm text-coral">{{ formError }}</p>
      </form>
    </section>

    <div v-if="selectedTemplate" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" @click.self="closeModal">
      <div class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-lg">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold">{{ selectedTemplate.name }}</h3>
            <p class="text-sm text-slate">Валюта: {{ selectedTemplate.data?.currency || "USD" }}</p>
          </div>
          <button class="text-sm text-slate hover:text-ink" @click="closeModal">Закрыть</button>
        </div>
        <div class="mt-4 space-y-2 text-sm">
          <div><span class="text-slate">Налог:</span> {{ selectedTemplate.data?.taxPercent || 0 }}%</div>
          <div><span class="text-slate">Комментарий:</span> {{ selectedTemplate.data?.notes || "—" }}</div>
          <div>
            <div class="text-slate mb-1">Позиции:</div>
            <div v-if="!selectedTemplate.data?.items?.length" class="text-slate">Нет позиций</div>
            <ul v-else class="space-y-1">
              <li v-for="(item, index) in selectedTemplate.data.items" :key="index">
                {{ item.description }} — {{ item.quantity }} × {{ item.unitPrice }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="toastMessage"
    class="fixed bottom-6 right-6 z-50 rounded-2xl bg-ink text-white px-4 py-3 text-sm shadow-lg"
  >
    {{ toastMessage }}
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { api } from "../api";

const templates = ref([]);
const loading = ref(false);
const error = ref("");
const formError = ref("");
const toastMessage = ref("");
let toastTimer = null;
const errors = ref({ name: "", items: "" });
const itemErrors = ref([]);
const selectedTemplate = ref(null);

const form = reactive({
  name: "",
  currency: "USD",
  taxPercent: 0,
  notes: "",
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
});

function resetForm() {
  form.name = "";
  form.currency = "USD";
  form.taxPercent = 0;
  form.notes = "";
  form.items = [{ description: "", quantity: 1, unitPrice: 0 }];
}

function inputClass(hasError) {
  return hasError ? "border-coral focus:outline-none focus:ring-2 focus:ring-coral/40" : "border-black/10";
}

function openTemplate(template) {
  selectedTemplate.value = template;
}

function closeModal() {
  selectedTemplate.value = null;
}

function onEsc(event) {
  if (event.key === "Escape") {
    closeModal();
  }
}

async function fetchTemplates() {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.listTemplates();
    templates.value = data.templates || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function addItem() {
  form.items.push({ description: "", quantity: 1, unitPrice: 0 });
}

function removeItem(index) {
  form.items.splice(index, 1);
}

async function handleCreate() {
  formError.value = "";
  errors.value = { name: "", items: "" };
  itemErrors.value = [];
  if (!form.name.trim()) {
    errors.value.name = "Обязательно к заполнению.";
  }

  const items = form.items.filter((item) => item.description.trim());
  form.items.forEach((item, index) => {
    const itemError = { description: "", quantity: "", unitPrice: "" };
    if (!item.description.trim()) itemError.description = "Заполните описание.";
    if (!item.quantity || Number(item.quantity) <= 0) itemError.quantity = "Укажите количество.";
    if (Number(item.unitPrice) < 0) itemError.unitPrice = "Цена не может быть отрицательной.";
    itemErrors.value[index] = itemError;
  });
  const hasItemErrors = itemErrors.value.some(
    (item) => item.description || item.quantity || item.unitPrice
  );
  if (!items.length) {
    errors.value.items = "Добавьте хотя бы одну позицию.";
  } else if (hasItemErrors) {
    errors.value.items = "Заполните обязательные поля в позициях.";
  }

  if (errors.value.name || errors.value.items) {
    return;
  }

  try {
    const payload = {
      name: form.name.trim(),
      data: {
        currency: form.currency || "USD",
        taxPercent: Number(form.taxPercent || 0),
        notes: form.notes || "",
        items: items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
        })),
      },
    };
    const data = await api.createTemplate(payload);
    templates.value = [data.template, ...templates.value];
    resetForm();
    toastMessage.value = `Шаблон ${data.template.name} создан.`;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage.value = "";
    }, 3000);
  } catch (err) {
    formError.value = err.message;
  }
}

async function removeTemplate(id) {
  try {
    await api.deleteTemplate(id);
    templates.value = templates.value.filter((template) => template.id !== id);
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(() => {
  fetchTemplates();
  window.addEventListener("keydown", onEsc);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onEsc);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>
