<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

const minimize = () => appWindow.minimize();
const maximize = async () => {
  if (await appWindow.isMaximized()) {
    appWindow.unmaximize();
  } else {
    appWindow.maximize();
  }
};
const close = () => appWindow.close();
</script>

<template>
  <div class="titlebar">
    <div class="drag-region" data-tauri-drag-region></div>
    <div class="title">Modern Calculator</div>
    <div class="window-controls">
      <div class="button minimize" @click.stop="minimize">
        <svg width="10" height="1" viewBox="0 0 10 1">
          <path d="M0 0h10v1H0z" fill="currentColor" />
        </svg>
      </div>
      <div class="button maximize" @click.stop="maximize">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M0 0h10v10H0V0zm1 1h8v8H1V1z" fill="currentColor" />
        </svg>
      </div>
      <div class="button close" @click.stop="close">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M0 0h10v1H0z" transform="rotate(45 5 5)" fill="currentColor" />
          <path d="M0 0h10v1H0z" transform="rotate(-45 5 5)" fill="currentColor" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  height: 38px;
  background: transparent;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.drag-region {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}

.title {
  margin-left: 16px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.window-controls {
  display: flex;
  height: 100%;
  margin-right: 8px;
  position: relative;
  z-index: 2;
}

.button {
  width: 40px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
  border-radius: 8px;
  margin: 4px 2px;
  height: 30px;
}

.button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.button.close:hover {
  background: #ff453a;
  color: white;
}
</style>
