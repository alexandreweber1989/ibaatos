import { supabase } from "./src/integrations/supabase/client";

async function test() {
  const { data, error } = await supabase
    .from("mesa_members")
    .select("mesa_id, user_id, role, profiles:profiles!user_id(full_name, gender)")
    .limit(1);

  if (error) {
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

test();
