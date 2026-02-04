import { reactive } from "vue";

const state = reactive({
  items: [],
});

let counter = 0;

export function pushToast({ message, tone = "info", duration = 3000 }) {
  const id = ++counter;
  const toast = { id, message, tone };
  state.items.push(toast);
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  return id;
}

export function removeToast(id) {
  const index = state.items.findIndex((item) => item.id === id);
  if (index !== -1) {
    state.items.splice(index, 1);
  }
}

export const toastState = state;
