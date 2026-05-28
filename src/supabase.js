import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://efvnqqaflxcaccbpiztx.supabase.co";

const supabaseKey =
    "sb_publishable_0iiaJGlfR7auB8VUpylFdQ_tijAhk8i";

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
);