import { BrowserRouter, Routes, Route } from "react-router-dom";
import PatientListPage from "./pages/PatientListPage";
import PatientDetailPage from "./pages/PatientDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PatientListPage />} />
        <Route path="/patient/:id" element={<PatientDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;