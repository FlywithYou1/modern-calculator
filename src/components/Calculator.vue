<script setup lang="ts">
import { ref, computed } from 'vue';
import { evaluate, format } from 'mathjs';
import { useI18n } from 'vue-i18n';
import { invoke } from '@tauri-apps/api/core';
import AdvancedPanels from './AdvancedPanels.vue';

const { t } = useI18n();

const display = ref('0');
const history = ref('');
const isResult = ref(false);
const angleMode = ref<'DEG' | 'RAD'>('DEG');
const mode = ref<'standard' | 'scientific'>('standard');
const showAdvanced = ref(false);

const toggleMode = () => {
  mode.value = mode.value === 'standard' ? 'scientific' : 'standard';
};

const append = (char: string) => {
  if (display.value === 'Error') display.value = '0';
  
  const isOperator = ['+', '-', '*', '/', '^', '%'].includes(char);
  
  if (isResult.value) {
    if (isOperator) {
      // If result exists and operator is pressed, continue with result
      isResult.value = false;
      display.value += char;
    } else {
      // If number is pressed, start new calculation
      display.value = char;
      isResult.value = false;
    }
  } else {
    if (display.value === '0' && char !== '.' && !isOperator) {
      display.value = char;
    } else {
      display.value += char;
    }
  }
};

const clear = () => {
  display.value = '0';
  history.value = '';
  isResult.value = false;
};

const del = () => {
  if (isResult.value) {
    clear();
    return;
  }
  if (display.value.length > 1) {
    display.value = display.value.slice(0, -1);
  } else {
    display.value = '0';
  }
};

const calculate = async () => {
  try {
    let expression = display.value
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt');
    
    // Handle continuous calculation logic if needed, but parser handles it.
    // The issue might be user expectation of "1+1" -> "2" when "+" is pressed.
    // But for expression calculator, we just evaluate on "=".
    
    history.value = display.value + ' =';
    
    try {
      const result = await invoke<{ success: boolean; result?: string; error?: string }>('calculate', { 
        expression,
        displayExpression: display.value,
      });

      if (result.success && result.result) {
        display.value = result.result;
        isResult.value = true;
        return;
      }
    } catch (err) {
      console.warn('Backend calculation failed, falling back to frontend:', err);
    }

    const result = evaluate(expression);
    display.value = format(result, { precision: 14 });
    isResult.value = true;
  } catch (e) {
    display.value = 'Error';
    isResult.value = true;
  }
};

const buttons = computed(() => {
  const standard = [
    { label: 'C', type: 'action', action: clear, text: t('calculator.clear') },
    { label: 'DEL', type: 'action', action: del, text: t('calculator.delete') },
    { label: '%', type: 'func' },
    { label: '÷', type: 'op', value: '/' },
    
    { label: '7', type: 'num' },
    { label: '8', type: 'num' },
    { label: '9', type: 'num' },
    { label: '×', type: 'op', value: '*' },
    
    { label: '4', type: 'num' },
    { label: '5', type: 'num' },
    { label: '6', type: 'num' },
    { label: '-', type: 'op' },
    
    { label: '1', type: 'num' },
    { label: '2', type: 'num' },
    { label: '3', type: 'num' },
    { label: '+', type: 'op' },
    
    { label: 'Mode', type: 'func', action: toggleMode },
    { label: '0', type: 'num' },
    { label: '.', type: 'num' },
    { label: '=', type: 'equal', action: calculate },
  ];

  const scientific = [
    { label: '2nd', type: 'func' },
    { label: 'deg', type: 'func', action: () => angleMode.value = angleMode.value === 'DEG' ? 'RAD' : 'DEG', text: t(`calculator.${angleMode.value.toLowerCase()}`) },
    { label: 'sin', type: 'func', value: 'sin(' },
    { label: 'cos', type: 'func', value: 'cos(' },
    { label: 'tan', type: 'func', value: 'tan(' },
    
    { label: 'xʸ', type: 'func', value: '^' },
    { label: 'lg', type: 'func', value: 'log10(' },
    { label: 'ln', type: 'func', value: 'log(' },
    { label: '(', type: 'func' },
    { label: ')', type: 'func' },
    
    { label: '√', type: 'func', value: 'sqrt(' },
    { label: 'C', type: 'action', action: clear, text: t('calculator.clear') },
    { label: 'DEL', type: 'action', action: del, text: t('calculator.delete') },
    { label: '%', type: 'func' },
    { label: '÷', type: 'op', value: '/' },
    
    { label: 'x!', type: 'func', value: '!' },
    { label: '7', type: 'num' },
    { label: '8', type: 'num' },
    { label: '9', type: 'num' },
    { label: '×', type: 'op', value: '*' },
    
    { label: '1/x', type: 'func', value: '1/' },
    { label: '4', type: 'num' },
    { label: '5', type: 'num' },
    { label: '6', type: 'num' },
    { label: '-', type: 'op' },
    
    { label: 'π', type: 'func', value: 'pi' },
    { label: '1', type: 'num' },
    { label: '2', type: 'num' },
    { label: '3', type: 'num' },
    { label: '+', type: 'op' },
    
    { label: 'Mode', type: 'func', action: toggleMode },
    { label: 'Adv', type: 'func', action: () => showAdvanced.value = true },
    { label: '0', type: 'num' },
    { label: '.', type: 'num' },
    { label: '=', type: 'equal', action: calculate },
  ];

  return mode.value === 'scientific' ? scientific : standard;
});

