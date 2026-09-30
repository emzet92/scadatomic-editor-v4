import { Navigate, Route, Routes } from "react-router-dom";
import { EditorPage } from "./designer/EditorPage";
import { ScriptPage } from "./designer/features/scripting/ScriptPage";
import { RenderPage } from "./runtime/pages/RenderPage";
import { DependenciesPage } from "./designer/features/dependencies/DependenciesPage";
import { FleetManagementPage } from "./fleet/pages/FleetManagementPage";
import { ReportDesignerPage } from "./reporting";
import { AnimationLabPage } from "./animations";
import { StateMachineLabPage } from "./state-machines";
import {
  BrowserProcessChangeBus,
  IndexedDbProcessRepository,
  ProcessLibrary,
  ProcessLibraryProvider,
} from "./processes";
import { LoginPage } from "./auth";
import { HistorianWorkspacePage } from "./designer/features/historian";
const processLibrary = new ProcessLibrary(
  new IndexedDbProcessRepository(),
  new BrowserProcessChangeBus(),
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => processLibrary.dispose());
}

function App() {
  return (
    <ProcessLibraryProvider library={processLibrary}>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/project/:projectId" element={<EditorPage />} />
        <Route path="/cloud" element={<Navigate to="/cloud/fleet" replace />} />
        <Route path="/cloud/fleet" element={<FleetManagementPage />} />
        <Route path="/render/:projectId/*" element={<RenderPage />} />
        <Route path="/project/:projectId/reports" element={<ReportDesignerPage />} />
        <Route path="/animations" element={<AnimationLabPage />} />
        <Route path="/project/:projectId/animations" element={<AnimationLabPage />} />
        <Route
          path="/project/:projectId/dependencies"
          element={<DependenciesPage />}
        />
        <Route
          path="/project/:projectId/scripts/:scriptId"
          element={<ScriptPage />}
        />
        <Route
          path="/project/:projectId/state-machines"
          element={<StateMachineLabPage />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/project/:projectId/historian"
          element={<HistorianWorkspacePage view="explorer" />}
        />

        <Route
          path="/project/:projectId/historian/config"
          element={<HistorianWorkspacePage view="config" />}
        />
      </Routes>
    </ProcessLibraryProvider>
  );
}

export default App;
