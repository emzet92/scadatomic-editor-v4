import { Routes, Route } from "react-router-dom";
import { EditorPage } from "./uiframework/EditorPage";
import { RenderPage } from "./uiframework/runtime/RenderPage";
import './App.css'

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
    </Routes>
  );
}

export default App;