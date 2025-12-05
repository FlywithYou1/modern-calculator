import { createApp } from 'vue';
import { createPinia } from 'pinia';
import i18n from './locales';
import './style.scss';
import App from './App.vue';
import { startPerfProbes } from './utils/perf';

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.mount('#app');

startPerfProbes();
