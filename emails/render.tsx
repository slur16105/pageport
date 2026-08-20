import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";

type EmailView = {
  preview: string;
  eyebrow: string;
  heading: string;
  lines: string[];
  buttonLabel?: string;
  buttonUrl?: string;
  note?: string;
};

function PageportEmail({ view }: { view: EmailView }) {
  return (
    <Html lang="ko">
      <Head />
      <Preview>{view.preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={card}>
            <Text style={brand}>
              PAGEPORT<span style={{ color: "#ff5c35" }}>.</span>
            </Text>
            <Text style={eyebrow}>{view.eyebrow}</Text>
            <Heading style={heading}>{view.heading}</Heading>
            <Section style={details}>
              {view.lines.map((line, index) => (
                <Text key={index} style={lineStyle}>
                  {line}
                </Text>
              ))}
            </Section>
            {view.buttonLabel && view.buttonUrl && (
              <Button href={view.buttonUrl} style={button}>
                {view.buttonLabel}
              </Button>
            )}
            {view.note && <Text style={note}>{view.note}</Text>}
          </Section>
          <Text style={footer}>전문 지식이 오가는 디지털 문서 마켓 · PAGEPORT</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function renderPageportEmail(view: EmailView) {
  return render(<PageportEmail view={view} />);
}

const body = {
  margin: "0",
  background: "#f6f1e7",
  fontFamily: "Arial, Apple SD Gothic Neo, sans-serif",
  color: "#17231d",
};
const container = { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" };
const card = { background: "#fffdf7", border: "1px solid #17231d", padding: "40px" };
const brand = { margin: "0 0 28px", fontWeight: "900", fontSize: "22px" };
const eyebrow = { margin: "0 0 10px", color: "#496656", fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em" };
const heading = { margin: "0", fontSize: "28px", lineHeight: "1.4" };
const details = {
  margin: "28px 0",
  padding: "18px 20px",
  background: "#e8dfd1",
  border: "1px solid rgba(23,35,29,.16)",
};
const lineStyle = { margin: "4px 0", fontSize: "14px", lineHeight: "1.65" };
const button = {
  display: "block",
  padding: "16px 20px",
  background: "#ff5c35",
  color: "#fff",
  textAlign: "center" as const,
  fontWeight: "900",
  textDecoration: "none",
};
const note = { margin: "22px 0 0", color: "#5c6860", fontSize: "13px", lineHeight: "1.7" };
const footer = { margin: "18px 0 0", color: "#7a857f", fontSize: "11px", textAlign: "center" as const };
