
export enum PluginType {
  CHATBOT = 'chatbot',
  CONTENT_GEN = 'content_gen',
  SEO_OPTIMIZER = 'seo_optimizer',
  IMAGE_GEN = 'image_gen',
  CUSTOM_TOOL = 'custom_tool'
}

export interface PluginConfig {
  id: string;
  name: string;
  slug: string;
  version: string;
  type: PluginType;
  primaryColor: string;
  promptTemplate: string;
  features: {
    useGutenberg: boolean;
    useShortcode: boolean;
    showInMenu: boolean;
    requireAuth: boolean;
  };
  aiModel: 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
}

export interface UserStats {
  activePlugins: number;
  totalRequests: number;
  tokensUsed: number;
  plan: 'free' | 'pro' | 'agency';
}

export interface DeploymentRecord {
  id: string;
  pluginId: string;
  siteUrl: string;
  status: 'active' | 'revoked';
  lastPing: string;
}
