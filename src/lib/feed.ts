export type FeedAttachment = {
  id: string;
  type: "PHOTO" | "FILE" | "LINK";
  url: string;
};

export type FeedItem = {
  id: string;
  isSystem: boolean;
  body: string | null;
  attachments: FeedAttachment[];
  createdAt: Date;
  author: { name: string; colorTag: string };
};

export type RawFeedRow = {
  id: string;
  groupId: string | null;
  type: string;
  body: string | null;
  attachmentUrl: string | null;
  linkUrl: string | null;
  createdAt: Date;
  author: { name: string; colorTag: string };
};

export function groupFeedRows(rows: RawFeedRow[]): FeedItem[] {
  const groups = new Map<string, FeedItem>();
  const order: string[] = [];

  for (const row of rows) {
    const key = row.groupId ?? row.id;
    let group = groups.get(key);
    if (!group) {
      group = {
        id: key,
        isSystem: row.type === "SYSTEM",
        body: null,
        attachments: [],
        createdAt: row.createdAt,
        author: row.author,
      };
      groups.set(key, group);
      order.push(key);
    }

    if (row.type === "TEXT" || row.type === "SYSTEM") {
      group.body = row.body;
    } else if (row.type === "PHOTO" && row.attachmentUrl) {
      group.attachments.push({ id: row.id, type: "PHOTO", url: row.attachmentUrl });
    } else if (row.type === "FILE" && row.attachmentUrl) {
      group.attachments.push({ id: row.id, type: "FILE", url: row.attachmentUrl });
    } else if (row.type === "LINK" && row.linkUrl) {
      group.attachments.push({ id: row.id, type: "LINK", url: row.linkUrl });
    }
  }

  return order.map((key) => groups.get(key)!);
}
