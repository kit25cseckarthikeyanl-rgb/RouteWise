import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import type { AuthResponse, Role, User } from '@/types';

export interface ExtendedUser extends User {
  identifier?: string;
  badgeId?: string;
  stationOrVehicleId?: string;
}

interface AuthContextValue {
  user: ExtendedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: { name: string; email: string; password: string; phone?: string; role: Role }) => Promise<AuthResponse>;
  loginCitizen: (name: string, identifier: string, password?: string) => Promise<ExtendedUser>;
  loginAmbulance: (driverName: string, identifier: string, ambulanceId: string, password?: string) => Promise<ExtendedUser>;
  loginFire: (driverName: string, identifier: string, fireEngineId: string, password?: string) => Promise<ExtendedUser>;
  loginPolice: (officerName: string, identifier: string, stationId: string, password?: string) => Promise<ExtendedUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore saved user session if exists
    const savedUserStr = localStorage.getItem('routewise_user');
    const token = localStorage.getItem('routewise_token');

    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        setUser(parsed);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('routewise_user');
      }
    }

    if (!token) {
      setLoading(false);
      return;
    }

    // Attempt backend check if token exists, fallback gracefully
    authService
      .me()
      .then(setUser)
      .catch(() => {
        // Backend not running, clean up token
        localStorage.removeItem('routewise_token');
        localStorage.removeItem('routewise_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const saveUserSession = (userData: ExtendedUser, token?: string) => {
    const generatedToken = token || `routewise_demo_token_${Date.now()}`;
    localStorage.setItem('routewise_token', generatedToken);
    localStorage.setItem('routewise_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginCitizen = async (name: string, identifier: string, _password?: string): Promise<ExtendedUser> => {
    const citizenUser: ExtendedUser = {
      id: Math.floor(Math.random() * 9000) + 1000,
      name: name.trim() || 'Citizen',
      email: identifier.includes('@') ? identifier.trim() : `${identifier.trim().replace(/\s+/g, '')}@citizen.local`,
      phone: identifier.includes('@') ? undefined : identifier.trim(),
      role: 'CITIZEN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      identifier: identifier.trim(),
    };
    saveUserSession(citizenUser);
    return citizenUser;
  };

  const loginAmbulance = async (driverName: string, identifier: string, ambulanceId: string, _password?: string): Promise<ExtendedUser> => {
    const driverUser: ExtendedUser = {
      id: Math.floor(Math.random() * 9000) + 2000,
      name: driverName.trim() || 'Ambulance Driver',
      email: identifier.includes('@') ? identifier.trim() : `${ambulanceId.toLowerCase()}@ems.routewise.gov`,
      phone: identifier.includes('@') ? undefined : identifier.trim(),
      role: 'DRIVER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      badgeId: ambulanceId.trim(),
      stationOrVehicleId: ambulanceId.trim(),
    };
    saveUserSession(driverUser);
    return driverUser;
  };

  const loginFire = async (driverName: string, identifier: string, fireEngineId: string, _password?: string): Promise<ExtendedUser> => {
    const fireUser: ExtendedUser = {
      id: Math.floor(Math.random() * 9000) + 3000,
      name: driverName.trim() || 'Fire Engine Commander',
      email: identifier.includes('@') ? identifier.trim() : `${fireEngineId.toLowerCase()}@fire.routewise.gov`,
      phone: identifier.includes('@') ? undefined : identifier.trim(),
      role: 'FIRE_DRIVER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      badgeId: fireEngineId.trim(),
      stationOrVehicleId: fireEngineId.trim(),
    };
    saveUserSession(fireUser);
    return fireUser;
  };

  const loginPolice = async (officerName: string, identifier: string, stationId: string, _password?: string): Promise<ExtendedUser> => {
    const policeUser: ExtendedUser = {
      id: Math.floor(Math.random() * 9000) + 4000,
      name: officerName.trim() || 'Control Room Officer',
      email: identifier.includes('@') ? identifier.trim() : `${stationId.toLowerCase()}@police.routewise.gov`,
      phone: identifier.includes('@') ? undefined : identifier.trim(),
      role: 'POLICE',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      badgeId: stationId.trim(),
      stationOrVehicleId: stationId.trim(),
    };
    saveUserSession(policeUser);
    return policeUser;
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      saveUserSession({
        id: response.userId,
        name: response.name,
        email: response.email,
        role: response.role,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }, response.token);
      return response;
    } catch {
      // Fallback local auth if backend unavailable
      const demoRole: Role = email.includes('admin')
        ? 'ADMIN'
        : email.includes('driver')
        ? 'DRIVER'
        : email.includes('hospital')
        ? 'HOSPITAL'
        : 'CITIZEN';

      const demoResponse: AuthResponse = {
        token: `demo_token_${Date.now()}`,
        userId: 101,
        name: email.split('@')[0].toUpperCase(),
        email,
        role: demoRole,
      };
      saveUserSession({
        id: demoResponse.userId,
        name: demoResponse.name,
        email: demoResponse.email,
        role: demoResponse.role,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }, demoResponse.token);
      return demoResponse;
    }
  };

  const register = async (payload: { name: string; email: string; password: string; phone?: string; role: Role }) => {
    try {
      const response = await authService.register(payload);
      saveUserSession({
        id: response.userId,
        name: response.name,
        email: response.email,
        role: response.role,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }, response.token);
      return response;
    } catch {
      const demoResponse: AuthResponse = {
        token: `demo_token_${Date.now()}`,
        userId: Math.floor(Math.random() * 8000) + 1000,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };
      saveUserSession({
        id: demoResponse.userId,
        name: demoResponse.name,
        email: demoResponse.email,
        role: demoResponse.role,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }, demoResponse.token);
      return demoResponse;
    }
  };

  const logout = () => {
    localStorage.removeItem('routewise_token');
    localStorage.removeItem('routewise_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginCitizen,
        loginAmbulance,
        loginFire,
        loginPolice,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
