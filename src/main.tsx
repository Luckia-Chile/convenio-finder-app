import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// Retira la pantalla de carga inicial en cuanto React monta (sin espera artificial).
requestAnimationFrame(() => {
  const loading = document.getElementById('initial-loading');
  if (!loading) return;
  loading.style.transition = 'opacity 0.25s ease';
  loading.style.opacity = '0';
  setTimeout(() => loading.remove(), 250);
});