const handleBtn = (btn: any) => {
  if (btn.action) {
    btn.action();
  } else {
    append(btn.value || btn.label);
  }
};
</script>

<template>
  <div class="calculator" :class="{ scientific: mode === 'scientific' }">
    <div class="display">
      <div class="history">{{ history }}</div>
      <div class="current">{{ display }}</div>
    </div>
    <div class="keypad" :class="{ scientific: mode === 'scientific' }">
      <button
        v-for="btn in buttons"
        :key="btn.label"
        :class="['btn', btn.type]"
        @click="handleBtn(btn)"
      >
        {{ btn.text || btn.label }}
      </button>
    </div>
    <AdvancedPanels :is-open="showAdvanced" @close="showAdvanced = false" />
  </div>
</template>

<style scoped lang="scss">
.calculator {
  width: 100%;
  max-width: 320px;
  transition: max-width 0.3s ease;
  
  &.scientific {
    max-width: 500px;
  }

  /* Apple Liquid Glass Effect */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset,
    0 0 20px rgba(255, 255, 255, 0.1) inset;
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;

  /* Light reflection effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -50%;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      to bottom right,
      rgba(255, 255, 255, 0.3) 0%,
      rgba(255, 255, 255, 0.05) 40%,
      transparent 50%
    );
    transform: rotate(30deg);
    pointer-events: none;
  }

  .display {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    text-align: right;
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    .history {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      min-height: 20px;
      margin-bottom: 8px;
    }
    
    .current {
      color: #fff;
      font-size: 48px;
      font-weight: 200;
      word-break: break-all;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  }

  .keypad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    
    &.scientific {
      grid-template-columns: repeat(5, 1fr);
    }

    .btn {
      border: none;
      outline: none;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 18px;
      padding: 16px 0;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      user-select: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }

      &:active {
        transform: translateY(1px) scale(0.98);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      &.op {
        background: rgba(255, 165, 0, 0.8); /* Orange for operators like iOS */
        color: #fff;
        font-size: 24px;
        font-weight: 500;
        
        &:hover {
          background: rgba(255, 165, 0, 1);
        }
      }

      &.equal {
        background: rgba(52, 199, 89, 0.8); /* Green for equal */
        color: #fff;
        grid-row: span 1;
        
        &:hover {
          background: rgba(52, 199, 89, 1);
          box-shadow: 0 0 20px rgba(52, 199, 89, 0.4);
        }
      }

      &.action {
        background: rgba(255, 59, 48, 0.1);
        color: #ff3b30;
        
        &:hover {
          background: rgba(255, 59, 48, 0.2);
        }
      }
      
      &.num {
        font-size: 22px;
        font-weight: 400;
        background: rgba(255, 255, 255, 0.05);
        
        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      }
    }
  }
}
</style>
