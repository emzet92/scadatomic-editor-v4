import { Route, Routes } from "react-router-dom";
import { EditorPage } from "./uiframework/EditorPage";
import { ScriptPage } from "./uiframework/gui/script-editor/ScriptPage";
import { RenderPage } from "./uiframework/runtime/RenderPage";
import { DependenciesPage } from "./uiframework/gui/dependencies/DependenciesPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorPage />} />
      <Route path="/project/:projectId" element={<EditorPage />} />
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
