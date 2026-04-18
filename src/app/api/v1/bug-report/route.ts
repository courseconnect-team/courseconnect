import { NextResponse } from 'next/server';

type BugReportPayload = {
  summary?: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
  pageUrl?: string;
  userAgent?: string;
  user?: {
    uid?: string;
    email?: string;
    displayName?: string;
    role?: string;
  };
};

const SEVERITY_EMOJI: Record<string, string> = {
  low: ':large_blue_circle:',
  medium: ':large_yellow_circle:',
  high: ':red_circle:',
};

const truncate = (value: string, max = 2500) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

export async function POST(request: Request) {
  const webhookUrl = process.env.SLACK_BUG_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Slack webhook is not configured on the server.' },
      { status: 500 }
    );
  }

  let body: BugReportPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload.' },
      { status: 400 }
    );
  }

  const summary = (body.summary || '').trim();
  const description = (body.description || '').trim();

  if (!summary || !description) {
    return NextResponse.json(
      { error: 'Summary and description are required.' },
      { status: 400 }
    );
  }

  const severity = body.severity ?? 'medium';
  const severityEmoji = SEVERITY_EMOJI[severity] ?? SEVERITY_EMOJI.medium;

  const who =
    body.user?.displayName || body.user?.email || body.user?.uid || 'unknown';
  const role = body.user?.role || 'unknown';

  const slackPayload = {
    text: `${severityEmoji} *CourseConnect bug report* — ${truncate(
      summary,
      140
    )}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityEmoji} Bug report: ${truncate(summary, 140)}`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Reported by:*\n${who}` },
          { type: 'mrkdwn', text: `*Role:*\n${role}` },
          { type: 'mrkdwn', text: `*Severity:*\n${severity}` },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${body.user?.email ?? 'n/a'}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${truncate(description)}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Page: ${body.pageUrl ?? 'n/a'} • UA: ${truncate(
              body.userAgent ?? 'n/a',
              200
            )}`,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Slack webhook failed:', res.status, text);
      return NextResponse.json(
        { error: 'Slack rejected the report.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Bug report forwarding failed:', err);
    return NextResponse.json(
      { error: 'Failed to deliver bug report.' },
      { status: 500 }
    );
  }
}
