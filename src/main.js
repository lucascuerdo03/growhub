import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@fontsource-variable/inter'
import '@fontsource/zilla-slab/latin-500.css'
import '@fontsource/zilla-slab/latin-600.css'
import '@fontsource/zilla-slab/latin-700.css'
import './assets/base.css'

createApp(App).use(router).mount('#app')