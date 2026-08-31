import type { BoardTopic, Role } from "@/generated/prisma/enums";

export const BOARD_TOPIC_LABEL: Record<BoardTopic, string> = {
  REMINDER: "เตือนความจำ",
  CONTENT: "Content",
  SLIP: "Slip",
};

export const BOARD_TOPIC_PLACEHOLDER: Record<BoardTopic, string> = {
  REMINDER: "พิมพ์ข้อความ...",
  CONTENT: "แปะ Content (ข้อความ / รูป / ลิงก์ / ไฟล์)",
  SLIP: "แปะ Slip (ข้อความ / รูป / ลิงก์ / ไฟล์)",
};

/**
 * Which role may post to a topic — CONTENT is Fairy's to post and SLIP is
 * Fome's; the other person only reads. REMINDER is two-way, so it has no
 * restriction.
 */
export const BOARD_TOPIC_AUTHOR_ROLE: Record<BoardTopic, Role | null> = {
  REMINDER: null,
  CONTENT: "MANAGER",
  SLIP: "CREATOR",
};

/** REMINDER keeps only the latest post per author; the rest keep a history. */
export const BOARD_TOPIC_KEEPS_HISTORY: Record<BoardTopic, boolean> = {
  REMINDER: false,
  CONTENT: true,
  SLIP: true,
};

export function canPostToTopic(topic: BoardTopic, role: Role) {
  const required = BOARD_TOPIC_AUTHOR_ROLE[topic];
  return required === null || required === role;
}
