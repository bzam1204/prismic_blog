import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req : NextRequest) {
  const formData = await req.formData();
  const payload = formData.get("payload");

  if (!payload) {
    throw new Error("Invalid payload");
  }

  const { response_url, actions, user } = JSON.parse(payload.toString());

  console.log({ response_url, actions, user });

  let res = "";

  if (actions[0].action_id === "approve_comment") {
    res = await approveComment(user.id, actions[0].value);
  } else if (actions[0].action_id === "delete_comment") {
    res = await deleteComment(user.id, actions[0].value);
  }

  await respondToSlack(response_url, res, actions[0].action_id);

  return new NextResponse(null, {
    status: 200,
  });
}

// Delete comment from Supabase
const deleteComment = async (userID : string, id : string) => {
  const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", id);

  if (error) {
    return `Error deleting comment(${id})!`;
  } else {
    return `Comment (${id}) deleted by *<@${userID}>*!`;
  }
};

const approveComment = async (userID : string, id : string) => {
      const { error } = await supabase
          .from("comments")
          .update({ published: true })
          .eq("id", id);

      if (error) {
        return `Error approving comment(${id})!`;
      } else {
        const comment = await supabase
            .from("comments")
            .select("post_uid")
            .eq("id", id)
        if (comment.error || comment.data.length === 0) {
          return `Error approving comment(${id})!`;
        }

        const BASE_URL = process.env.DEVELOPMENT_BASE_URL ?? process.env.BASE_URL;
        const url = BASE_URL + `/api/comments/revalidate?path=/blog/${comment.data[0].post_uid}`;

        await fetch(url, { next: { revalidate: 0 } })

        console.log({ fn: approveComment, data: comment.data, revalidatePath: `/blog/${comment.data[0].post_uid}`, url });

        revalidatePath(`/blog/${comment.data[0].post_uid}`);

        return `Comment (<https://supabase.com/dashboard/project/lkkcmplesxelxnvwjehm/editor/29246|${id}>) approved by *<@${userID}>*!`;
      }
    }
;

// Responde to Slack  with a message
const respondToSlack = async (responseURL : string, text : string, type : string) => {
  await fetch(responseURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${
                type === "approve_comment" ? "Approvement" : "Deletion"
            } successfull! ${
                type === "approve_comment"
                    ? ":white_check_mark:"
                    : ":octagonal_sign:"
            }`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: text,
          },
        },
      ],
      response_type: "in_channel",
    }),
  });
};
