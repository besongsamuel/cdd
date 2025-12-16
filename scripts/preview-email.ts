/**
 * Email Template Preview Script
 *
 * Displays preview data and template location for HTML email templates.
 * Templates use Mustache-style placeholders ({{variable}}) for data binding.
 */

import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get email template name from command line args
const templateName = process.argv[2];

// Available templates
const availableTemplates = [
  "donation",
  "contact-submission",
  "department-join-request",
  "ministry-join-request",
  "prayer-request",
  "suggestion",
  "support-request",
  "testimony-request",
];

if (!templateName) {
  console.error("Usage: npm run preview-email <template-name>");
  console.error("Example: npm run preview-email donation");
  console.error("\nAvailable templates:");
  availableTemplates.forEach((template) => {
    console.error(`  - ${template}`);
  });
  process.exit(1);
}

// Map template names to their preview props
const previewProps: Record<string, Record<string, unknown>> = {
  donation: {
    amount: "100.00",
    category_name: "Tithe",
    donor_name: "John Doe",
    donor_email: "[email protected]",
    etransfer_email: "[email protected]",
    status: "Pending",
    notes: "Monthly tithe",
    created_at: "2024-01-01 12:00:00",
  },
  "contact-submission": {
    name: "John Doe",
    email: "[email protected]",
    message: "This is a test message from the contact form.",
    created_at: "2024-01-01 12:00:00",
  },
  "department-join-request": {
    department_name: "Worship",
    member_name: "John Doe",
    member_email: "[email protected]",
    member_phone: "+1234567890",
    created_at: "2024-01-01 12:00:00",
  },
  "ministry-join-request": {
    ministry_name: "Youth Ministry",
    member_name: "John Doe",
    member_email: "[email protected]",
    member_phone: "+1234567890",
    created_at: "2024-01-01 12:00:00",
  },
  "prayer-request": {
    name: "John Doe",
    email: "[email protected]",
    phone: "+1234567890",
    content: "Please pray for healing and strength during this difficult time.",
    created_at: "2024-01-01 12:00:00",
  },
  suggestion: {
    category_name: "Worship",
    submitter_name: "John Doe",
    submitter_phone: "+1234567890",
    suggestion_text:
      "I suggest we add more contemporary worship songs to our repertoire.",
    created_at: "2024-01-01 12:00:00",
  },
  "support-request": {
    name: "John Doe",
    email: "[email protected]",
    phone: "+1234567890",
    content: "I need assistance with accessing the church resources online.",
    created_at: "2024-01-01 12:00:00",
  },
  "testimony-request": {
    name: "John Doe",
    email: "[email protected]",
    phone: "+1234567890",
    content:
      "I want to share how the church has transformed my life and brought me closer to God.",
    created_at: "2024-01-01 12:00:00",
  },
};

const props = previewProps[templateName.toLowerCase()];

if (!props) {
  console.error(`❌ Unknown template: ${templateName}`);
  console.error(`Available templates: ${availableTemplates.join(", ")}`);
  process.exit(1);
}

const templatePath = join(
  __dirname,
  "..",
  "supabase",
  "functions",
  "send-email",
  "templates",
  `${templateName.toLowerCase()}.html`
);

try {
  if (!existsSync(templatePath)) {
    console.error(`❌ Template file not found: ${templatePath}`);
    process.exit(1);
  }

  console.log("\n📧 Email Template Preview Helper");
  console.log("═".repeat(50));
  console.log(`\nTemplate: ${templateName}`);
  console.log(`Location: ${templatePath}`);

  console.log("\n📋 Preview Props:");
  console.log(JSON.stringify(props, null, 2));

  console.log("\n💡 How to Preview:");
  console.log("─".repeat(50));
  console.log("1. Open the template file in your browser");
  console.log("2. Or test via Edge Function with the props above");
  console.log("3. Templates use Mustache-style placeholders: {{variable}}");
  console.log("4. Conditional sections: {{#variable}}...{{/variable}}");
} catch (error) {
  console.error(`❌ Error reading template: ${error}`);
  process.exit(1);
}
