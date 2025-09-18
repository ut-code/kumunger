import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { FormBuilder } from './pages/FormBuilder';
import { FormDetail } from './pages/FormDetail';
import { Submissions } from './pages/Submissions';
import { ShiftAssignment } from './pages/ShiftAssignment';
import { SubmitForm } from './pages/SubmitForm';
import { ViewShift } from './pages/ViewShift';
import { Templates } from './pages/Templates';
import { Settings } from './pages/Settings';
import { Signin } from './pages/Signin';
import { Signup } from './pages/Signup';
import { PrivateRoute, AuthRoute } from './components/AuthRouter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="forms/new" element={<PrivateRoute><FormBuilder /></PrivateRoute>} />
          <Route path="forms/:id" element={<PrivateRoute><FormDetail /></PrivateRoute>} />
          <Route path="forms/:id/edit" element={<PrivateRoute><FormBuilder /></PrivateRoute>} />
          <Route path="forms/:id/submissions" element={<PrivateRoute><Submissions /></PrivateRoute>} />
          <Route path="forms/:id/assignment" element={<PrivateRoute><ShiftAssignment /></PrivateRoute>} />
          <Route path="templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
          <Route path="settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="signup" element={<AuthRoute><Signup /></AuthRoute>} />
          <Route path="signin" element={<AuthRoute><Signin /></AuthRoute>} />
        </Route>
        <Route path="/submit/:formId" element={<SubmitForm />} />
        <Route path="/shift/:assignmentId" element={<ViewShift />} />
      </Routes>
    </Router>
  );
}

export default App;