import { Navigate, Route, Routes } from "react-router-dom";
import { EditorPage } from "./designer/EditorPage";
import { ScriptPage } from "./designer/features/scripting/ScriptPage";
import { RenderPage } from "./runtime/pages/RenderPage";
import { DependenciesPage } from "./designer/features/dependencies/DependenciesPage";
import { FleetManagementPage } from "./fleet/pages/FleetManagementPage";
import { ReportDesignerPage } from "./reporting";
import { AnimationLabPage } from "./animations";
import { IndexedDbProcessRepository, ProcessLibrary, ProcessLibraryProvider } from "./processes";

const processLibrary = new ProcessLibrary(new IndexedDbProcessRepository());

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
      </Routes>
    </ProcessLibraryProvider>
  );
}

export default App;
