<template>
  <label :class="resolvedClass" v-bind="$attrs">
    <slot />
  </label>
</template>

<script setup>
import { computed } from "vue";
import { cn } from "../../utils/cn";

const props = defineProps({
  className: { type: String, default: "" },
});

const resolvedClass = computed(() => cn("text-sm font-medium text-slate", props.className));
</script>
