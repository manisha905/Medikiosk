import { Link, NavLink } from 'react-router-dom';
import logo from '../../../assets/logos/mediokiosk-icon.png';
import { APP_NAME, DEPARTMENT, PORTAL_NAME } from '../../../utils/constants';
import Button from '../Button/Button';
import './Header.css';

export default function Header() {
  return (
    <>
      <div className="gov-strip">
        <span>Government of India · {DEPARTMENT}</span>
        <nav>
          <a href="#main">Skip to content</a>
          <span>English</span>
          <span>हिन्दी</span>
        </nav>
      </div>
      <div className="tricolor" aria-hidden="true"><i /><i /><i /></div>
      <header className="site-header">
        <Link className="brand" to="/">
          <img src={logo} alt="" />
          <span>
            <b>{APP_NAME}</b>
            <small>{PORTAL_NAME}</small>
          </span>
        </Link>
        <nav className="main-nav">
          <NavLink to="/">Home</NavLink>
          <a href="#services">Citizen services</a>
          <a href="#how-it-works">How it works</a>
          <a href="#security">Security</a>
        </nav>
        <div className="header-actions">
          <Link to="/login" className="text-link">Citizen login</Link>
          <Link to="/register"><Button>Register / Verify identity</Button></Link>
        </div>
      </header>
    </>
  );
}
