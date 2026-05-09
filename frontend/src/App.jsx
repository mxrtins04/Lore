// Copyright (c) 2026 mxrtins04
// https://github.com/mxrtins04
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Placeholder Pages
import Dashboard from './pages/Dashboard';
import Buckets from './pages/Buckets';
import Conversations from './pages/Conversations';
import ConversationDetail from './pages/ConversationDetail';
import Generate from './pages/Generate';
import PersonalContext from './pages/PersonalContext';
import GenerationHistory from './pages/GenerationHistory';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/buckets" element={<Buckets />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/conversations/:id" element={<ConversationDetail />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/context" element={<PersonalContext />} />
          <Route path="/history" element={<GenerationHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
