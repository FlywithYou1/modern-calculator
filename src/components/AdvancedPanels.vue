<script setup lang="ts">
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { create, all } from 'mathjs';

const math = create(all);

const props = defineProps<{
  isOpen: boolean;
  initialTab?: string;
}>();

const emit = defineEmits(['close', 'result']);

const activeTab = ref(props.initialTab || 'matrix');
const result = ref<string | null>(null);
const error = ref<string | null>(null);

// Matrix State
const matrixOp = ref('add');
const matrixA = ref('');
const matrixB = ref('');

// Statistics State
const statsOp = ref('mean');
const statsValues = ref('');

// Complex State
const complexOp = ref('add');
const complexA = ref({ real: 0, imag: 0 });
const complexB = ref({ real: 0, imag: 0 });

// Unit State
const unitCategory = ref('length');
const unitValue = ref(0);
const unitFrom = ref('m');
const unitTo = ref('km');

// Base State
const baseNumber = ref('');
const baseFrom = ref(10);
const baseTo = ref(2);

// Calculus State
const calculusOp = ref('derivative');
const calculusExpr = ref('x^2');
const calculusVar = ref('x');

// Equation State
const equationExpr = ref('x^2 - 4 = 0');
const equationVar = ref('x'); // Note: mathjs solve is limited, might need custom logic or just simplify

const tabs = [
  { id: 'matrix', label: '矩阵' },
  { id: 'statistics', label: '统计' },
  { id: 'complex', label: '复数' },
  { id: 'unit', label: '单位' },
  { id: 'base', label: '进制' },
  { id: 'calculus', label: '微积分' },
  { id: 'equation', label: '方程' },
];

const matrixOperations = [
  { label: '矩阵加法', value: 'add' },
  { label: '矩阵减法', value: 'subtract' },
  { label: '矩阵乘法', value: 'multiply' },
  { label: '转置', value: 'transpose' },
  { label: '行列式', value: 'determinant' },
  { label: '求逆', value: 'inverse' },
];

const statOperations = [
  { label: '均值 (mean)', value: 'mean' },
  { label: '中位数 (median)', value: 'median' },
  { label: '方差 (variance)', value: 'variance' },
  { label: '标准差 (stdev)', value: 'stdev' },
  { label: '最小值 (min)', value: 'min' },
  { label: '最大值 (max)', value: 'max' },
  { label: '求和 (sum)', value: 'sum' },
  { label: '乘积 (product)', value: 'product' },
  { label: '极差 (range)', value: 'range' },
];

const complexOperations = [
  { label: '加法 (a + b)', value: 'add' },
  { label: '减法 (a - b)', value: 'subtract' },
  { label: '乘法 (a × b)', value: 'multiply' },
  { label: '除法 (a ÷ b)', value: 'divide' },
];

const calculusOperations = [
  { label: '求导 (Derivative)', value: 'derivative' },
  // Integral is harder in mathjs symbolic, but we can try simplify
];

const unitCategories: Record<string, any[]> = {
  length: [
    { label: '米 (m)', unit: 'm' },
    { label: '千米 (km)', unit: 'km' },
    { label: '厘米 (cm)', unit: 'cm' },
    { label: '毫米 (mm)', unit: 'mm' },
    { label: '英寸 (in)', unit: 'in' },
    { label: '英尺 (ft)', unit: 'ft' },
    { label: '码 (yd)', unit: 'yd' },
    { label: '英里 (mi)', unit: 'mi' },
  ],
  mass: [
    { label: '千克 (kg)', unit: 'kg' },
    { label: '克 (g)', unit: 'g' },
    { label: '毫克 (mg)', unit: 'mg' },
    { label: '磅 (lb)', unit: 'lb' },
    { label: '盎司 (oz)', unit: 'oz' },
    { label: '吨 (t)', unit: 't' },
  ],
  temperature: [
    { label: '摄氏度 (°C)', unit: '°C' },
    { label: '华氏度 (°F)', unit: '°F' },
    { label: '开尔文 (K)', unit: 'K' },
  ],
  time: [
    { label: '秒 (s)', unit: 's' },
    { label: '分钟 (min)', unit: 'min' },
    { label: '小时 (h)', unit: 'h' },
    { label: '天 (d)', unit: 'd' },
  ],
};

const baseOptions = [2, 8, 10, 16];

const requiresSecondMatrix = computed(() => ['add', 'subtract', 'multiply'].includes(matrixOp.value));

const currentUnitOptions = computed(() => unitCategories[unitCategory.value] || []);

const parseMatrix = (input: string) => {
  return input.trim().split('\n').map(row => row.trim().split(/[\s,]+/).map(Number));
};

const formatMatrix = (matrix: number[][]) => {
  return matrix.map(row => `[${row.join(', ')}]`).join('\n');
};

