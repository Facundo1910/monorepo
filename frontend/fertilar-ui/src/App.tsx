import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DialogProvider } from './context/DialogContext'
import PrivateRoute from './components/PrivateRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import PilasPage from './pages/PilasPage.tsx'
import SensoresPage from './pages/SensoresPage.tsx'
import AlertasPage from './pages/AlertasPage.tsx'

export default function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pilas" element={<PilasPage />} />
          <Route path="/sensores" element={<SensoresPage />} />
          <Route path="/alertas" element={<AlertasPage />} />

        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </DialogProvider>
    </AuthProvider>
  )
}
