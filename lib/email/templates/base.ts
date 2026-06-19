export interface BaseEmailOptions {
  title?: string
  preheader?: string
  showUnsubscribe?: boolean
}

export function buildBaseEmail(content: string, options: BaseEmailOptions = {}) {
  const title = options.title ?? 'KelalShop'
  const preheader = options.preheader ? `<span style="display:none;font-size:0;max-height:0;line-height:0;mso-hide:all;">${options.preheader}</span>` : ''
  const unsubscribeSection = options.showUnsubscribe
    ? `<p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
        You received this email because you're registered at KelalShop.
        If you no longer wish to receive these emails, you can 
        <a href="https://kelalshop.com/profile/settings" style="color: #16a34a; text-decoration: underline;">unsubscribe here</a>.
       </p>`
    : `<p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
        This is a transactional email regarding your account activity. Unsubscribe is not available for security/transactional notices.
       </p>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    /* Mobile responsive overrides */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 12px !important;
      }
      .content-box {
        padding: 24px 16px !important;
        border-radius: 8px !important;
      }
    }
    /* Dark mode styling */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #111827 !important;
      }
      .container-table {
        background-color: #111827 !important;
      }
      .content-box {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      .text-primary {
        color: #f9fafb !important;
      }
      .text-muted {
        color: #9ca3af !important;
      }
      .text-light {
        color: #e5e7eb !important;
      }
      .footer-text {
        color: #6b7280 !important;
      }
    }
  </style>
</head>
<body style="background-color: #f9fafb; padding: 0; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheader}
  <table class="container-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; width: 100%;">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <table class="container" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; max-width: 600px;">
          <!-- Header (Branded logo / name) -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="https://kelalshop.com" style="text-decoration: none; display: inline-block;">
                <img src="https://kelalshop.com/logo.jpg" alt="KelalShop Logo" width="60" style="display: block; margin: 0 auto 12px; border-radius: 8px;" />
                <span style="color: #111827; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Kelal</span><span style="color: #f59e0b; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;" class="text-primary">Shop</span>
              </a>
            </td>
          </tr>
          <!-- Main Content Box -->
          <tr>
            <td class="content-box" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; text-align: left;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; padding-bottom: 24px; text-align: center;">
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="padding: 0 10px;">
                    <a href="https://kelalshop.com/shop" style="font-size: 14px; color: #f59e0b; text-decoration: none; font-weight: 600;">Shop</a>
                  </td>
                  <td style="padding: 0 10px; color: #d1d5db;">|</td>
                  <td style="padding: 0 10px;">
                    <a href="https://kelalshop.com/support" style="font-size: 14px; color: #f59e0b; text-decoration: none; font-weight: 600;">Support</a>
                  </td>
                </tr>
              </table>
              <div class="footer-text" style="font-size: 12px; color: #9ca3af; line-height: 1.5; max-width: 500px;">
                ${unsubscribeSection}
                <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
                  &copy; ${new Date().getFullYear()} KelalShop. All rights reserved.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