const calculateMatrix = async () => {
  try {
    error.value = null;
    const mA = parseMatrix(matrixA.value);
    let mB = undefined;
    if (requiresSecondMatrix.value) {
      mB = parseMatrix(matrixB.value);
    }

    const res = await invoke<any>('matrix_operation', {
      operation: matrixOp.value,
      matrix_a: mA,
      matrix_b: mB,
    });

    if (res.matrix) {
      result.value = formatMatrix(res.matrix);
    } else if (res.determinant !== undefined) {
      result.value = res.determinant.toString();
    }
  } catch (e: any) {
    error.value = e.toString();
  }
};

const calculateStats = async () => {
  try {
    error.value = null;
    const values = statsValues.value.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (values.length === 0) throw new Error('请输入有效数字');
    
    const res = await invoke<number>('calculate_statistics', {
      values,
      operation: statsOp.value,
    });
    result.value = res.toString();
  } catch (e: any) {
    error.value = e.toString();
  }
};

const calculateComplex = async () => {
  try {
    error.value = null;
    const res = await invoke<[number, number]>('calculate_complex', {
      a_real: complexA.value.real,
      a_imag: complexA.value.imag,
      b_real: complexB.value.real,
      b_imag: complexB.value.imag,
      operation: complexOp.value,
    });
    result.value = `${res[0]} ${res[1] >= 0 ? '+' : ''}${res[1]}i`;
  } catch (e: any) {
    error.value = e.toString();
  }
};

const convertUnit = async () => {
  try {
    error.value = null;
    const res = await invoke<number>('convert_units', {
      value: unitValue.value,
      from_unit: unitFrom.value,
      to_unit: unitTo.value,
    });
    result.value = res.toString();
  } catch (e: any) {
    error.value = e.toString();
  }
};

const convertBase = async () => {
  try {
    error.value = null;
    const res = await invoke<string>('convert_base', {
      number: baseNumber.value,
      from_base: baseFrom.value,
      to_base: baseTo.value,
    });
    result.value = res;
  } catch (e: any) {
    error.value = e.toString();
  }
};

const calculateCalculus = () => {
  try {
    error.value = null;
    if (calculusOp.value === 'derivative') {
      const res = math.derivative(calculusExpr.value, calculusVar.value);
      result.value = res.toString();
    }
  } catch (e: any) {
    error.value = e.toString();
  }
};

const solveEquation = () => {
  try {
    error.value = null;
    // Simple Newton-Raphson solver
    // f(x) = 0
    // Parse equation: left = right => left - right = 0
    let eq = equationExpr.value;
    if (eq.includes('=')) {
      const parts = eq.split('=');
      eq = `(${parts[0]}) - (${parts[1]})`;
    }
    
    const f = math.compile(eq);
    const derivative = math.derivative(eq, equationVar.value);
    const fPrime = derivative.compile();

    let x = 1; // Initial guess
    const tolerance = 1e-7;
    const maxIter = 100;

    for (let i = 0; i < maxIter; i++) {
      const y = f.evaluate({ [equationVar.value]: x });
      const yPrime = fPrime.evaluate({ [equationVar.value]: x });

      if (Math.abs(yPrime) < 1e-10) {
        throw new Error('Derivative is zero. Cannot solve.');
      }

      const xNew = x - y / yPrime;
      if (Math.abs(xNew - x) < tolerance) {
        result.value = `x ≈ ${xNew.toFixed(6)}`;
        return;
      }
      x = xNew;
    }
    throw new Error('Failed to converge');
  } catch (e: any) {
    error.value = e.toString();
  }
};

