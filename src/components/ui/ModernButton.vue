<script setup lang="ts">
/**
 * Modern UI Design Components
 * 基于 UIverse.io 设计灵感的现代 UI 组件库
 *
 * 设计原则:
 * - 科技美学: 渐变背景、毛玻璃效果、微妙阴影
 * - 流畅动画: 300ms 贝塞尔缓动
 * - 视觉反馈: 点击缩放+发光效果
 */

import { ref, computed } from 'vue';

// 组件入参（属性定义）
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    glow?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    glow: false,
    loading: false,
    disabled: false,
  }
);

const emit = defineEmits(['click']);

const isPressed = ref(false);
const rippleStyle = ref<{ left: string; top: string } | null>(null);

const handleClick = (e: MouseEvent) => {
  if (props.disabled || props.loading) return;

  // 添加波纹效果
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  rippleStyle.value = {
    left: `${e.clientX - rect.left}px`,
    top: `${e.clientY - rect.top}px`,
  };

  setTimeout(() => {
    rippleStyle.value = null;
  }, 600);

  emit('click', e);
};

const buttonClasses = computed(() => [
  'modern-btn',
  `variant-${props.variant}`,
  `size-${props.size}`,
  {
    glow: props.glow,
    loading: props.loading,
    disabled: props.disabled,
  },
]);
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
    @mousedown="isPressed = true"
    @mouseup="isPressed = false"
    @mouseleave="isPressed = false"
  >
    <!-- 加载动画 -->
    <span v-if="loading" class="loader">
      <svg class="spinner" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-dasharray="31.4"
          stroke-linecap="round"
        />
      </svg>
    </span>

    <!-- 内容 -->
    <span class="content" :class="{ hidden: loading }">
      <slot />
    </span>

    <!-- 波纹效果 -->
    <span v-if="rippleStyle" class="ripple" :style="rippleStyle" />
  </button>
</template>

<style scoped lang="scss">
.modern-btn {
  // 基础样式
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 12px;
  font-family:
    'Segoe UI',
    system-ui,
    -apple-system,
    sans-serif;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  // 动画过渡
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  // 尺寸
  &.size-sm {
    padding: 8px 16px;
    font-size: 14px;
  }
  &.size-md {
    padding: 12px 24px;
    font-size: 16px;
  }
  &.size-lg {
    padding: 16px 32px;
    font-size: 18px;
  }

  // 主色调
  &.variant-primary {
    background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);

    &:hover:not(.disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 122, 255, 0.4);
    }
  }

  &.variant-secondary {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover:not(.disabled) {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
    }
  }

  &.variant-accent {
    background: linear-gradient(135deg, #ff9500 0%, #ff3b30 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);

    &:hover:not(.disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 149, 0, 0.4);
    }
  }

  &.variant-danger {
    background: linear-gradient(135deg, #ff3b30 0%, #ff2d55 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);

    &:hover:not(.disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 59, 48, 0.4);
    }
  }

  &.variant-ghost {
    background: transparent;
    color: rgba(255, 255, 255, 0.8);

    &:hover:not(.disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
  }

  // 发光效果
  &.glow {
    &.variant-primary {
      animation: glowPrimary 2s ease-in-out infinite alternate;
    }
    &.variant-accent {
      animation: glowAccent 2s ease-in-out infinite alternate;
    }
  }

  // 禁用状态
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  // 点击效果
  &:active:not(.disabled) {
    transform: scale(0.98);
  }

  // 加载状态
  &.loading {
    pointer-events: none;
  }

  .loader {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;

    .spinner {
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;

      circle {
        stroke-dashoffset: 0;
        animation: dash 1.5s ease-in-out infinite;
      }
    }
  }

  .content {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.2s;

    &.hidden {
      opacity: 0;
    }
  }

  // 波纹效果
  .ripple {
    position: absolute;
    width: 10px;
    height: 10px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    animation: ripple 0.6s ease-out forwards;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: 0;
    stroke-dasharray: 31.4;
  }
  50% {
    stroke-dashoffset: 25;
    stroke-dasharray: 31.4;
  }
  100% {
    stroke-dashoffset: 0;
    stroke-dasharray: 31.4;
  }
}

@keyframes ripple {
  to {
    transform: translate(-50%, -50%) scale(40);
    opacity: 0;
  }
}

@keyframes glowPrimary {
  from {
    box-shadow:
      0 0 10px rgba(0, 122, 255, 0.5),
      0 0 20px rgba(0, 122, 255, 0.3),
      0 0 30px rgba(0, 122, 255, 0.1);
  }
  to {
    box-shadow:
      0 0 20px rgba(0, 122, 255, 0.8),
      0 0 40px rgba(0, 122, 255, 0.5),
      0 0 60px rgba(0, 122, 255, 0.2);
  }
}

@keyframes glowAccent {
  from {
    box-shadow:
      0 0 10px rgba(255, 149, 0, 0.5),
      0 0 20px rgba(255, 149, 0, 0.3),
      0 0 30px rgba(255, 149, 0, 0.1);
  }
  to {
    box-shadow:
      0 0 20px rgba(255, 149, 0, 0.8),
      0 0 40px rgba(255, 149, 0, 0.5),
      0 0 60px rgba(255, 149, 0, 0.2);
  }
}
</style>
