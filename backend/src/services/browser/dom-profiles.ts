import { ProviderDOMProfile } from '../types/browser.types';

export const ChatGPTDOMProfile: ProviderDOMProfile = {
  version: '1.0.0',
  chatInput: {
    description: 'Main chat input textarea',
    strategies: [
      { type: 'testid', value: 'prompt-textarea' },
      { type: 'css', value: '#prompt-textarea' },
      { type: 'css', value: 'textarea[placeholder*="Message"]' },
      { type: 'xpath', value: '//textarea[contains(@placeholder, "Message")]' },
    ],
  },
  sendButton: {
    description: 'Send message button',
    strategies: [
      { type: 'testid', value: 'send-button' },
      { type: 'css', value: 'button[data-testid="send-button"]' },
      { type: 'xpath', value: '//button[@aria-label="Send message"]' },
      { type: 'css', value: 'button[aria-label*="Send"]' },
      { type: 'css', value: 'button svg' }, // Button with SVG icon
      { type: 'xpath', value: '//button[contains(@class, "absolute")]' }, // Position-based fallback
    ],
  },
  lastAssistantMessage: {
    description: 'Last assistant message in conversation',
    strategies: [
      { type: 'css', value: '[data-message-author-role="assistant"]:last-of-type .markdown' },
      { type: 'css', value: '.agent-turn:last-of-type' },
      { type: 'xpath', value: '(//div[@data-message-author-role="assistant"])[last()]' },
    ],
  },
  messageContainer: {
    description: 'Container holding all messages',
    strategies: [
      { type: 'css', value: '[role="presentation"]' },
      { type: 'css', value: '.conversation-turn-container' },
      { type: 'xpath', value: '//div[contains(@class, "conversation")]' },
    ],
  },
  loginIndicator: {
    description: 'Element that indicates logged out state',
    strategies: [
      { type: 'text', value: 'Log in' },
      { type: 'text', value: 'Sign up' },
      { type: 'css', value: 'button:has-text("Log in")' },
    ],
  },
  stopGeneratingButton: {
    description: 'Stop generating button (appears while streaming)',
    strategies: [
      { type: 'css', value: 'button:has-text("Stop generating")' },
      { type: 'xpath', value: '//button[contains(text(), "Stop")]' },
    ],
  },
};

export const ClaudeDOMProfile: ProviderDOMProfile = {
  version: '1.0.0',
  chatInput: {
    description: 'Main chat input',
    strategies: [
      { type: 'css', value: '[contenteditable="true"][role="textbox"]' },
      { type: 'css', value: '.ProseMirror' },
      { type: 'xpath', value: '//div[@contenteditable="true"][@role="textbox"]' },
    ],
  },
  sendButton: {
    description: 'Send message button',
    strategies: [
      { type: 'css', value: 'button[aria-label*="Send"]' },
      { type: 'css', value: 'button:has-text("Send")' },
      { type: 'xpath', value: '//button[@aria-label="Send Message"]' },
    ],
  },
  lastAssistantMessage: {
    description: 'Last Claude response',
    strategies: [
      { type: 'css', value: '[data-is-streaming="false"]:last-of-type .font-claude-message' },
      { type: 'css', value: '.font-claude-message:last-of-type' },
      { type: 'xpath', value: '(//div[contains(@class, "font-claude-message")])[last()]' },
    ],
  },
  messageContainer: {
    description: 'Message container',
    strategies: [
      { type: 'css', value: '[role="main"]' },
      { type: 'css', value: '.conversation-container' },
    ],
  },
  loginIndicator: {
    description: 'Login page indicator',
    strategies: [
      { type: 'text', value: 'Continue with Google' },
      { type: 'text', value: 'Email' },
      { type: 'css', value: 'input[type="email"]' },
    ],
  },
  stopGeneratingButton: {
    description: 'Stop generating button',
    strategies: [
      { type: 'css', value: 'button:has-text("Stop")' },
      { type: 'xpath', value: '//button[contains(text(), "Stop")]' },
    ],
  },
};

export const GeminiDOMProfile: ProviderDOMProfile = {
  version: '1.0.0',
  chatInput: {
    description: 'Gemini chat input',
    strategies: [
      { type: 'css', value: '.ql-editor[contenteditable="true"]' },
      { type: 'css', value: '[contenteditable="true"]' },
      { type: 'xpath', value: '//div[@contenteditable="true"]' },
    ],
  },
  sendButton: {
    description: 'Send button',
    strategies: [
      { type: 'css', value: 'button[aria-label*="Send"]' },
      { type: 'xpath', value: '//button[@mattooltip="Send message"]' },
    ],
  },
  lastAssistantMessage: {
    description: 'Last Gemini response',
    strategies: [
      { type: 'css', value: '.model-response-text:last-of-type' },
      { type: 'xpath', value: '(//div[contains(@class, "model-response")])[last()]' },
    ],
  },
  messageContainer: {
    description: 'Messages container',
    strategies: [
      { type: 'css', value: '.conversation-container' },
      { type: 'css', value: '[role="main"]' },
    ],
  },
  loginIndicator: {
    description: 'Login indicator',
    strategies: [
      { type: 'text', value: 'Sign in' },
      { type: 'css', value: 'button:has-text("Sign in")' },
    ],
  },
};
