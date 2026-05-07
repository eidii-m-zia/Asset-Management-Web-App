import React, { createContext, useContext, useState } from "react";

export interface AppUser {
  id: string;
  username: string;
  role: "admin" | "viewer";
}

interface StoredUser extends AppUser {
  password: string;
}

interface AuthContextType {
  user: AppUser | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const DEFAULT_USERS: StoredUser[] = [
  { id: "u-1", username: "admin", password: "admin123", role: "admin" },
];

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredUsers(): StoredUser[] {
  try {
    const s = localStorage.getItem("appUsers");
    return s ? JSON.parse(s) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const s = localStorage.getItem("currentUser");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const login = (username: string, password: string): boolean => {
    const users = getStoredUsers();
    const found = users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password
    );
    if (found) {
      const loggedUser: AppUser = {
        id: found.id,
        username: found.username,
        role: found.role,
      };
      setUser(loggedUser);
      localStorage.setItem("currentUser", JSON.stringify(loggedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
