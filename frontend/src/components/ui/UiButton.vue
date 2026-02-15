<template>
  <button :type="type" :disabled="disabled" :class="resolvedClass" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup>
import { computed } from "vue";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

const props = defineProps({
  variant: { type: String, default: "default" },
  size: { type: String, default: "default" },
  className: { type: String, default: "" },
  type: { type: String, default: "button" },
  disabled: { type: Boolean, default: false },
});

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "liquid-glass-button liquid-glass-button--primary",
        outline: "border border-black/10 bg-white text-ink hover:bg-black/5",
        ghost: "liquid-glass-button liquid-glass-button--ghost",
        destructive: "bg-coral text-white hover:brightness-95",
        success: "bg-mint text-white hover:brightness-95",
        link: "text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const resolvedClass = computed(() => {
  return cn(buttonVariants({ variant: props.variant, size: props.size }), props.className);
});
</script>
