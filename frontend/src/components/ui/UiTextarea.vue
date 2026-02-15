<template>
  <textarea :value="modelValue" :class="resolvedClass" @input="handleInput" v-bind="$attrs"></textarea>
</template>

<script setup>
import { computed } from "vue";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  invalid: { type: Boolean, default: false },
  className: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const textareaVariants = cva(
  "ui-field min-h-[96px] w-full rounded-xl px-4 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2",
  {
    variants: {
      invalid: {
        true: "border-coral bg-coral/10 focus-visible:ring-coral/40",
        false: "border-[color:var(--field-border)] focus-visible:ring-[color:var(--field-focus-ring)]",
      },
    },
    defaultVariants: {
      invalid: false,
    },
  }
);

const resolvedClass = computed(() => {
  return cn(textareaVariants({ invalid: props.invalid }), props.className);
});

const handleInput = (event) => {
  emit("update:modelValue", event.target.value);
};
</script>
