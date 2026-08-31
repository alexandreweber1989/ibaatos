import { supabase } from "./src/integrations/supabase/client";

async function test() {
  const { data, error } = await supabase
    .from("mesa_members")
    .select("mesa_id, user_id, role, profiles:profiles(full_name, gender)")
    .limit(1);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

test();
