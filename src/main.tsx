import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AssetProvider } from './uiframework/assets'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AssetProvider>
        <App />
      </AssetProvider>
    </BrowserRouter>
  </StrictMode>,
)
