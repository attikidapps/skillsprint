import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Path,
  Line,
} from '@react-pdf/renderer';

// Register brand fonts from fontsource CDN (works in Node runtime).
Font.register({
  family: 'Fraunces',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-400-normal.ttf' },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-600-normal.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-400-italic.ttf', fontStyle: 'italic' },
  ],
});

Font.register({
  family: 'Geist',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.ttf' },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-500-normal.ttf', fontWeight: 500 },
  ],
});

// Brand tokens — mirror the Tailwind config.
const C = {
  sand:      '#fbf9f1',
  sandDeep:  '#f5eedb',
  emerald:   '#0b6b3a',
  emeraldDk: '#0a4f2d',
  ink:       '#1a1f1c',
  inkSoft:   '#3a443d',
  inkMuted:  '#6b7670',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.sand,
    fontFamily: 'Geist',
    color: C.ink,
    padding: 0,
  },
  border: {
    position: 'absolute',
    top: 22, right: 22, bottom: 22, left: 22,
    borderWidth: 1,
    borderColor: C.emerald,
  },
  innerBorder: {
    position: 'absolute',
    top: 30, right: 30, bottom: 30, left: 30,
    borderWidth: 0.5,
    borderColor: C.emerald,
  },
  content: {
    flex: 1,
    padding: 70,
    justifyContent: 'space-between',
  },
  // ---------- Header ----------
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 16, height: 16,
  },
  brandText: {
    fontFamily: 'Fraunces',
    fontWeight: 600,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  headerRight: {
    fontFamily: 'Geist',
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: C.inkMuted,
  },
  // ---------- Body ----------
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 5,
    textTransform: 'uppercase',
    color: C.inkMuted,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'Fraunces',
    fontWeight: 400,
    fontSize: 22,
    color: C.ink,
    marginBottom: 36,
  },
  titleAccent: {
    fontStyle: 'italic',
    color: C.emerald,
  },
  awardedTo: {
    fontSize: 10,
    color: C.inkMuted,
    marginBottom: 10,
  },
  recipient: {
    fontFamily: 'Fraunces',
    fontWeight: 400,
    fontSize: 54,
    color: C.ink,
    letterSpacing: -1,
    marginBottom: 28,
    textAlign: 'center',
  },
  forCompleting: {
    fontSize: 10,
    color: C.inkMuted,
    marginBottom: 8,
  },
  bootcamp: {
    fontFamily: 'Fraunces',
    fontStyle: 'italic',
    fontSize: 22,
    color: C.emeraldDk,
    textAlign: 'center',
    maxWidth: 500,
  },
  // ---------- Footer ----------
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 24,
    borderTopWidth: 0.5,
    borderTopColor: C.inkMuted,
  },
  footerCol: { flexDirection: 'column', gap: 2 },
  footerLabel: {
    fontSize: 7,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: C.inkMuted,
  },
  footerValue: {
    fontSize: 10,
    color: C.ink,
    fontFamily: 'Geist',
    fontWeight: 500,
  },
  mono: { fontFamily: 'Geist' },
  sealCircle: {
    width: 44, height: 44,
    borderRadius: 22,
    borderWidth: 0.75,
    borderColor: C.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontSize: 7,
    letterSpacing: 2,
    color: C.emerald,
    textTransform: 'uppercase',
  },
});

type Props = {
  recipientName: string;
  bootcampTitle: string;
  issuedDate: string;   // pre-formatted e.g. "April 23, 2026"
  serial: string;
  verifyUrl: string;
};

function Sprout() {
  // Matches the Lucide "Sprout" shape in spirit — emerald, minimal.
  return (
    <Svg style={styles.brandMark} viewBox="0 0 24 24">
      <Path
        d="M7 20h10"
        stroke={C.emerald} strokeWidth={1.6} strokeLinecap="round"
      />
      <Path
        d="M10 20c5.5-2.5.8-6.4 3-10"
        stroke={C.emerald} strokeWidth={1.6} strokeLinecap="round" fill="none"
      />
      <Path
        d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2-.4-3.5-1.6-4.3-3.2-.2-.4-.3-.9-.2-1.3.6.1 1.6.3 2.2.8z"
        stroke={C.emerald} strokeWidth={1.4} fill={C.emerald}
      />
      <Path
        d="M14.1 6a7.2 7.2 0 0 0-1.1 4.1c1.8-.7 3-2.2 3.3-4.1.1-.5 0-1.1-.2-1.6-.7.2-1.4.6-2 1.6z"
        stroke={C.emerald} strokeWidth={1.4} fill={C.emerald}
      />
    </Svg>
  );
}

export function CertificatePDF({
  recipientName,
  bootcampTitle,
  issuedDate,
  serial,
  verifyUrl,
}: Props) {
  return (
    <Document
      title={`SkillSprint Certificate — ${bootcampTitle}`}
      author="SkillSprint"
      creator="SkillSprint"
      producer="SkillSprint"
      subject={`Certificate of completion for ${recipientName}`}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        <View style={styles.content}>
          {/* ---------- Header ---------- */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Sprout />
              <Text style={styles.brandText}>SkillSprint</Text>
            </View>
            <Text style={styles.headerRight}>Est. 2026</Text>
          </View>

          {/* ---------- Body ---------- */}
          <View style={styles.body}>
            <Text style={styles.eyebrow}>— Certificate of Completion —</Text>
            <Text style={styles.title}>
              A 7-day sprint in <Text style={styles.titleAccent}>focused mastery</Text>
            </Text>

            <Text style={styles.awardedTo}>This certificate is proudly awarded to</Text>
            <Text style={styles.recipient}>{recipientName}</Text>

            <Text style={styles.forCompleting}>for successfully completing</Text>
            <Text style={styles.bootcamp}>{bootcampTitle}</Text>
          </View>

          {/* ---------- Footer ---------- */}
          <View style={styles.footer}>
            <View style={styles.footerCol}>
              <Text style={styles.footerLabel}>Issued</Text>
              <Text style={styles.footerValue}>{issuedDate}</Text>
            </View>

            <View style={styles.sealCircle}>
              <Text style={styles.sealText}>Verified</Text>
            </View>

            <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.footerLabel}>Serial</Text>
              <Text style={[styles.footerValue, styles.mono]}>{serial}</Text>
              <Text style={[styles.footerLabel, { marginTop: 2 }]}>{verifyUrl}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
