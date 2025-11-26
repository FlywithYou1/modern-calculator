<script setup lang="ts">
/**
 * LaTeX 公式渲染组件
 * 使用 KaTeX 渲染数学公式
 */
import { ref, watch, onMounted } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const props = withDefaults(defineProps<{
  math: string;
  displayMode?: boolean;
  throwOnError?: boolean;
}>(), {
  displayMode: false,
  throwOnError: false,
});

const container = ref<HTMLElement | null>(null);
const error = ref<string | null>(null);

const renderMath = () => {
  if (!container.value || !props.math) return;
  
  try {
    katex.render(props.math, container.value, {
      displayMode: props.displayMode,
      throwOnError: props.throwOnError,
      errorColor: '#ff3b30',
      trust: true,
      strict: false,
      macros: {
        "\\R": "\\mathbb{R}",
        "\\N": "\\mathbb{N}",
        "\\Z": "\\mathbb{Z}",
        "\\Q": "\\mathbb{Q}",
        "\\C": "\\mathbb{C}",
        "\\d": "\\mathrm{d}",
      },
    });
    error.value = null;
  } catch (e: any) {
    error.value = e.message || 'LaTeX 渲染错误';
    if (container.value) {
      container.value.textContent = props.math;
    }
  }
};

onMounted(renderMath);
watch(() => props.math, renderMath);
watch(() => props.displayMode, renderMath);
</script>

<template>
  <span 
    ref="container" 
    class="latex-container"
    :class="{ 'display-mode': displayMode, 'has-error': error }"
    :title="error || undefined"
  />
</template>

<style scoped>
.latex-container {
  display: inline-block;
  vertical-align: middle;
}

.latex-container.display-mode {
  display: block;
  text-align: center;
  margin: 1em 0;
}

.latex-container.has-error {
  color: #ff3b30;
  font-family: monospace;
}

/* KaTeX 样式覆盖 */
:deep(.katex) {
  font-size: 1.1em;
}

:deep(.katex-display) {
  margin: 0.5em 0;
}

:deep(.katex .base) {
  display: inline-block;
}
</style>
