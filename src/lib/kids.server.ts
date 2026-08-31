import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function getChildrenHandler(data: { search?: string }) {
  let query = supabaseAdmin.from("kids_children").select("*");
  if (data?.search) {
    query = query.or(`full_name.ilike.%${data.search}%,nickname.ilike.%${data.search}%`);
  }
  const { data: children, error } = await query;
  if (error) throw error;
  return children;
}

export async function checkinChildHandler(data: {
  childId: string;
  sessionId: string;
  droppedByName?: string;
  securityCode: string;
  dayNotes?: string;
}) {
  const { data: checkin, error } = await supabaseAdmin
    .from("kids_checkins")
    .insert({
      child_id: data.childId,
      session_id: data.sessionId,
      dropped_by_name: data.droppedByName,
      security_code: data.securityCode,
      day_notes: data.dayNotes,
      status: "checked_in",
      checked_in_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return checkin;
}

export async function checkoutChildHandler(data: { checkinId: string; pickedUpByName?: string }) {
  const { data: checkin, error } = await supabaseAdmin
    .from("kids_checkins")
    .update({
      checked_out_at: new Date().toISOString(),
      picked_up_by_name: data.pickedUpByName,
      status: "checked_out",
    })
    .eq("id", data.checkinId)
    .select()
    .single();

  if (error) throw error;
  return checkin;
}
