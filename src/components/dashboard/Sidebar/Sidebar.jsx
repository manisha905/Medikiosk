import { NavLink } from 'react-router-dom';
import { FileText, History, LayoutDashboard, Sparkles, Upload } from 'lucide-react';
import logo from '../../../assets/logos/mediokiosk-icon.png';
import { APP_NAME } from '../../../utils/constants';
import './Sidebar.css';

const links = [
  ['/dashboard', LayoutDashboard, 'Overview'],
  ['/dashboard/upload', Upload, 'Upload'],
  ['/dashboard/records', FileText, 'View details'],
  ['/dashboard/history', History, 'Access history'],
  ['/dashboard/assistant', Sparkles, 'Health assistant'],
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="" />
        {APP_NAME}
      </div>
      <div className="sidebar-label">Citizen workspace</div>
      {links.map(([to, Icon, label]) => (
        <NavLink end={to === '/dashboard'} key={to} to={to}>
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
      <div className="sidebar-help">
        <b>Helpdesk</b>
        <span>Use Health assistant for portal guidance. For medical advice, consult a registered practitioner.</span>
      </div>
    </aside>
  );
}
