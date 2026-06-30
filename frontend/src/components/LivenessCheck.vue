<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { LivenessReactBridge } from '../liveness/LivenessReactBridge';

const props = defineProps<{
  sessionId: string;
  region: string;
}>();

const emit = defineEmits<{
  (e: 'complete', sessionId: string): void;
  (e: 'error', error: Error): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let reactRoot: ReactDOM.Root | null = null;

const renderReactComponent = () => {
  if (!containerRef.value) return;

  if (!reactRoot) {
    reactRoot = ReactDOM.createRoot(containerRef.value);
  }

  reactRoot.render(
    React.createElement(LivenessReactBridge, {
      sessionId: props.sessionId,
      region: props.region,
      onComplete: (sessionId: string) => {
        emit('complete', sessionId);
      },
      onError: (error: Error) => {
        emit('error', error);
      },
    })
  );
};

watch(
  () => [props.sessionId, props.region],
  () => {
    renderReactComponent();
  }
);

onMounted(() => {
  renderReactComponent();
});

onUnmounted(() => {
  if (reactRoot) {
    const rootToUnmount = reactRoot;
    reactRoot = null;
    setTimeout(() => {
      try {
        rootToUnmount.unmount();
      } catch (err) {
        console.error('Error during React unmount:', err);
      }
    }, 100);
  }
});
</script>

<template>
  <div ref="containerRef" class="liveness-check-container"></div>
</template>

<style scoped>
.liveness-check-container {
  width: 100%;
  height: 100%;
}
</style>
