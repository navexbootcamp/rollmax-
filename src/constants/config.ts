export const INSTAGRAM_URL = 'https://www.instagram.com/wow_navex';

// SHA-256 hash of the creator passcode. The plaintext passcode is NEVER stored in code.
export const CREATOR_HASH = 'f8eab4131f91bae42b6ecd32fb8b0e73e7c9ff9ebc555e7dcf5d70e63ba6836f';

export interface RolloutConfig {
  mainTopic: string;
  stopOn: string;
  generatedTopics: string[];
  timerDuration: number; // in seconds, default 60
  rollDuration: number; // in seconds, default 4
}

export const DEFAULT_CONFIG: RolloutConfig = {
  mainTopic: 'AI Startups',
  stopOn: 'AI Agents',
  generatedTopics: [
    'LLMs',
    'AI Coding',
    'AI SaaS',
    'AI Infrastructure',
    'Automation',
    'AI Agents',
    'Developer Tools',
    'AI APIs',
    'AI Products',
    'AI Engineering',
    'AI Models',
    'Autonomous Workflows',
    'Context Windows',
    'Edge Inference',
  ],
  timerDuration: 60,
  rollDuration: 4.5,
};

export const STORAGE_KEY = 'wow_navex_topic_roller_config';
export const AUTH_STORAGE_KEY = 'wow_navex_creator_authed';
