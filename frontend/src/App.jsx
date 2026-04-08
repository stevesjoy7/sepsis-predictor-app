import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PatientListPage from "./pages/PatientListPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import AuthPage from "./pages/AuthPage";
import ModelEvalPage from "./pages/ModelEvalPage";

const ProtectedRoute = ({ children }) => {
  const auth = localStorage.getItem("sepsis_auth");
  if (!auth) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><PatientListPage /></ProtectedRoute>} />
        <Route path="/patient/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
        <Route path="/evaluation" element={<ProtectedRoute><ModelEvalPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;