<script setup lang="ts">
import Calculator from './components/Calculator.vue';
import TitleBar from './components/TitleBar.vue';
</script>

<template>
  <TitleBar />
  <div class="app-container">
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
  /* Deep space gradient background */
  background: radial-gradient(circle at 50% 0%, #2b32b2 0%, #141e30 100%);
  overflow: hidden;
}
</style>
