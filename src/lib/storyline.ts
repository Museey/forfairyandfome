export type StorylineScene = {
  id: string;
  scene: string;
  voice: string;
  text: string;
};

// Only used as a React list key / in-editor identifier, never as a DB key —
// no need for crypto.randomUUID(), which is unavailable outside secure
// contexts (breaks over plain http:// on a LAN IP, e.g. testing on a phone).
function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyScene(): StorylineScene {
  return {
    id: generateId(),
    scene: "",
    voice: "",
    text: "",
  };
}

export function formatScenesAsText(scenes: StorylineScene[]): string {
  return scenes
    .map((scene, index) => {
      const lines = [`ซีนที่ ${index + 1}`];
      if (scene.scene.trim()) lines.push(`ซีน: ${scene.scene.trim()}`);
      if (scene.voice.trim()) lines.push(`Voice: ${scene.voice.trim()}`);
      if (scene.text.trim()) lines.push(`Text: ${scene.text.trim()}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function parseScenes(value: unknown): StorylineScene[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .map((s) => ({
      id: typeof s.id === "string" ? s.id : generateId(),
      scene: typeof s.scene === "string" ? s.scene : "",
      voice: typeof s.voice === "string" ? s.voice : "",
      text: typeof s.text === "string" ? s.text : "",
    }));
}
