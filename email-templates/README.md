# Email Templates

This folder contains HTML email templates that can be synced to Resend.

## Usage

1. Add your HTML email templates to this folder (e.g., `contact-submission.html`, `donation.html`)
2. Templates should use Resend's variable syntax: `{{{VARIABLE_NAME}}}`
3. The template name will be the filename without the `.html` extension
4. Sync templates to Resend:
   ```bash
   npm run sync-templates
   ```
5. After syncing, templates must be published in Resend (via dashboard or API) before use

## Variable Syntax

Use triple braces for variables:

```html
<p>Hello {{{FIRST_NAME}}},</p>
<p>Your order total is ${{{PRICE}}}.</p>
```

Variables are automatically extracted and registered with Resend. All variables default to type `'string'`.

## Reserved Variable Names

The following variable names are reserved by Resend and cannot be used:

- `FIRST_NAME`
- `LAST_NAME`
- `EMAIL`
- `RESEND_UNSUBSCRIBE_URL`
- `contact`
- `this`

## Example Template

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Welcome</title>
  </head>
  <body>
    <h1>Welcome {{{USER_NAME}}}!</h1>
    <p>Your account was created on {{{CREATED_AT}}}.</p>
  </body>
</html>
```

Save this as `welcome.html` and run `npm run sync-templates` to sync it to Resend as a template named "welcome".
