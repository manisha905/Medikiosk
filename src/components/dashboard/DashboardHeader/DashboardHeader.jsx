import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import './DashboardHeader.css';

export default function DashboardHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    signOut();
    navigate('/');
  };

  return (
    <header className="dashboard-header">
      <div>
        <p>National Health Services Portal</p>
        <h2>{user?.healthId || 'Citizen dashboard'}</h2>
      </div>
      <div className="user-tools">
        <span className="verified-chip">Identity verified</span>
        <div className="avatar">C</div>
        <button className="logout" onClick={logout} type="button">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </header>
  );
}
