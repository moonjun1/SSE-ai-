export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  darkMode: boolean;
  selectedModel: string;
}

export type AIModel = 'openai-gpt3.5' | 'openai-gpt4' | 'claude-3.5-sonnet' | 'deepseek-chat';

export const AI_MODELS = {
  'openai-gpt3.5': { name: 'GPT-3.5 Turbo', provider: 'OpenAI', status: '✅' },
  'openai-gpt4': { name: 'GPT-4', provider: 'OpenAI', status: '✅' },
  'claude-3.5-sonnet': { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', status: '✅' },
  'deepseek-chat': { name: 'DeepSeek Chat', provider: 'DeepSeek', status: '🔄' },
};