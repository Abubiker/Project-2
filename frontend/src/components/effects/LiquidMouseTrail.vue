<template>
  <div v-if="enabled" class="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
    <span
      v-for="point in trail.points"
      :key="point.id"
      class="liquid-mouse-trail-dot"
      :style="{
        transform: `translate3d(${point.x}px, ${point.y}px, 0) scale(${point.scale})`,
        opacity: point.opacity,
      }"
    ></span>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { createTrailState, isTrailSupported, updateTrail } from "@/lib/LiquidGlassKit";

const enabled = ref(false);
const trail = reactive(createTrailState());
const pointer = reactive({ x: 0, y: 0 });

let animationFrameId = 0;

const handlePointerMove = (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
};

const animateTrail = () => {
  updateTrail(trail, pointer);
  animationFrameId = window.requestAnimationFrame(animateTrail);
};

onMounted(() => {
  if (!isTrailSupported()) return;

  enabled.value = true;
  pointer.x = window.innerWidth / 2;
  pointer.y = window.innerHeight / 2;

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  animationFrameId = window.requestAnimationFrame(animateTrail);
});

onUnmounted(() => {
  window.removeEventListener("pointermove", handlePointerMove);
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId);
  }
});
</script>
