import { supabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req : NextRequest) {
  const body = await req.json();

  const { post_id, email, comment, nickname, uid } = body;

  const { data, error } = await supabase
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

  const slackRes = await fetch(
      process.env.SLACK_COMMENT_URL ?? "",
      {
        method: "POST",
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "New comment waiting for approval! :meow_party:",
                emoji: true,
              },
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Blog post:*\nhttp://localhost:3000/blog/${uid}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Comment ID:*\n<https://supabase.com/dashboard/project/lkkcmplesxelxnvwjehm/editor/29246|${post_id}>`,
                },
              ],
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Comment:*\n${comment}`,
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `*Submitted by:* ${nickname} (<mailto:${email}|${email}>)`,
                },
              ],
            },
            {
              type: "divider",
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    emoji: true,
                    text: "Approve",
                  },
                  style: "primary",
                  action_id: "approve_comment",
                  value: data[0].id,
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    emoji: true,
                    text: "Delete",
                  },
                  style: "danger",
                  action_id: "delete_comment",
                  value: data[0].id,
                  confirm: {
                    title: {
                      type: "plain_text",
                      text: "Are you sure?",
                    },
                    text: {
                      type: "mrkdwn",
                      text: "This will delete the comment permanently.",
                    },
                    confirm: {
                      type: "plain_text",
                      text: "Delete",
                    },
                    deny: {
                      type: "plain_text",
                      text: "Cancel",
                    },
                    style: "danger",
                  },
                },
              ],
            },
          ],
        }),
      }
  );
 
  console.log({ fn: 'slackPost', data: slackRes })
  
  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
  });
}
