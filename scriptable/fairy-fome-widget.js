// Fairy & Fome — iOS home screen widget for the Scriptable app.
//
// Setup (per phone):
//   1. Install "Scriptable" from the App Store.
//   2. Open the app → + → paste this whole file → name it "Fairy & Fome".
//   3. Replace WIDGET_URL below with the link from ตั้งค่า → Widget บน iPhone.
//   4. On the home screen: long-press → + → Scriptable → pick a size →
//      add it, then long-press the widget → Edit Widget → Script = this one.
//
// One script covers every widget size — Scriptable tells it which size is
// being drawn, so the large widget just shows more. iOS decides when to
// refresh (usually every 15-30 min), so this is a glance, not a live feed —
// push notifications are still what tell you the moment something happens.

const WIDGET_URL = "PASTE_YOUR_WIDGET_URL_HERE";
const APP_URL = "https://forfairyandfome.vercel.app/";

const SKY = new Color("#C1E1F0");
const WINE = new Color("#852936");
const INK = new Color("#3D2B2E");
const MUTED = new Color("#8A7679");
const TEAL = new Color("#0E7C6B");

// How much fits on each widget size. `notes` are the boards printed under
// the agenda, in order. A widget has a fixed height and clips anything that
// doesn't fit rather than scrolling, so these are deliberately conservative —
// if a size looks too empty on your phone, raise its numbers.
const LAYOUT = {
  small: { today: 2, tomorrow: 1, notes: [], noteLines: 1 },
  medium: { today: 3, tomorrow: 3, notes: ["reminder"], noteLines: 2 },
  large: {
    today: 4,
    tomorrow: 3,
    notes: ["reminder", "content", "slip"],
    noteLines: 1,
  },
};

const NOTE_LABEL = {
  reminder: "เตือนความจำ",
  content: "Content",
  slip: "Slip",
};

async function loadData() {
  const req = new Request(WIDGET_URL);
  req.timeoutInterval = 15;
  return req.loadJSON();
}

function header(widget) {
  const title = widget.addText("Fairy & Fome");
  title.font = Font.mediumSystemFont(11);
  title.textColor = MUTED;
}

function agendaSection(widget, heading, events, maxRows) {
  const label = widget.addText(heading);
  label.font = Font.semiboldSystemFont(12);
  label.textColor = INK;
  widget.addSpacer(4);

  if (!events || events.length === 0) {
    const empty = widget.addText("ไม่มีนัดหมาย");
    empty.font = Font.systemFont(11);
    empty.textColor = MUTED;
    return;
  }

  for (const event of events.slice(0, maxRows)) {
    const row = widget.addStack();
    row.centerAlignContent();
    row.spacing = 5;

    const dot = row.addText("●");
    dot.font = Font.systemFont(7);
    dot.textColor = new Color(event.color ?? "#8E8E93");

    const text = row.addText(`${event.title} · ${event.label}`);
    text.font = Font.systemFont(11);
    text.textColor = INK;
    text.lineLimit = 1;

    widget.addSpacer(3);
  }

  const extra = events.length - maxRows;
  if (extra > 0) {
    const more = widget.addText(`+ อีก ${extra} รายการ`);
    more.font = Font.systemFont(10);
    more.textColor = MUTED;
  }
}

function noteSection(widget, label, note, lineLimit) {
  if (!note || !note.text) return;

  widget.addSpacer(6);
  const line = widget.addStack();
  line.layoutHorizontally();

  const bar = line.addText("▍");
  bar.font = Font.systemFont(11);
  bar.textColor = TEAL;

  const body = line.addStack();
  body.layoutVertically();
  body.spacing = 1;

  const from = body.addText(`${label} จาก ${note.from}`);
  from.font = Font.mediumSystemFont(9);
  from.textColor = MUTED;

  const text = body.addText(note.text);
  text.font = Font.systemFont(11);
  text.textColor = INK;
  text.lineLimit = lineLimit;
}

function buildWidget(data) {
  const widget = new ListWidget();
  widget.backgroundColor = SKY;
  widget.setPadding(12, 12, 12, 12);
  widget.url = APP_URL;
  widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  // extraLarge (iPad) has at least as much room as large.
  const layout =
    LAYOUT[config.widgetFamily] ??
    (config.widgetFamily === "extraLarge" ? LAYOUT.large : LAYOUT.medium);

  header(widget);
  widget.addSpacer(8);
  agendaSection(widget, "วันนี้", data.today, layout.today);
  widget.addSpacer(8);
  agendaSection(widget, "พรุ่งนี้", data.tomorrow, layout.tomorrow);

  for (const key of layout.notes) {
    noteSection(widget, NOTE_LABEL[key], data[key], layout.noteLines);
  }

  widget.addSpacer();
  return widget;
}

function errorWidget(message) {
  const widget = new ListWidget();
  widget.backgroundColor = SKY;
  widget.setPadding(12, 12, 12, 12);
  widget.url = APP_URL;
  widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);

  const title = widget.addText("Fairy & Fome");
  title.font = Font.mediumSystemFont(11);
  title.textColor = MUTED;
  widget.addSpacer(6);

  const text = widget.addText(message);
  text.font = Font.systemFont(11);
  text.textColor = WINE;
  text.lineLimit = 3;
  return widget;
}

let widget;
try {
  if (WIDGET_URL.startsWith("PASTE")) {
    widget = errorWidget("ยังไม่ได้ใส่ลิงก์ — ไปที่ ตั้งค่า → Widget บน iPhone");
  } else {
    widget = buildWidget(await loadData());
  }
} catch (error) {
  widget = errorWidget(`โหลดข้อมูลไม่ได้: ${error.message}`);
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
