import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  phone?: string; // optional to maintain backward compatibility
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid, firebaseUser.email || "");
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    const docRef = doc(db, "profiles", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setProfile(docSnap.data() as Profile);
    } else {
      // Create default profile if not exists
      const newProfile: Profile = {
        id: userId,
        name: email.split("@")[0],
        email,
        created_at: new Date().toISOString(),
      };
      await setDoc(docRef, newProfile);
      setProfile(newProfile);
    }
  };

  // Updated signUp to accept phone number
  const signUp = async (email: string, password: string, name: string, phone: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    if (res.user) {
      const newProfile: Profile = {
        id: res.user.uid,
        name,
        email,
        phone, // store phone
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, "profiles", res.user.uid), newProfile);
      setProfile(newProfile);
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOutUser = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const value = { user, profile, loading, signUp, signIn, signOutUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};































































// import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { User, Session } from '@supabase/supabase-js';
// import { supabase } from '../lib/supabase';

// interface Profile {
//   id: string;
//   name: string;
//   email: string;
//   created_at: string;
// }

// interface AuthContextType {
//   user: User | null;
//   profile: Profile | null;
//   session: Session | null;
//   loading: boolean;
//   signUp: (email: string, password: string, name: string) => Promise<void>;
//   signIn: (email: string, password: string) => Promise<void>;
//   signOut: () => Promise<void>;
// }

// export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within an AuthProvider");
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Get initial session
//     const init = async () => {
//       try {
//         const { data: { session }, error } = await supabase.auth.getSession();
//         if (error) {
//           console.error('Error getting session:', error);
//         }

//         setSession(session);
//         setUser(session?.user ?? null);

//         if (session?.user) {
//           await fetchProfile(session.user.id);
//         }
//       } catch (err) {
//         console.error('Unexpected error getting session:', err);
//       } finally {
//         setLoading(false); // ✅ Always clear loading
//       }
//     };

//     init();

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (_event, session) => {
//         try {
//           setSession(session);
//           setUser(session?.user ?? null);

//           if (session?.user) {
//             await fetchProfile(session.user.id);
//           } else {
//             setProfile(null);
//           }
//         } catch (err) {
//           console.error('Error in auth state change:', err);
//         } finally {
//           setLoading(false); // ✅ Always clear loading
//         }
//       }
//     );

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   const fetchProfile = async (userId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', userId)
//         .limit(1);

//       if (error) {
//         throw error;
//       }

//       setProfile(data && data.length > 0 ? data[0] : null);
//     } catch (error) {
//       console.error('Error fetching profile:', error);
//     }
//   };

//   const signUp = async (email: string, password: string, name: string) => {
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//     });

//     if (error) throw error;

//     if (data.user) {
//       // Create profile
//       const { error: profileError } = await supabase
//         .from('profiles')
//         .insert([
//           {
//             id: data.user.id,
//             name,
//             email,
//           },
//         ]);

//       if (profileError) throw profileError;
//     }
//   };

//   const signIn = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) throw error;
//   };

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) throw error;
//   };

//   const value = {
//     user,
//     profile,
//     session,
//     loading,
//     signUp,
//     signIn,
//     signOut,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };
