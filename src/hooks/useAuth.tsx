import { useState, useEffect, createContext, useContext } from "react";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  session: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials
const VALID_CREDENTIALS = [
  { email: "atomicIT@gmail.com", password: "atomic IT" },
  { email: "mokhek3ejja@gmail.com", password: "healthylifeSTYLE" }
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const validUser = VALID_CREDENTIALS.find(
      cred => cred.email === email && cred.password === password
    );

    if (validUser) {
      const user = { id: email, email };
      setUser(user);
      localStorage.setItem('auth_user', JSON.stringify(user));
      return { error: null };
    } else {
      return { error: "Invalid email or password" };
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, session: user, loading, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};