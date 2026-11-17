import '@fontsource/pixelify-sans/400.css'; import '@fontsource/pixelify-sans/500.css'; import '@fontsource/pixelify-sans/600.css'; import '@fontsource/pixelify-sans/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import '@fontsource/neucha/400.css';
import '@fontsource/pt-mono/400.css';
import './styles/main.css';
import { createApp } from 'vue';
import App from './ui/App.vue';

// Сцена рисует надписи на canvas-текстурах, поэтому сначала дожидаемся шрифтов.
const fonts = ['400 16px "Pixelify Sans"', '600 16px "Pixelify Sans"', '700 16px "Pixelify Sans"', '400 16px Nunito', '700 16px Nunito', '800 16px Nunito', '900 16px Nunito', '16px Neucha', '16px "PT Mono"'];
Promise.all(fonts.map((f) => document.fonts.load(f))).catch(() => {}).finally(() => {
  createApp(App).mount('#app');
});
