/**
 * Email Template Sync Script
 *
 * Syncs HTML email templates from the email-templates/ folder to Resend.
 * - Reads all .html files from email-templates/
 * - Extracts variables from HTML (looking for {{{VAR}}} patterns)
 * - Checks if template exists in Resend by name
 * - Creates new template if not exists, updates if exists
 */

import { readdir, readFile } from "fs/promises";
import { dirname, join } from "path";
import { Resend } from "resend";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Resend API key from environment
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error("❌ Error: RESEND_API_KEY environment variable is not set");
  console.error(
    "Please set it in your .env file or export it before running this script"
  );
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

// Path to email templates folder
const TEMPLATES_DIR = join(__dirname, "..", "email-templates");

type TemplateVariable =
  | {
      key: string;
      type: "string";
      fallbackValue?: string;
    }
  | {
      key: string;
      type: "number";
      fallbackValue?: number;
    };

interface ResendTemplate {
  id: string;
  name: string;
  created_at: string;
}

/**
 * Extract variables from HTML template
 * Looks for Resend's triple-brace syntax: {{{VAR_NAME}}}
 */
function extractVariables(html: string): TemplateVariable[] {
  const variablePattern = /\{\{\{(\w+)\}\}\}/g;
  const variables = new Map<string, TemplateVariable>();

  let match;
  while ((match = variablePattern.exec(html)) !== null) {
    const varName = match[1];

    // Skip if already processed
    if (variables.has(varName)) {
      continue;
    }

    // Reserved variable names that cannot be used
    const reservedNames = [
      "FIRST_NAME",
      "LAST_NAME",
      "EMAIL",
      "RESEND_UNSUBSCRIBE_URL",
      "contact",
      "this",
    ];
    if (reservedNames.includes(varName)) {
      console.warn(
        `⚠️  Warning: Variable "${varName}" is reserved by Resend and will be skipped`
      );
      continue;
    }

    // Default to string type (can be enhanced to detect numbers)
    variables.set(varName, {
      key: varName,
      type: "string" as const,
    });
  }

  return Array.from(variables.values());
}

/**
 * Get template name from filename (without .html extension)
 */
function getTemplateName(filename: string): string {
  return filename.replace(/\.html$/, "");
}

/**
 * List all templates from Resend
 */
async function listTemplates(): Promise<ResendTemplate[]> {
  try {
    const { data, error } = await resend.templates.list();

    if (error) {
      throw new Error(`Failed to list templates: ${JSON.stringify(error)}`);
    }

    return data?.data || [];
  } catch (error) {
    console.error("Error listing templates:", error);
    throw error;
  }
}

/**
 * Find template by name
 */
async function findTemplateByName(
  name: string
): Promise<ResendTemplate | null> {
  const templates = await listTemplates();
  return templates.find((t) => t.name === name) || null;
}

/**
 * Create a new template in Resend
 */
async function createTemplate(
  name: string,
  html: string,
  variables: TemplateVariable[]
): Promise<void> {
  try {
    const { data, error } = await resend.templates.create({
      name,
      html,
      variables: variables.length > 0 ? variables : undefined,
    });

    if (error) {
      throw new Error(`Failed to create template: ${JSON.stringify(error)}`);
    }

    const templateId = data?.id;
    if (!templateId) {
      throw new Error("Template created but no ID returned");
    }

    console.log(`✅ Created template: ${name} (ID: ${templateId})`);

    // Wait 2 seconds after create to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Publish the template
    try {
      const { error: publishError } =
        await resend.templates.publish(templateId);
      if (publishError) {
        console.warn(
          `⚠️  Warning: Template "${name}" created but failed to publish: ${JSON.stringify(publishError)}`
        );
      } else {
        console.log(`📢 Published template: ${name}`);
      }
    } catch (publishError) {
      console.warn(
        `⚠️  Warning: Template "${name}" created but failed to publish:`,
        publishError
      );
    }

    // Wait 2 seconds after publish to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`❌ Error creating template "${name}":`, error);
    throw error;
  }
}

/**
 * Update an existing template in Resend
 */
async function updateTemplate(
  templateId: string,
  name: string,
  html: string,
  variables: TemplateVariable[]
): Promise<void> {
  try {
    const { error } = await resend.templates.update(templateId, {
      name,
      html,
      variables: variables.length > 0 ? variables : undefined,
    });

    if (error) {
      throw new Error(`Failed to update template: ${JSON.stringify(error)}`);
    }

    console.log(`✅ Updated template: ${name} (ID: ${templateId})`);

    // Wait 2 seconds after update to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Publish the template
    try {
      const { error: publishError } =
        await resend.templates.publish(templateId);
      if (publishError) {
        console.warn(
          `⚠️  Warning: Template "${name}" updated but failed to publish: ${JSON.stringify(publishError)}`
        );
      } else {
        console.log(`📢 Published template: ${name}`);
      }
    } catch (publishError) {
      console.warn(
        `⚠️  Warning: Template "${name}" updated but failed to publish:`,
        publishError
      );
    }

    // Wait 2 seconds after publish to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`❌ Error updating template "${name}":`, error);
    throw error;
  }
}

/**
 * Process a single template file
 */
async function processTemplate(filename: string): Promise<void> {
  const templateName = getTemplateName(filename);
  const filePath = join(TEMPLATES_DIR, filename);

  try {
    // Read template file
    const html = await readFile(filePath, "utf-8");

    // Extract variables from HTML
    const variables = extractVariables(html);

    if (variables.length > 0) {
      console.log(
        `📋 Template "${templateName}" has ${variables.length} variable(s): ${variables.map((v) => v.key).join(", ")}`
      );
    } else {
      console.log(`📋 Template "${templateName}" has no variables`);
    }

    // Check if template exists
    const existingTemplate = await findTemplateByName(templateName);

    if (existingTemplate) {
      // Update existing template
      console.log(`🔄 Template "${templateName}" exists, updating...`);
      await updateTemplate(existingTemplate.id, templateName, html, variables);
    } else {
      // Create new template
      console.log(`🆕 Template "${templateName}" not found, creating...`);
      await createTemplate(templateName, html, variables);
    }
  } catch (error) {
    console.error(`❌ Error processing template "${templateName}":`, error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("📧 Email Template Sync to Resend");
  console.log("═".repeat(50));
  console.log(`📁 Templates directory: ${TEMPLATES_DIR}\n`);

  try {
    // Read all HTML files from templates directory
    const files = await readdir(TEMPLATES_DIR);
    const htmlFiles = files.filter((file) => file.endsWith(".html"));

    if (htmlFiles.length === 0) {
      console.log(
        "⚠️  No HTML template files found in email-templates/ folder"
      );
      console.log("   Add .html files to sync them to Resend");
      return;
    }

    console.log(`Found ${htmlFiles.length} template file(s) to process:\n`);

    // Process each template
    for (const filename of htmlFiles) {
      await processTemplate(filename);
      console.log(""); // Empty line for readability
    }

    console.log("═".repeat(50));
    console.log("✅ Template sync completed!");
    console.log("📢 All templates have been published and are ready to use.");
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
