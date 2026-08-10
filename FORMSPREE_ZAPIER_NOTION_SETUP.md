# Formspree → Zapier → Notion Pipeline Setup

**Goal:** Every form submission (contact form, waitlist, support) captured in Formspree automatically creates a row in a Notion database via Zapier.

**Formspree form ID:** `maqvbrkr`
**Form endpoint:** `https://formspree.io/f/maqvbrkr`

---

## Step 1 — Formspree Setup (already done)

The form is already wired in the app with endpoint `maqvbrkr`.

To verify:
1. Go to https://formspree.io/forms
2. Find form `maqvbrkr`
3. Confirm submissions are appearing in the Submissions tab

Optional: enable **Zapier integration** directly from Formspree dashboard:
- Form → Integrations → Zapier → Connect

---

## Step 2 — Create Notion Database

1. In Notion, create a new database page called **"SoulGainz Leads"** (or open an existing one)
2. Add these columns:
   - **Name** (Title)
   - **Email** (Email)
   - **Message** (Text)
   - **Source** (Select: Contact Form / Waitlist / Support)
   - **Submitted At** (Date)
   - **Status** (Select: New / Reviewed / Responded)
3. Get the database ID from the URL:
   `https://notion.so/workspace/DATABASE_ID?v=...`

---

## Step 3 — Create the Zap in Zapier

### Trigger: Formspree New Submission
1. Go to https://zapier.com and click **Create Zap**
2. Search for **Formspree** as the trigger app
3. Select trigger event: **New Submission**
4. Connect your Formspree account (OAuth)
5. Select form: `maqvbrkr` (SoulGainz contact form)
6. Test trigger — submit a test form at soulgainz.app to generate a sample

### Action: Notion Create Database Item
1. Add an action step — search for **Notion**
2. Select action event: **Create Database Item**
3. Connect your Notion account (OAuth — grant access to the database)
4. Select database: **SoulGainz Leads**
5. Map fields:
   - **Name** → `{{name}}` (from Formspree)
   - **Email** → `{{email}}` (from Formspree)
   - **Message** → `{{message}}` (from Formspree)
   - **Source** → `Contact Form` (static)
   - **Submitted At** → `{{zap_meta_human_now}}` (Zapier current time)
   - **Status** → `New` (static default)
6. Test the action — confirm a new row appears in Notion
7. Turn on the Zap

---

## Step 4 — Test End-to-End

1. Go to soulgainz.app and submit the contact form with test data
2. Check Formspree dashboard → Submissions → confirm it arrived
3. Check Zapier → Zap history → confirm it triggered
4. Check Notion database → confirm new row created

---

## Optional Enhancements

### Multiple Form Types
If you add more forms (e.g. a separate waitlist form), create additional Zaps with the same Notion action but different Source values.

### Slack Notification
Add a second action to the Zap: **Slack → Send Channel Message** to get notified instantly when someone submits.

### Email Auto-Reply
In Formspree dashboard → Form Settings → Auto-reply: configure a confirmation email sent automatically to the submitter.

### Filter by Source
In Zapier, add a Filter step between trigger and action to only create Notion rows for specific submission types (e.g. ignore test submissions from certain email domains).

---

## Notes

- **Free Zapier plan**: 100 tasks/month, single-step Zaps only. The Formspree → Notion Zap is a 2-step Zap — you'll need at least the **Zapier Starter plan** ($19.99/month) or use Zapier's free trial.
- **Alternative (free)**: Use **Make (formerly Integromat)** — free plan includes multi-step automation. The setup is identical: Formspree webhook trigger → Notion create item action.
- **Formspree webhooks**: If you want to skip Zapier entirely, Formspree supports outbound webhooks (Pro plan). Point it directly at a Notion API call via a serverless function.
