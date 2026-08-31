import { Composer } from "@/components/timeline/composer";
import { PostItem } from "@/components/timeline/post-item";
import { HistoryPost } from "@/components/board/history-post";
import { BOARD_TOPIC_LABEL, BOARD_TOPIC_PLACEHOLDER } from "@/lib/board";
import type { BoardTopic } from "@/generated/prisma/enums";
import type { FeedItem } from "@/lib/feed";

function CardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-card p-3">
      <h2 className="mb-3 text-sm font-medium text-text-muted">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

/**
 * Reminder is the two-way board: each person keeps one active note, so you
 * see theirs and can replace your own.
 */
export function ReminderCard({
  otherUserName,
  theirPost,
  myPost,
  onPost,
  onDelete,
}: {
  otherUserName: string;
  theirPost?: FeedItem;
  myPost?: FeedItem;
  onPost: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
}) {
  return (
    <CardShell title={BOARD_TOPIC_LABEL.REMINDER}>
      <div>
        <p className="mb-2 text-xs font-medium text-text-faint">
          จาก {otherUserName}
        </p>
        {theirPost ? (
          <PostItem item={theirPost} onDelete={onDelete} />
        ) : (
          <p className="text-sm text-text-faint">ยังไม่มีข้อความ</p>
        )}
      </div>

      <div className="border-t border-border" />

      <div>
        <p className="mb-2 text-xs font-medium text-text-faint">
          ถึง {otherUserName}
        </p>
        <Composer
          action={onPost}
          placeholder={BOARD_TOPIC_PLACEHOLDER.REMINDER}
        />
        {myPost && (
          <div className="mt-2 opacity-70">
            <PostItem item={myPost} onDelete={onDelete} />
          </div>
        )}
      </div>
    </CardShell>
  );
}

/**
 * Content and Slip are one-way boards — only one person posts, and every post
 * is kept, newest expanded with older ones collapsed by date.
 */
export function TopicCard({
  topic,
  canPost,
  counterpartName,
  posts,
  onPost,
  onDelete,
}: {
  topic: Extract<BoardTopic, "CONTENT" | "SLIP">;
  canPost: boolean;
  counterpartName: string;
  posts: FeedItem[];
  onPost: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
}) {
  return (
    <CardShell title={BOARD_TOPIC_LABEL[topic]}>
      {canPost ? (
        <div>
          <p className="mb-2 text-xs font-medium text-text-faint">
            ถึง {counterpartName}
          </p>
          <Composer
            action={onPost}
            placeholder={BOARD_TOPIC_PLACEHOLDER[topic]}
          />
        </div>
      ) : (
        <p className="text-xs font-medium text-text-faint">
          จาก {counterpartName}
        </p>
      )}

      {posts.length === 0 ? (
        <p className="text-sm text-text-faint">ยังไม่มีข้อความ</p>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((post, index) => (
            <HistoryPost
              key={post.id}
              item={post}
              defaultOpen={index === 0}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </CardShell>
  );
}
