import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Import theme store to apply dark/light class before first paint
import './store/useThemeStore.js'

// ═══ PWA: Service Worker Registration via vite-plugin-pwa ═══
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Khi có phiên bản mới, tự động update (có thể thêm toast thông báo sau)
    if (confirm('NeuroVault có phiên bản mới. Tải lại trang?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('[NeuroVault] Ứng dụng sẵn sàng hoạt động offline.')
  },
  onRegisteredSW(swUrl, r) {
    // Kiểm tra update mỗi 1 giờ
    if (r) {
      setInterval(() => {
        r.update()
      }, 60 * 60 * 1000)
    }
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
