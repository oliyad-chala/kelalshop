import crypto from 'crypto'

/**
 * Validates the authenticity of the data received from the Telegram Web App.
 * Computes HMAC-SHA256 signature of sorted request parameters using the bot token as the secret.
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string
): { success: boolean; user?: any; error?: string } {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) {
      return { success: false, error: 'Missing hash' }
    }

    // Remove hash parameter before sorting
    params.delete('hash')

    // Sort key-value pairs alphabetically
    const keys = Array.from(params.keys()).sort()
    const dataCheckString = keys
      .map((key) => `${key}=${params.get(key)}`)
      .join('\n')

    // Compute secret key: HMAC-SHA256 of bot token with key "WebAppData"
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // Compute hex-encoded HMAC-SHA256 signature of dataCheckString using the secret key
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (calculatedHash !== hash) {
      return { success: false, error: 'Signature mismatch' }
    }

    // Verify auth_date is within 24 hours to prevent replay attacks
    const authDateStr = params.get('auth_date')
    if (!authDateStr) {
      return { success: false, error: 'Missing auth_date' }
    }

    const authDate = parseInt(authDateStr, 10)
    const now = Math.floor(Date.now() / 1000)
    const age = now - authDate

    if (age > 86400 || age < -300) {
      return { success: false, error: 'Init data expired or clock skew' }
    }

    const userJson = params.get('user')
    const user = userJson ? JSON.parse(userJson) : null

    return { success: true, user }
  } catch (err: any) {
    return { success: false, error: err.message || 'Validation error' }
  }
}
