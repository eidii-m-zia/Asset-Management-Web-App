import React, { createContext, useContext, useEffect, useState } from "react";

export interface AppUser {
  id: string;
  username: string;
  role: "admin" | "viewer";
}

interface StoredUser extends AppUser {
  password: string;
}

interface CredentialUpdateInput {
  currentPassword: string;
  username: string;
  newPassword: string;
}

interface AuthContextType {
  user: AppUser | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateCredentials: (input: CredentialUpdateInput) => {
    success: boolean;
    message: string;
  };
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

function setStoredUsers(users: StoredUser[]) {
  localStorage.setItem("appUsers", JSON.stringify(users));
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

  useEffect(() => {
    const users = getStoredUsers();
    if (!localStorage.getItem("appUsers")) {
      setStoredUsers(users);
    }
  }, []);

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

  const updateCredentials = (input: CredentialUpdateInput) => {
    if (!user) {
      return { success: false, message: "You must be logged in to update credentials." };
    }

    const username = input.username.trim();
    const newPassword = input.newPassword.trim();

    if (!username) {
      return { success: false, message: "Username is required." };
    }

    if (newPassword.length < 4) {
      return { success: false, message: "Password must be at least 4 characters long." };
    }

    const users = getStoredUsers();
    const currentStoredUser = users.find((storedUser) => storedUser.id === user.id);

    if (!currentStoredUser) {
      return { success: false, message: "Current user account was not found." };
    }

    if (currentStoredUser.password !== input.currentPassword) {
      return { success: false, message: "Current password is incorrect." };
    }

    const duplicateUsername = users.find(
      (storedUser) =>
        storedUser.id !== user.id &&
        storedUser.username.toLowerCase() === username.toLowerCase()
    );

    if (duplicateUsername) {
      return { success: false, message: "That username is already in use." };
    }

    const updatedUsers = users.map((storedUser) =>
      storedUser.id === user.id
        ? {
            ...storedUser,
            username,
            password: newPassword,
          }
        : storedUser
    );

    const updatedUser: AppUser = {
      id: user.id,
      username,
      role: user.role,
    };

    setStoredUsers(updatedUsers);
    setUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    return { success: true, message: "Account details updated successfully." };
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, login, logout, updateCredentials }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
