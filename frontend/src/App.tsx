import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoutes';
import AuthPage from './Pages/authPages';
import ProfilePage from './Pages/ProfilePage';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './Pages/Dashboard';
import CategoriesPage from './Pages/CategoriesPage';
import CreateInterviewPage from './Pages/CreateInterviewPage';       
import SessionPage from './Pages/SessionPage'; 
import SessionListPage from './Pages/SessionListPage';         
import FeedbackPage from './Pages/FeedbackPage';  
import AnalyticsPage from './Pages/AnalyticPage';       
import ResumePage from './Pages/ResumePage';    

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
         <Route element={<ProtectedRoute />}>
           <Route path="/session/:interviewId" element={<SessionPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"        element={<Dashboard />}       />
            <Route path="/interview"        element={<CategoriesPage />}  />
            <Route path="/interview/create" element={<CreateInterviewPage />} />
            <Route path="/sessions"      element={<SessionListPage />} />
            <Route path="/feedback/:sessionId" element={<FeedbackPage />} />
            <Route path="/analytics"        element={<AnalyticsPage />}    />
            <Route path="/resume"           element={<ResumePage />}       />
            <Route path="/profile"          element={<ProfilePage />}     />
       
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}