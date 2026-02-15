<template>
  <section :class="resolvedClass" v-bind="$attrs">
    <slot />
  </section>
</template>

<script setup>
import { computed } from "vue";
import { cn } from "../../utils/cn";

const props = defineProps({
  variant: { type: String, default: "glass" },
  className: { type: String, default: "" },
});

const variantClasses = {
  glass: "liquid-glass-surface liquid-glass-card",
  solid: "rounded-3xl border border-black/5 bg-white p-6 shadow-sm",
};

const resolvedClass = computed(() =>
  cn("rounded-3xl p-6", variantClasses[props.variant] || variantClasses.glass, props.className)
);
</script>
