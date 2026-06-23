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
  Row,
  Column,
} from "@react-email/components";
import type { ApplicationData } from "@/lib/schema";

interface InternalNotificationProps {
  data: ApplicationData;
  airtableRecordId: string;
}

export default function InternalNotification({
  data,
  airtableRecordId,
}: InternalNotificationProps) {
  const airtableUrl = `https://airtable.com/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}/${airtableRecordId}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>
        New application: {data.startupName} ({data.roundStage} · {data.country})
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={badge}>NEW APPLICATION</Text>
          <Text style={title}>
            {data.startupName} — {data.roundStage}
          </Text>
          <Text style={subtitle}>
            {data.founderName} · {data.country} · {data.vertical}
          </Text>

          <Section style={card}>
            <Text style={sectionLabel}>FOUNDER</Text>
            <Row>
              <Column>
                <Text style={fieldLabel}>Name</Text>
                <Text style={fieldValue}>{data.founderName}</Text>
              </Column>
              <Column>
                <Text style={fieldLabel}>Email</Text>
                <Text style={fieldValue}>
                  <Link href={`mailto:${data.email}`} style={link}>{data.email}</Link>
                </Text>
              </Column>
            </Row>
            <Text style={fieldLabel}>LinkedIn</Text>
            <Text style={fieldValue}>
              <Link href={data.linkedinUrl} style={link}>{data.linkedinUrl}</Link>
            </Text>
          </Section>

          <Section style={card}>
            <Text style={sectionLabel}>COMPANY</Text>
            <Row>
              <Column>
                <Text style={fieldLabel}>Startup</Text>
                <Text style={fieldValue}>{data.startupName}</Text>
              </Column>
              <Column>
                <Text style={fieldLabel}>Country</Text>
                <Text style={fieldValue}>{data.country}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={fieldLabel}>Vertical</Text>
                <Text style={fieldValue}>{data.vertical}</Text>
              </Column>
              <Column>
                <Text style={fieldLabel}>Sales Model</Text>
                <Text style={fieldValue}>{data.salesModel}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={fieldLabel}>Founded</Text>
                <Text style={fieldValue}>{data.yearOfFoundation}</Text>
              </Column>
              <Column>
                <Text style={fieldLabel}>Team</Text>
                <Text style={fieldValue}>{data.teamSize} ({data.numberOfCoFounders} co-founders)</Text>
              </Column>
            </Row>
            <Text style={fieldLabel}>Stage</Text>
            <Text style={fieldValue}>{data.productStage}</Text>
            <Text style={fieldLabel}>Description</Text>
            <Text style={fieldValue}>{data.companyDescription}</Text>
          </Section>

          <Section style={card}>
            <Text style={sectionLabel}>TRACTION</Text>
            <Row>
              <Column>
                <Text style={fieldLabel}>Net Revenue LTM</Text>
                <Text style={fieldHighlight}>${data.netRevenueLTM.toLocaleString()}</Text>
              </Column>
              <Column>
                <Text style={fieldLabel}>Last Month Revenue</Text>
                <Text style={fieldHighlight}>${data.lastMonthNetRevenue.toLocaleString()}</Text>
              </Column>
            </Row>
            <Text style={fieldLabel}>Total Capital Raised</Text>
            <Text style={fieldHighlight}>${data.totalCapitalRaised.toLocaleString()}</Text>
          </Section>

          <Section style={card}>
            <Text style={sectionLabel}>ROUND</Text>
            <Row>
              <Column>
                <Text style={fieldLabel}>Stage</Text>
                <Text style={fieldHighlight}>{data.roundStage}</Text>
              </Column>
              <Column>
                <Text style={fieldLabel}>Instrument</Text>
                <Text style={fieldHighlight}>{data.instrument}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={fieldLabel}>Round Size</Text>
                <Text style={fieldHighlight}>${data.roundSize.toLocaleString()}</Text>
              </Column>
              <Column>
                <Text style={fieldLabel}>Pre-money / CAP</Text>
                <Text style={fieldHighlight}>${data.preMoneyValuationCap.toLocaleString()}</Text>
              </Column>
            </Row>
            {data.discountRate != null && (
              <Row>
                <Column>
                  <Text style={fieldLabel}>Discount Rate</Text>
                  <Text style={fieldValue}>{data.discountRate}%</Text>
                </Column>
                <Column>
                  <Text style={fieldLabel}>Interest Rate</Text>
                  <Text style={fieldValue}>{data.interestRate}%</Text>
                </Column>
              </Row>
            )}
          </Section>

          <Section style={card}>
            <Text style={sectionLabel}>PITCH</Text>
            <Text style={fieldLabel}>Pitch Deck</Text>
            <Text style={fieldValue}>
              <Link href={data.pitchDeckLink} style={link}>{data.pitchDeckLink}</Link>
            </Text>
            <Text style={fieldLabel}>Source</Text>
            <Text style={fieldValue}>{data.howDidYouFindUs}</Text>
            {data.utmSource && (
              <>
                <Text style={fieldLabel}>UTM</Text>
                <Text style={fieldValue}>
                  {[data.utmSource, data.utmMedium, data.utmCampaign].filter(Boolean).join(" / ")}
                </Text>
              </>
            )}
          </Section>

          <Hr style={divider} />

          <Section style={{ textAlign: "center" }}>
            <Link href={airtableUrl} style={ctaButton}>
              View in Airtable →
            </Link>
            <Text style={footerText}>
              Submitted {new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" })} MX
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
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "32px 20px",
};

const badge: React.CSSProperties = {
  display: "inline-block",
  fontSize: "10px",
  fontFamily: "monospace",
  letterSpacing: "0.12em",
  color: "#2f6dff",
  backgroundColor: "rgba(47,109,255,0.1)",
  border: "1px solid rgba(47,109,255,0.3)",
  borderRadius: "4px",
  padding: "4px 10px",
  margin: "0 0 12px",
};

const title: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#eef1f6",
  letterSpacing: "-0.5px",
  margin: "0 0 6px",
};

const subtitle: React.CSSProperties = {
  fontSize: "14px",
  color: "rgba(238,241,246,0.5)",
  margin: "0 0 28px",
};

const card: React.CSSProperties = {
  backgroundColor: "#0c0e14",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "20px 24px",
  marginBottom: "12px",
};

const sectionLabel: React.CSSProperties = {
  fontSize: "10px",
  fontFamily: "monospace",
  letterSpacing: "0.12em",
  color: "#2f6dff",
  margin: "0 0 14px",
  textTransform: "uppercase",
};

const fieldLabel: React.CSSProperties = {
  fontSize: "10px",
  fontFamily: "monospace",
  color: "rgba(238,241,246,0.4)",
  margin: "10px 0 2px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const fieldValue: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(238,241,246,0.75)",
  margin: 0,
  lineHeight: "1.5",
};

const fieldHighlight: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#eef1f6",
  margin: 0,
};

const link: React.CSSProperties = {
  color: "#34d3ff",
  textDecoration: "underline",
};

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#2f6dff",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
};

const divider: React.CSSProperties = {
  borderColor: "rgba(255,255,255,0.08)",
  margin: "24px 0",
};

const footerText: React.CSSProperties = {
  fontSize: "11px",
  color: "rgba(238,241,246,0.25)",
  marginTop: "12px",
};