const close = () => {
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="advanced-panel-overlay" @click.self="close">
    <div class="advanced-panel">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id; result = null; error = null"
        >
          {{ tab.label }}
        </button>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="content">
        <!-- Matrix Panel -->
        <div v-if="activeTab === 'matrix'" class="panel-content">
          <div class="form-group">
            <label>操作</label>
            <select v-model="matrixOp">
              <option v-for="op in matrixOperations" :key="op.value" :value="op.value">{{ op.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>矩阵 A (每行换行，元素空格分隔)</label>
            <textarea v-model="matrixA" placeholder="1 2&#10;3 4"></textarea>
          </div>
          <div v-if="requiresSecondMatrix" class="form-group">
            <label>矩阵 B</label>
            <textarea v-model="matrixB" placeholder="5 6&#10;7 8"></textarea>
          </div>
          <button class="action-btn" @click="calculateMatrix">计算</button>
        </div>

        <!-- Statistics Panel -->
        <div v-if="activeTab === 'statistics'" class="panel-content">
          <div class="form-group">
            <label>操作</label>
            <select v-model="statsOp">
              <option v-for="op in statOperations" :key="op.value" :value="op.value">{{ op.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>数据集 (逗号或空格分隔)</label>
            <textarea v-model="statsValues" placeholder="1, 2, 3, 4, 5"></textarea>
          </div>
          <button class="action-btn" @click="calculateStats">计算</button>
        </div>

        <!-- Complex Panel -->
        <div v-if="activeTab === 'complex'" class="panel-content">
          <div class="form-group">
            <label>操作</label>
            <select v-model="complexOp">
              <option v-for="op in complexOperations" :key="op.value" :value="op.value">{{ op.label }}</option>
            </select>
          </div>
          <div class="complex-inputs">
            <div class="complex-num">
              <span>A:</span>
              <input type="number" v-model.number="complexA.real" placeholder="实部">
              <input type="number" v-model.number="complexA.imag" placeholder="虚部"> i
            </div>
            <div class="complex-num">
              <span>B:</span>
              <input type="number" v-model.number="complexB.real" placeholder="实部">
              <input type="number" v-model.number="complexB.imag" placeholder="虚部"> i
            </div>
          </div>
          <button class="action-btn" @click="calculateComplex">计算</button>
        </div>

        <!-- Unit Panel -->
        <div v-if="activeTab === 'unit'" class="panel-content">
          <div class="form-group">
            <label>类别</label>
            <select v-model="unitCategory">
              <option v-for="(_, cat) in unitCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>数值</label>
            <input type="number" v-model.number="unitValue">
          </div>
          <div class="unit-selects">
            <select v-model="unitFrom">
              <option v-for="u in currentUnitOptions" :key="u.unit" :value="u.unit">{{ u.label }}</option>
            </select>
            <span>→</span>
            <select v-model="unitTo">
              <option v-for="u in currentUnitOptions" :key="u.unit" :value="u.unit">{{ u.label }}</option>
            </select>
          </div>
          <button class="action-btn" @click="convertUnit">转换</button>
        </div>

        <!-- Base Panel -->
        <div v-if="activeTab === 'base'" class="panel-content">
          <div class="form-group">
            <label>数字</label>
            <input v-model="baseNumber" placeholder="1010">
          </div>
          <div class="unit-selects">
            <select v-model.number="baseFrom">
              <option v-for="b in baseOptions" :key="b" :value="b">{{ b }}进制</option>
            </select>
            <span>→</span>
            <select v-model.number="baseTo">
              <option v-for="b in baseOptions" :key="b" :value="b">{{ b }}进制</option>
            </select>
          </div>
          <button class="action-btn" @click="convertBase">转换</button>
        </div>

        <!-- Calculus Panel -->
        <div v-if="activeTab === 'calculus'" class="panel-content">
          <div class="form-group">
            <label>操作</label>
            <select v-model="calculusOp">
              <option v-for="op in calculusOperations" :key="op.value" :value="op.value">{{ op.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>表达式 (例如: x^2 + 2*x)</label>
            <input v-model="calculusExpr" placeholder="x^2">
          </div>
          <div class="form-group">
            <label>变量 (例如: x)</label>
            <input v-model="calculusVar" placeholder="x">
          </div>
          <button class="action-btn" @click="calculateCalculus">计算</button>
        </div>

        <!-- Equation Panel -->
        <div v-if="activeTab === 'equation'" class="panel-content">
          <div class="form-group">
            <label>方程 (例如: x^2 - 4 = 0)</label>
            <input v-model="equationExpr" placeholder="x^2 - 4 = 0">
          </div>
          <div class="form-group">
            <label>变量 (例如: x)</label>
            <input v-model="equationVar" placeholder="x">
          </div>
          <button class="action-btn" @click="solveEquation">求解 (数值解)</button>
        </div>

        <!-- Result Area -->
        <div v-if="result" class="result-area">
          <h3>结果:</h3>
          <pre>{{ result }}</pre>
        </div>
        <div v-if="error" class="error-area">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.advanced-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.advanced-panel {
  background: rgba(30, 30, 30, 0.95);
  width: 90%;
  max-width: 500px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
}

.tabs {
  display: flex;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.tabs button {
  flex: 1;
  padding: 12px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.tabs button.active {
  color: white;
  background: rgba(255,255,255,0.1);
  border-bottom: 2px solid #007aff;
}

.tabs .close-btn {
  flex: 0 0 40px;
  font-size: 20px;
  color: #ff453a;
}

.content {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: rgba(255,255,255,0.8);
  font-size: 14px;
}

select, input, textarea {
  width: 100%;
  padding: 8px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  color: white;
  font-family: inherit;
}

textarea {
  height: 80px;
  resize: vertical;
}

.action-btn {
  width: 100%;
  padding: 10px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 10px;
}

.action-btn:hover {
  background: #0063cc;
}

.result-area {
  margin-top: 20px;
  padding: 15px;
  background: rgba(0,255,0,0.1);
  border-radius: 8px;
  border: 1px solid rgba(0,255,0,0.2);
}

.result-area pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: monospace;
}

.error-area {
  margin-top: 20px;
  padding: 15px;
  background: rgba(255,0,0,0.1);
  border-radius: 8px;
  border: 1px solid rgba(255,0,0,0.2);
  color: #ff453a;
}

.complex-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.complex-num {
  display: flex;
  align-items: center;
  gap: 10px;
}

.complex-num input {
  flex: 1;
}

.unit-selects {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.unit-selects select {
  flex: 1;
}
</style>
