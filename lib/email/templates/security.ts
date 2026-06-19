import { buildBaseEmail } from './base'

export function buildPasswordChangedEmail(fullName: string) {
  const title = 'Password Changed'
  const subject = '[KelalShop] Security Alert: Your password was changed'

  const htmlContent = `
    <h2 class="text-primary" style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #dc2626;">
      Password Changed Successfully
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Hello ${fullName},<br/><br/>
      This is a security confirmation that the password for your KelalShop account was recently changed.
    </p>

    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0; color: #b45309; font-size: 14px;">
      <strong>Did you make this change?</strong><br/>
      If you did, no further action is required. If you did NOT change your password, please reset your password immediately to secure your account.
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://kelalshop.com/auth/forgot-password" style="background-color: #dc2626; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Secure My Account
      </a>
    </div>
  `

  const text = `Hello ${fullName}, your KelalShop password was successfully changed. If you did not make this change, please reset your password immediately: https://kelalshop.com/auth/forgot-password`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: 'Your password was changed' }),
    text,
  }
}

export function buildEmailChangedEmail(fullName: string, newEmail: string) {
  const title = 'Email Address Changed'
  const subject = '[KelalShop] Security Alert: Your email address was changed'

  const htmlContent = `
    <h2 class="text-primary" style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #dc2626;">
      Email Address Changed
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Hello ${fullName},<br/><br/>
      This is a security confirmation that your KelalShop account email address has been successfully changed to: <strong>${newEmail}</strong>.
    </p>

    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0; color: #b45309; font-size: 14px;">
      <strong>Did you request this change?</strong><br/>
      If you did not request this change, please contact KelalShop Support immediately.
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://kelalshop.com/support" style="background-color: #dc2626; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Contact Support
      </a>
    </div>
  `

  const text = `Hello ${fullName}, your KelalShop email was successfully changed to ${newEmail}. If you did not request this, contact support immediately: https://kelalshop.com/support`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: 'Your email address was changed' }),
    text,
  }
}

interface LoginMetadata {
  fullName: string
  ipAddress: string
  userAgent: string
  location?: string
  timestamp: string
}

function buildDeviceDetailsTable(data: LoginMetadata) {
  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; padding: 16px; font-size: 14px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Device/Browser</td>
        <td align="right" class="text-primary" style="padding: 6px 0; color: #111827; font-weight: 600;">${data.userAgent}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">IP Address</td>
        <td align="right" class="text-primary" style="padding: 6px 0; color: #111827; font-weight: 600;">${data.ipAddress}</td>
      </tr>
      ${
        data.location
          ? `<tr>
              <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Location</td>
              <td align="right" class="text-primary" style="padding: 6px 0; color: #111827; font-weight: 600;">${data.location}</td>
             </tr>`
          : ''
      }
      <tr>
        <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Time</td>
        <td align="right" class="text-primary" style="padding: 6px 0; color: #111827; font-weight: 600;">${data.timestamp}</td>
      </tr>
    </table>
  `
}

export function buildNewDeviceLoginEmail(data: LoginMetadata) {
  const title = 'New Device Sign-in'
  const subject = '[KelalShop] Security Alert: New device login detected'

  const htmlContent = `
    <h2 class="text-primary" style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #111827;">
      New Login Detected
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Hello ${data.fullName},<br/><br/>
      We noticed a new login to your KelalShop account. Here are the details of the login session:
    </p>

    ${buildDeviceDetailsTable(data)}

    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0; color: #b45309; font-size: 14px;">
      <strong>Was this you?</strong><br/>
      If this was you, you can safely ignore this alert. If you do not recognize this login, please change your password immediately.
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://kelalshop.com/auth/forgot-password" style="background-color: #dc2626; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Secure My Account
      </a>
    </div>
  `

  const text = `Hello ${data.fullName}, a new device login was detected for your KelalShop account. IP: ${data.ipAddress}, Time: ${data.timestamp}, Device: ${data.userAgent}. If this wasn't you, reset your password: https://kelalshop.com/auth/forgot-password`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: 'New device login detected' }),
    text,
  }
}

export function buildSuspiciousLoginEmail(data: LoginMetadata) {
  const title = 'Suspicious Login Attempt'
  const subject = '[KelalShop] CRITICAL: Suspicious login attempt blocked'

  const htmlContent = `
    <h2 class="text-primary" style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #dc2626;">
      Suspicious Login Blocked
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Hello ${data.fullName},<br/><br/>
      Our systems detected and blocked a highly suspicious login attempt to your KelalShop account. We've temporarily flagged this device connection.
    </p>

    ${buildDeviceDetailsTable(data)}

    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin: 24px 0; color: #991b1b; font-size: 14px;">
      <strong>Action Required:</strong><br/>
      We highly recommend changing your password immediately and reviewing your active sessions to secure your account.
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://kelalshop.com/auth/forgot-password" style="background-color: #dc2626; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Change Password Now
      </a>
    </div>
  `

  const text = `Hello ${data.fullName}, a suspicious login attempt was blocked on your KelalShop account. IP: ${data.ipAddress}, Device: ${data.userAgent}. Secure your account immediately: https://kelalshop.com/auth/forgot-password`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: 'Suspicious login attempt blocked' }),
    text,
  }
}
