<template>
  <input
    :value="modelValue"
    :class="resolvedClass"
    @input="handleInput"
    v-bind="$attrs"
  />
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

const inputVariants = cva(
  "w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink transition focus-visible:outline-none focus-visible:ring-2",
  {
    variants: {
      invalid: {
        true: "border-coral bg-coral/10 focus-visible:ring-coral/40",
        false: "border-black/10 focus-visible:ring-ink/20",
      },
    },
    defaultVariants: {
      invalid: false,
    },
  }
);

const resolvedClass = computed(() => {
  return cn(inputVariants({ invalid: props.invalid }), props.className);
});

const handleInput = (event) => {
  emit("update:modelValue", event.target.value);
};
</script>
