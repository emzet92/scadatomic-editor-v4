import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { AssetProvider } from './assets'
import { AlarmLibrary, AlarmLibraryProvider, BrowserAlarmChangeBus, IndexedDbAlarmRepository } from './alarms'
import { BrowserStateMachineChangeBus, IndexedDbStateMachineRepository, StateMachineLibrary, StateMachineLibraryProvider } from './state-machines'

const alarmRepository = new IndexedDbAlarmRepository()
const alarmLibrary = new AlarmLibrary(alarmRepository, alarmRepository, alarmRepository, new BrowserAlarmChangeBus())
const stateMachineLibrary = new StateMachineLibrary(new IndexedDbStateMachineRepository(), new BrowserStateMachineChangeBus())

if (import.meta.hot) import.meta.hot.dispose(() => { alarmLibrary.dispose(); stateMachineLibrary.dispose() })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AlarmLibraryProvider library={alarmLibrary}>
        <StateMachineLibraryProvider library={stateMachineLibrary}>
          <AssetProvider>
            <App />
          </AssetProvider>
        </StateMachineLibraryProvider>
      </AlarmLibraryProvider>
    </BrowserRouter>
  </StrictMode>,
)
