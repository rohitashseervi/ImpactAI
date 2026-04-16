import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import LoadingSpinner from './components/Common/LoadingSpinner';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NGODashboard = lazy(() => import('./pages/ngo/NGODashboard'));
const VolunteerDashboard = lazy(() => import('./pages/volunteer/VolunteerDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CommunityDetail = lazy(() => import('./pages/admin/CommunityDetail'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminSetup = lazy(() => import('./pages/admin/Setup'));
const Profile = lazy(() => import('./pages/Profile'));

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/:role" element={<Register />} />
            <Route path="/setup" element={<AdminSetup />} />

            <Route path="/ngo/*" element={
              <ProtectedRoute allowedRoles={['ngo']}>
                <NGODashboard />
              </ProtectedRoute>
            } />

            <Route path="/volunteer/*" element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            } />

            <Route path="/community/:communityId" element={
              <ProtectedRoute allowedRoles={['admin', 'ngo']}>
                <CommunityDetail />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
