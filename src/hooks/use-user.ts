"use client";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { User } from "@/types";
import { useEffect, useState } from "react";

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(hasSupabaseEnv());

    useEffect(() => {
        const supabase = createClient();

        if (!supabase) {
            return;
        }

        // Get initial user
        const getUser = async () => {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();

            if (authUser) {
                // Get user profile from users table
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", authUser.id)
                    .single();

                setUser(profile ?? null);
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        getUser();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();

                setUser(profile);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { user, loading };
}
