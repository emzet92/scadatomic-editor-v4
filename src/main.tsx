import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { AssetProvider } from './assets'
import { AlarmLibrary, AlarmLibraryProvider, BrowserAlarmChangeBus, IndexedDbAlarmRepository } from './alarms'

const alarmRepository = new IndexedDbAlarmRepository()
const alarmLibrary = new AlarmLibrary(alarmRepository, alarmRepository, alarmRepository, new BrowserAlarmChangeBus())

if (import.meta.hot) import.meta.hot.dispose(() => alarmLibrary.dispose())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AlarmLibraryProvider library={alarmLibrary}>
        <AssetProvider>
          <App />
        </AssetProvider>
      </AlarmLibraryProvider>
    </BrowserRouter>
  </StrictMode>,
)
