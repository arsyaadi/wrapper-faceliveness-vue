import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import '@aws-amplify/ui-react-liveness/styles.css'

(window as any).global = window;

createApp(App).mount('#app')
