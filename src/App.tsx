import { Navigate, Route, Routes } from "react-router-dom";
import { EditorPage } from "./uiframework/EditorPage";
import { ScriptPage } from "./uiframework/gui/script-editor/ScriptPage";
import { RenderPage } from "./uiframework/runtime/RenderPage";
import { DependenciesPage } from "./uiframework/gui/dependencies/DependenciesPage";
import { FleetManagementPage } from "./cloud/pages/FleetManagementPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorPage />} />
      <Route path="/project/:projectId" element={<EditorPage />} />
      <Route path="/cloud" element={<Navigate to="/cloud/fleet" replace />} />
      <Route path="/cloud/fleet" element={<FleetManagementPage />} />
      <Route path="/render/:projectId/*" element={<RenderPage />} />
      <Route
        path="/project/:projectId/dependencies"
        element={<DependenciesPage />}
      />
      <Route
        path="/project/:projectId/scripts/:scriptId"
        element={<ScriptPage />}
      />
    </Routes>
  );
}

export default App;
