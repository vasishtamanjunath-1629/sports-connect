import { supabase } from "@/integrations/supabase/client";

export async function uploadFile(bucket: string, userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export const initials = (name?: string | null) =>
  (name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
