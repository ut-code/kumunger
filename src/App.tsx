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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="forms/new" element={<FormBuilder />} />
          <Route path="forms/:id" element={<FormDetail />} />
          <Route path="forms/:id/edit" element={<FormBuilder />} />
          <Route path="forms/:id/submissions" element={<Submissions />} />
          <Route path="forms/:id/assignment" element={<ShiftAssignment />} />
          <Route path="templates" element={<Templates />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/submit/:formId" element={<SubmitForm />} />
        <Route path="/shift/:assignmentId" element={<ViewShift />} />
      </Routes>
    </Router>
  );
}

export default App;