import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { StorylineScene } from "@/lib/storyline";
import { resolveImageSource } from "@/lib/pdf/image-source";

const INK = "#16213E";
const MUTED = "#6B7280";
const ACCENT = "#0E7C6B";
const BORDER = "#D9DEE7";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Sarabun",
    color: INK,
    lineHeight: 1.5,
  },
  header: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 15,
    color: ACCENT,
    fontWeight: "bold",
  },
  meta: {
    marginBottom: 16,
    color: MUTED,
    fontSize: 9,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10.5,
    color: ACCENT,
    fontWeight: "bold",
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 3,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 10,
  },
  bulletText: {
    flex: 1,
  },
  plainText: {
    paddingLeft: 4,
  },
  productImages: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  productImage: {
    width: 110,
    height: 110,
    objectFit: "cover",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sceneCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  sceneTitle: {
    color: ACCENT,
    fontSize: 9.5,
    marginBottom: 3,
  },
  sceneRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  sceneLabel: {
    width: 40,
    color: MUTED,
  },
  sceneValue: {
    flex: 1,
  },
  emptyText: {
    // No italic Sarabun weight is registered (see fonts.ts) — react-pdf
    // fails to resolve fontStyle: "italic" without one, so keep this plain.
    color: MUTED,
    paddingLeft: 4,
  },
});

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return <Text style={styles.emptyText}>-</Text>;
  return (
    <>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow} wrap={false}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </>
  );
}

export type DetailsOfWorkPdfData = {
  job: {
    title: string;
    brandName: string;
    productName: string | null;
    createdAt: Date;
  };
  details: {
    sow: string | null;
    location: string | null;
    keyMessage: string[];
    doList: string[];
    dontList: string[];
    moodTone: string | null;
    dressCode: string | null;
    hashtags: string | null;
    productImages: string[];
    otherNotes: string | null;
  };
  approvedScenes: StorylineScene[] | null;
};

const MONTH_YEAR = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  year: "numeric",
  calendar: "gregory",
});

export function DetailsOfWorkDocument({ job, details, approvedScenes }: DetailsOfWorkPdfData) {
  return (
    <Document title={`Details of Work - ${job.brandName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Details – {job.brandName} [ {MONTH_YEAR.format(job.createdAt)} ]
          </Text>
        </View>

        <Text style={styles.meta}>{job.title}</Text>

        <Section label="Work Details (SOW)">
          <Text style={styles.plainText}>{details.sow || "-"}</Text>
        </Section>

        <Section label="Location">
          <Text style={styles.plainText}>{details.location || "-"}</Text>
        </Section>

        <Section label="Customer Details">
          <Bullets
            items={[
              `แบรนด์: ${job.brandName}`,
              `สินค้า: ${job.productName || "-"}`,
            ]}
          />
        </Section>

        <Section label="Key Message / Required">
          <Bullets items={details.keyMessage} />
        </Section>

        <Section label="Do">
          <Bullets items={details.doList} />
        </Section>

        <Section label="Don't">
          <Bullets items={details.dontList} />
        </Section>

        <Section label="Mood & Tone">
          <Text style={styles.plainText}>{details.moodTone || "-"}</Text>
        </Section>

        <Section label="Dress Code">
          <Text style={styles.plainText}>{details.dressCode || "-"}</Text>
        </Section>

        <Section label="Captions / Hashtags">
          <Text style={styles.plainText}>{details.hashtags || "-"}</Text>
        </Section>

        {details.productImages.length > 0 && (
          <Section label="Product Details">
            <View style={styles.productImages}>
              {details.productImages.map((url, i) => (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image key={i} src={resolveImageSource(url)} style={styles.productImage} />
              ))}
            </View>
          </Section>
        )}

        <Section label="Other">
          <Text style={styles.plainText}>{details.otherNotes || "-"}</Text>
        </Section>

        {approvedScenes && approvedScenes.length > 0 && (
          <Section label="Storyline Approved">
            {approvedScenes.map((scene, i) => (
              <View key={scene.id} style={styles.sceneCard} wrap={false}>
                <Text style={styles.sceneTitle}>Sc{i + 1}</Text>
                <View style={styles.sceneRow}>
                  <Text style={styles.sceneLabel}>Scene</Text>
                  <Text style={styles.sceneValue}>{scene.scene || "-"}</Text>
                </View>
                <View style={styles.sceneRow}>
                  <Text style={styles.sceneLabel}>Voice</Text>
                  <Text style={styles.sceneValue}>{scene.voice || "-"}</Text>
                </View>
                <View style={styles.sceneRow}>
                  <Text style={styles.sceneLabel}>Text</Text>
                  <Text style={styles.sceneValue}>{scene.text || "-"}</Text>
                </View>
              </View>
            ))}
          </Section>
        )}
      </Page>
    </Document>
  );
}
