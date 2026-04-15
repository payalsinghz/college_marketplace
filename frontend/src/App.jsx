import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color: 'var(--accent-primary)'}}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Dashboard /> : <LandingPage />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/user/:id" element={user ? <UserProfile /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
