import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Cache to prevent re-fetching the same user's role repeatedly
  const lastUserRef = useRef<string | null>(null);
  const lastRoleRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const fetchRole = async (currentUser: User) => {
      // Memory cache check using Refs to avoid closure staleness
      if (
        lastUserRef.current === currentUser.id &&
        lastRoleRef.current !== null
      ) {
        return lastRoleRef.current;
      }

      try {
        // 1. Try metadata
        let userRole =
          currentUser.app_metadata?.role || currentUser.user_metadata?.role;

        // 2. Try table checks if metadata doesn't explicitly say 'admin'
        if (userRole !== 'admin') {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentUser.id)
              .maybeSingle(); // Use maybeSingle to avoid 406 errors if 0 rows

            if (profile) {
              userRole = profile.role;
            }
          } catch (e) {
            // silently ignore
          }
        }

        // 3. Fallback to 'users' table
        if (!userRole) {
          try {
            const { data: publicUser } = await supabase
              .from('users')
              .select('role')
              .eq('id', currentUser.id)
              .maybeSingle();

            if (publicUser) {
              userRole = publicUser.role;
            }
          } catch (e) {
            // silently ignore
          }
        }

        const finalRole = userRole || 'user';
        lastUserRef.current = currentUser.id;
        lastRoleRef.current = finalRole;
        return finalRole;
      } catch (err) {
        return 'user'; // Fail safe
      }
    };

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (mounted) {
          setUser(user);
          if (user) {
            const fetchedRole = await fetchRole(user);
            if (mounted) setRole(fetchedRole);
          } else {
            setRole(null);
            lastUserRef.current = null;
            lastRoleRef.current = null;
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        if (mounted) setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getUser();

    // Remove onAuthStateChange listener to prevent infinite loops/hot-reload cycles
    // We will rely on the initial fetch. Most auth state changes (login/logout) trigger a page reload or redirect anyway.

    return () => {
      mounted = false;
    };
  }, []);

  return { role, loading, user };
}
