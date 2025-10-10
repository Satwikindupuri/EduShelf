import React, { useEffect,useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth/AuthForm';
import Navbar from './components/Layout/Navbar';
import HomeView from './components/Views/HomeView';
import MyBooksView from './components/Views/MyBooksView';
import RequestsView from './components/Views/RequestsView';
import ProfileView from './components/Views/ProfileView';
import EarnMore from './components/Views/EarnMore';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [darkMode, setDarkMode] = useState(false); // Global dark mode state

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex items-center space-x-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 dark:text-gray-200 font-medium">Loading EduShelf...</span>
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
        return <HomeView darkMode={darkMode} />;
      case 'my-books':
        return <MyBooksView/>;
      case 'requests':
        return <RequestsView/>;
      case 'profile':
        return <ProfileView/>;
      case 'Earn-More':
        return <EarnMore />;
      default:
        return <HomeView darkMode={darkMode} />;
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Navbar
          currentView={currentView}
          onViewChange={setCurrentView}
          // darkMode={darkMode}
          // setDarkMode={setDarkMode}
        />
        <main>{renderView()}</main>
      </div>
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
