<template>
  <div class="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.2fr,1fr]">
    <UiCard>
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
          role="button"
          tabindex="0"
          :aria-label="`Открыть шаблон ${template.name}`"
          @click="openTemplate(template)"
          @keydown="handleTemplateCardKeydown($event, template)"
        >
          <div>
            <div class="font-semibold">{{ template.name }}</div>
            <div class="text-sm text-slate">
              Валюта: {{ template.data?.currency || "USD" }} · Налог: {{ template.data?.taxPercent || 0 }}%
            </div>
          </div>
          <UiButton type="button" variant="ghost" size="sm" class-name="text-coral hover:text-coral" @click.stop="removeTemplate(template.id)">
            Удалить
          </UiButton>
        </div>

        <div v-if="templates.length === 0" class="text-slate text-sm">
          Пока нет шаблонов. Добавьте шаблон справа.
        </div>
      </div>
    </UiCard>

    <UiCard>
      <h2 class="text-xl font-semibold mb-4">Новый шаблон</h2>
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <UiLabel for="template-name">Название</UiLabel>
          <UiInput
            id="template-name"
            v-model="form.name"
            class-name="mt-2"
            :invalid="Boolean(errors.name)"
            :aria-invalid="Boolean(errors.name)"
            :aria-describedby="errors.name ? 'template-name-error' : undefined"
          />
          <p v-if="errors.name" id="template-name-error" class="mt-1 text-xs text-coral">{{ errors.name }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <UiLabel for="template-currency">Валюта</UiLabel>
            <UiInput id="template-currency" v-model="form.currency" class-name="mt-2" />
          </div>
          <div>
            <UiLabel for="template-tax-percent">Налог, %</UiLabel>
            <input id="template-tax-percent" v-model.number="form.taxPercent" type="number" min="0" step="0.01" class="mt-2 w-full rounded-xl border border-black/10 px-4 py-3" />
          </div>
        </div>
        <div>
          <UiLabel for="template-notes">Комментарий</UiLabel>
          <UiTextarea id="template-notes" v-model="form.notes" class-name="mt-2" />
        </div>

        <div>
          <label class="text-sm text-slate">Позиции по умолчанию</label>
          <div class="mt-3 grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto] text-xs text-slate">
            <div>Описание</div>
            <div>Кол-во</div>
            <div>Цена</div>
            <div></div>
          </div>
          <div class="space-y-3 mt-2">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="grid gap-3 md:grid-cols-[2fr,1fr,1fr,auto] items-center"
            >
              <UiInput
                v-model="item.description"
                :aria-label="`Описание позиции ${index + 1}`"
                placeholder="Описание"
                :invalid="Boolean(itemErrors[index]?.description)"
              />
              <input
                v-model.number="item.quantity"
                type="number"
                min="0.01"
                step="0.01"
                :aria-label="`Количество позиции ${index + 1}`"
                placeholder="Кол-во"
                :class="getInputClass(itemErrors[index]?.quantity)"
                class="rounded-xl border px-4 py-3"
              />
              <input
                v-model.number="item.unitPrice"
                type="number"
                min="0"
                step="0.01"
                :aria-label="`Цена позиции ${index + 1}`"
                placeholder="Цена"
                :class="getInputClass(itemErrors[index]?.unitPrice)"
                class="rounded-xl border px-4 py-3"
              />
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
          <UiButton type="button" variant="ghost" class-name="mt-3 px-0 font-semibold text-ink" @click="addItem">
            + Добавить позицию
          </UiButton>
        </div>

        <UiButton type="submit" class-name="w-full">
          Сохранить шаблон
        </UiButton>
        <p v-if="formError" class="text-sm text-coral">{{ formError }}</p>
      </form>
    </UiCard>

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

</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { api } from "../api";
import { pushToast } from "../toast";
import { getInputClass, normalizeString, validateRequired } from "../utils/form";
import UiButton from "../components/ui/UiButton.vue";
import UiCard from "../components/ui/UiCard.vue";
import UiInput from "../components/ui/UiInput.vue";
import UiLabel from "../components/ui/UiLabel.vue";
import UiTextarea from "../components/ui/UiTextarea.vue";

const templates = ref([]);
const loading = ref(false);
const error = ref("");
const formError = ref("");
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

function openTemplate(template) {
  selectedTemplate.value = template;
}

function handleTemplateCardKeydown(event, template) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openTemplate(template);
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
  errors.value.name = validateRequired(form.name);

  const items = form.items.filter((item) => normalizeString(item.description));
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
      name: normalizeString(form.name),
      data: {
        currency: normalizeString(form.currency) || "USD",
        taxPercent: Number(form.taxPercent || 0),
        notes: normalizeString(form.notes),
        items: items.map((item) => ({
          description: normalizeString(item.description),
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
        })),
      },
    };
    const data = await api.createTemplate(payload);
    templates.value = [data.template, ...templates.value];
    resetForm();
    pushToast({ message: "Шаблон создан", tone: "success" });
  } catch (err) {
    formError.value = err.message;
    pushToast({ message: err.message || "Ошибка создания шаблона", tone: "danger" });
  }
}

async function removeTemplate(id) {
  try {
    await api.deleteTemplate(id);
    const removed = templates.value.find((template) => template.id === id);
    templates.value = templates.value.filter((template) => template.id !== id);
    if (removed) {
      pushToast({ message: "Шаблон удален", tone: "danger" });
    }
  } catch (err) {
    error.value = err.message;
    pushToast({ message: err.message || "Ошибка удаления шаблона", tone: "danger" });
  }
}

onMounted(() => {
  fetchTemplates();
  window.addEventListener("keydown", onEsc);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onEsc);
});
</script>
