<script setup lang="ts">
import Calculator from "./components/Calculator.vue";
</script>

<template>
  <div class="app-container" data-tauri-drag-region>
    <Calculator />
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, #1a1a2e 0%, #16213e 100%);
}
</style>
