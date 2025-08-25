import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/layout/Layout';
import ManagementDashboard from './components/management/ManagementDashboard';
import BoardDashboard from './components/board/BoardDashboard';
import HomeownerDashboard from './components/homeowner/HomeownerDashboard';
import RequestSubmission from './components/homeowner/RequestSubmission';
import RequestTracking from './components/homeowner/RequestTracking';
import FormCompletion from './components/homeowner/FormCompletion';
import NotificationCenter from './components/homeowner/NotificationCenter';
import { useAuth } from './contexts/AuthContext';

// Placeholder components for routes that need props
const RequestDetailsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Request Details</h1>
        <p className="text-gray-600">Select a request from the tracking page to view details.</p>
      </div>
    </div>
  );
};

const CCRReviewPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">CC&R Review</h1>
        <p className="text-gray-600">Review community covenants, conditions, and restrictions.</p>
      </div>
    </div>
  );
};

const AppealRequestPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Appeal Request</h1>
        <p className="text-gray-600">Submit an appeal for a rejected request.</p>
      </div>
    </div>
  );
};

const VotingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Board Voting</h1>
        <p className="text-gray-600">Board voting interface for request approvals.</p>
      </div>
    </div>
  );
};

// Dashboard component that routes based on user role
const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading HOA Connect...</p>
        </div>
      </div>
    );
  }

  switch (currentUser.role) {
    case 'management':
      return <ManagementDashboard />;
    case 'board_member':
      return <BoardDashboard />;
    case 'homeowner':
    default:
      return <HomeownerDashboard />;
  }
};

// Main App component with providers and routing
const AppContent: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/homeowner" element={<Dashboard />} />
          <Route path="/homeowner/submit" element={<RequestSubmission />} />
          <Route path="/homeowner/requests" element={<RequestTracking />} />
          <Route path="/homeowner/requests/:id" element={<RequestDetailsPage />} />
          <Route path="/homeowner/forms" element={<FormCompletion />} />
          <Route path="/homeowner/notifications" element={<NotificationCenter />} />
          <Route path="/homeowner/ccr-review" element={<CCRReviewPage />} />
          <Route path="/homeowner/appeal" element={<AppealRequestPage />} />
          <Route path="/management" element={<ManagementDashboard />} />
          <Route path="/board" element={<BoardDashboard />} />
          <Route path="/board/voting" element={<VotingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </DemoProvider>
    </AuthProvider>
  );
}

export default App;
