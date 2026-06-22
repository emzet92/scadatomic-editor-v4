import { Routes, Route } from "react-router-dom";
import { EditorPage } from "./uiframework/EditorPage";
import { RenderPage } from "./uiframework/runtime/RenderPage";
import './App.css'
import { ScriptPage } from "./uiframework/gui/script-editor/ScriptPage";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<EditorPage />}
      />

      <Route
        path="/render"
        element={<RenderPage />}
      />
      <Route
        path="/scripts/:scriptId"
        element={<ScriptPage />}
      />
    </Routes>
  );
}

export default App;