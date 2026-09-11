import { Routes, Route } from 'react-router-dom';
import Landing from '../pages/Landing/Landing';
import Login from '../pages/Auth/Login/Login';
import Register from '../pages/Auth/Register/Register';
import { ProtectedRoute } from './ProtectedRoute';
import DashboardLayout from '../pages/Dashboard/DashboardLayout';
import DashboardHome from '../pages/Dashboard/DashboardHome/DashboardHome';
import Upload from '../pages/Dashboard/Upload/Upload';
import ViewDetails from '../pages/Dashboard/ViewDetails/ViewDetails';
import AccessHistory from '../pages/Dashboard/AccessHistory/AccessHistory';
import AIChat from '../pages/Dashboard/AIChat/AIChat';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="upload" element={<Upload />} />
        <Route path="records" element={<ViewDetails />} />
        <Route path="history" element={<AccessHistory />} />
        <Route path="assistant" element={<AIChat />} />
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
