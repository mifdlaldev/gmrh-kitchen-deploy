import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types";

type UserProfileInput = {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  role?: UserRole;
};

export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.role ?? null;
}

export async function upsertUserProfile(
  supabase: SupabaseClient,
  input: UserProfileInput
) {
  return supabase.from("users").upsert(
    {
      id: input.id,
      email: input.email,
      full_name: input.full_name,
      phone: input.phone ?? null,
      role: input.role ?? "customer",
    },
    {
      onConflict: "id",
    }
  );
}
