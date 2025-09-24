import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import Navbar from './components/Layout/Navbar';
import HomeView from './components/Views/HomeView';
import MyBooksView from './components/Views/MyBooksView';
import RequestsView from './components/Views/RequestsView';
import ProfileView from './components/Views/ProfileView';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 flex items-center space-x-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 font-medium">Loading BookExchange...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'my-books':
        return <MyBooksView />;
      case 'requests':
        return <RequestsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      <main>
        {renderView()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;