import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class SessionManager {
  private static ALGORITHM = 'aes-256-gcm';
  private static SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
  private static MASTER_KEY: Buffer | null = null;

  /**
   * Initialize session manager with encryption key
   */
  static init(password?: string) {
    // Ensure sessions directory exists
    if (!fs.existsSync(this.SESSIONS_DIR)) {
      fs.mkdirSync(this.SESSIONS_DIR, { recursive: true });
    }

    // Generate or load master key
    if (password) {
      this.MASTER_KEY = crypto.scryptSync(password, 'salt', 32);
    } else {
      // Use environment variable or generate random key
      const keyPath = path.join(this.SESSIONS_DIR, '.key');
      if (fs.existsSync(keyPath)) {
        this.MASTER_KEY = fs.readFileSync(keyPath);
      } else {
        this.MASTER_KEY = crypto.randomBytes(32);
        fs.writeFileSync(keyPath, this.MASTER_KEY, { mode: 0o600 });
      }
    }
  }

  /**
   * Save encrypted session state
   */
  static saveSession(provider: string, state: any): void {
    if (!this.MASTER_KEY) this.init();

    const sessionPath = path.join(this.SESSIONS_DIR, `${provider}.enc`);
    const plaintext = JSON.stringify(state);

    // Encrypt
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.MASTER_KEY!, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Save IV + authTag + encrypted data
    const output = {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted,
    };

    fs.writeFileSync(sessionPath, JSON.stringify(output), { mode: 0o600 });
    console.log(`✅ Saved encrypted session for ${provider}`);
  }

  /**
   * Load and decrypt session state
   */
  static loadSession(provider: string): any | null {
    if (!this.MASTER_KEY) this.init();

    const sessionPath = path.join(this.SESSIONS_DIR, `${provider}.enc`);

    if (!fs.existsSync(sessionPath)) {
      return null;
    }

    try {
      const input = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));

      // Decrypt
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        this.MASTER_KEY!,
        Buffer.from(input.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(input.authTag, 'hex'));

      let decrypted = decipher.update(input.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      console.log(`✅ Loaded session for ${provider}`);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`❌ Failed to decrypt session for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Check if session exists
   */
  static hasSession(provider: string): boolean {
    const sessionPath = path.join(this.SESSIONS_DIR, `${provider}.enc`);
    return fs.existsSync(sessionPath);
  }

  /**
   * Delete session
   */
  static deleteSession(provider: string): void {
    const sessionPath = path.join(this.SESSIONS_DIR, `${provider}.enc`);
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
      console.log(`✅ Deleted session for ${provider}`);
    }
  }

  /**
   * Get session file path for Playwright
   */
  static getSessionPath(provider: string): string {
    return path.join(this.SESSIONS_DIR, `${provider}.json`);
  }
}
