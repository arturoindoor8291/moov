import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Preview,
} from "@react-email/components";

interface ConfirmationEmailProps {
  founderName: string;
  startupName: string;
  roundStage: string;
}

export default function ConfirmationEmail({
  founderName,
  startupName,
  roundStage,
}: ConfirmationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your application to MOOV has been received. We will get back to you within two weeks.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>MOOV</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Hi {founderName},</Text>
            <Text style={paragraph}>
              We have received your application for <strong>{startupName}</strong> ({roundStage} round).
              Our team reads every application personally and will get back to you
              within <strong>two weeks</strong>.
            </Text>

            <Text style={paragraph}>
              If we see a fit, the next step will be a short intro call with our investment team.
              We move fast — no lengthy processes.
            </Text>

            <Section style={timelineBox}>
              <Text style={timelineLabel}>WHAT HAPPENS NEXT</Text>
              <Text style={timelineItem}>01 — Our team reviews your application</Text>
              <Text style={timelineItem}>02 — If we see a fit, we reach out to schedule an intro call</Text>
              <Text style={timelineItem}>03 — We move fast — expect to hear from us within 14 days</Text>
            </Section>

            <Text style={paragraph}>
              In the meantime, if you have any updates to share — new traction, new deck, anything
              material — feel free to reply to this email.
            </Text>

            <Text style={paragraph}>
              Best,
              <br />
              The MOOV Team
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              MOOV · Backed by Grupo Huerpel · Mexico City
            </Text>
            <Text style={footerText}>
              <Link href="https://moov.vc" style={footerLink}>moov.vc</Link>
              {" · "}
              <Link href="https://moov.vc/privacy" style={footerLink}>Privacy Policy</Link>
            </Text>
            <Text style={footerText}>
              MOOV processes your personal data in accordance with LFPDPPP (Mexico) and GDPR.
              <br />
              For data requests, contact{" "}
              <Link href="mailto:privacy@moov.vc" style={footerLink}>privacy@moov.vc</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#050506",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 24px",
};

const header: React.CSSProperties = {
  marginBottom: "32px",
};

const logo: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 800,
  color: "#eef1f6",
  letterSpacing: "-1px",
  margin: 0,
};

const content: React.CSSProperties = {
  backgroundColor: "#07080d",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "12px",
  padding: "32px",
};

const greeting: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#eef1f6",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "rgba(238,241,246,0.75)",
  margin: "0 0 16px",
};

const timelineBox: React.CSSProperties = {
  backgroundColor: "#0c0e14",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "24px 0",
};

const timelineLabel: React.CSSProperties = {
  fontSize: "10px",
  fontFamily: "monospace",
  letterSpacing: "0.1em",
  color: "#2f6dff",
  margin: "0 0 12px",
  textTransform: "uppercase",
};

const timelineItem: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(238,241,246,0.65)",
  margin: "0 0 8px",
  lineHeight: "1.5",
};

const divider: React.CSSProperties = {
  borderColor: "rgba(255,255,255,0.08)",
  margin: "32px 0 20px",
};

const footer: React.CSSProperties = {
  textAlign: "center",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(238,241,246,0.3)",
  margin: "0 0 6px",
  lineHeight: "1.5",
};

const footerLink: React.CSSProperties = {
  color: "rgba(238,241,246,0.4)",
  textDecoration: "underline",
};
