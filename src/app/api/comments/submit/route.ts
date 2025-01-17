import { supabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req : NextRequest) {
  const body = await req.json();

  const { post_id, email, comment, nickname } = body;

  const { error } = await supabase
      .from("comments")
      .insert({
        post_id,
        email,
        nickname,
        payload: comment,
      })
      .select("id");

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
  });
}
