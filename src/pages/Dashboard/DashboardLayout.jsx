import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar/Sidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader/DashboardHeader';

export default function DashboardLayout() {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader />
        <main id="main" className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
