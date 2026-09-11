import { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';
import { healthRecordService } from '../services/healthRecordService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getUser());

  const completeRegistration = (profile) => {
    const saved = authService.save(profile);
    healthRecordService.seedHistory(profile.healthId);
    setUser(saved);
    return saved;
  };

  const signIn = (profile) => completeRegistration(profile);

  const signOut = () => {
    authService.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, completeRegistration, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
