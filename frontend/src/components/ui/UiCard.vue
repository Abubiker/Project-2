<template>
  <section :class="resolvedClass" v-bind="$attrs">
    <slot />
  </section>
</template>

<script setup>
import { computed } from "vue";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

const props = defineProps({
  variant: { type: String, default: "glass" },
  className: { type: String, default: "" },
});

const cardVariants = cva("rounded-3xl p-6", {
  variants: {
    variant: {
      glass: "liquid-glass-surface liquid-glass-card",
      solid: "rounded-3xl border border-black/5 bg-white p-6 shadow-sm",
    },
  },
  defaultVariants: {
    variant: "glass",
  },
});

const resolvedClass = computed(() =>
  cn(cardVariants({ variant: props.variant }), props.className)
);
</script>
