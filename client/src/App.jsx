import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import StudyPage from './pages/StudyPage';

function AppContent() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner">⏳</div>
                <p>Загрузка...</p>
            </div>
        );
    }

    return user ? <StudyPage /> : <AuthPage />;
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;