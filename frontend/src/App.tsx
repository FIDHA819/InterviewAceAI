import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoutes';
import AuthPage from './Pages/authPages';
import ProfilePage from './Pages/ProfilePage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './Pages/Dashboard';
import CategoriesPage from './Pages/CategoriesPage';
import CreateInterviewPage from './Pages/CreateInterviewPage';                              

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
         <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"        element={<Dashboard />}       />
            <Route path="/interview"        element={<CategoriesPage />}  />
            <Route path="/interview/create" element={<CreateInterviewPage />} />
            <Route path="/sessions"         element={<div className="p-6 text-slate-500">Sessions — Day 5</div>}     />
            <Route path="/analytics"        element={<div className="p-6 text-slate-500">Analytics — Day 8</div>}    />
            <Route path="/resume"           element={<div className="p-6 text-slate-500">Resume — Day 9</div>}       />
            <Route path="/profile"          element={<ProfilePage />}     />
       
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}