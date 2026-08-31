import { prisma } from "@/lib/prisma";
import { groupFeedRows, type RawFeedRow } from "@/lib/feed";
import { ReminderCard, TopicCard } from "@/components/board/board-card";
import {
  addContent,
  addReminder,
  addSlip,
  deleteBoardPost,
} from "@/app/(app)/board-actions";
import { requireCurrentUser } from "@/lib/auth";
import { canPostToTopic } from "@/lib/board";
import type { BoardTopic } from "@/generated/prisma/enums";

type BoardRow = {
  id: string;
  topic: BoardTopic;
  groupId: string | null;
  authorId: string;
  type: string;
  content: string | null;
  fileUrl: string | null;
  createdAt: Date;
  author: { name: string; colorTag: string };
};

function toFeedRow(row: BoardRow): RawFeedRow {
  return {
    id: row.id,
    groupId: row.groupId,
    type: row.type,
    body: row.content,
    attachmentUrl: row.type === "LINK" ? null : row.fileUrl,
    linkUrl: row.type === "LINK" ? row.fileUrl : null,
    createdAt: row.createdAt,
    author: row.author,
  };
}

export default async function TodayPage() {
  const currentUser = await requireCurrentUser();

  const [users, boardPosts] = await Promise.all([
    prisma.user.findMany(),
    prisma.boardPost.findMany({
      include: { author: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    }),
  ]);

  const otherUser = users.find((u) => u.id !== currentUser.id) ?? null;
  const otherUserName = otherUser?.name ?? "-";

  const byTopic = (topic: BoardTopic) =>
    boardPosts.filter((p) => p.topic === topic);

  const reminders = byTopic("REMINDER");
  const myReminder = groupFeedRows(
    reminders.filter((r) => r.authorId === currentUser.id).map(toFeedRow),
  )[0];
  const theirReminder = otherUser
    ? groupFeedRows(
        reminders.filter((r) => r.authorId === otherUser.id).map(toFeedRow),
      )[0]
    : undefined;

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2 pb-6">
      <ReminderCard
        otherUserName={otherUserName}
        theirPost={theirReminder}
        myPost={myReminder}
        onPost={addReminder}
        onDelete={deleteBoardPost}
      />

      <TopicCard
        topic="CONTENT"
        canPost={canPostToTopic("CONTENT", currentUser.role)}
        counterpartName={otherUserName}
        posts={groupFeedRows(byTopic("CONTENT").map(toFeedRow))}
        onPost={addContent}
        onDelete={deleteBoardPost}
      />

      <TopicCard
        topic="SLIP"
        canPost={canPostToTopic("SLIP", currentUser.role)}
        counterpartName={otherUserName}
        posts={groupFeedRows(byTopic("SLIP").map(toFeedRow))}
        onPost={addSlip}
        onDelete={deleteBoardPost}
      />
    </div>
  );
}
