import { FileText, Link as LinkIcon, Settings2, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/date";
import { UserAvatar } from "@/components/user-avatar";
import { PhotoAttachment } from "@/components/timeline/photo-attachment";
import type { FeedItem } from "@/lib/feed";

export function PostItem({
  item,
  jobId,
  onDelete,
}: {
  item: FeedItem;
  jobId?: string;
  onDelete?: (formData: FormData) => Promise<void>;
}) {
  if (item.isSystem) {
    return (
      <div className="flex items-center gap-2 py-1.5 text-xs text-text-faint">
        <Settings2 className="h-3.5 w-3.5 shrink-0" />
        <span>{item.body}</span>
        <span className="ml-auto shrink-0">
          {formatDateTime(item.createdAt)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-card border border-border bg-card p-3">
      <UserAvatar name={item.author.name} colorTag={item.author.colorTag} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.author.name}</span>
          <span className="text-[11px] text-text-faint">
            {formatDateTime(item.createdAt)}
          </span>
          {onDelete && (
            <form action={onDelete} className="ml-auto">
              <input type="hidden" name="id" value={item.id} />
              {jobId && <input type="hidden" name="jobId" value={jobId} />}
              <button
                type="submit"
                className="text-text-faint transition active:text-danger"
                aria-label="ลบ"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>

        {item.body && (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-text">
            {item.body}
          </p>
        )}

        {item.attachments.map((attachment) => {
          if (attachment.type === "PHOTO") {
            return <PhotoAttachment key={attachment.id} url={attachment.url} />;
          }
          if (attachment.type === "FILE") {
            return (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-teal"
              >
                <FileText className="h-4 w-4 shrink-0" />
                เปิดไฟล์แนบ
              </a>
            );
          }
          return (
            <a
              key={attachment.id}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 truncate rounded-xl border border-border bg-bg px-3 py-2 text-sm text-teal"
            >
              <LinkIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{attachment.url}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
