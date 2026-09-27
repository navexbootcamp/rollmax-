/**
 * Topic Generation Engine
 * Synthesizes semantically connected topics from Main Topic & Stop On topic.
 * Provides rich domain knowledge ecosystems + procedural semantic synthesis.
 */

// Domain dictionaries with semantic vectors for instant, high-fidelity offline topic synthesis
const DOMAIN_SEEDS: Record<string, string[]> = {
  ai: [
    'LLMs',
    'AI Coding',
    'AI SaaS',
    'AI Infrastructure',
    'Automation',
    'Developer Tools',
    'AI APIs',
    'AI Products',
    'AI Engineering',
    'AI Models',
    'Context Windows',
    'Edge Inference',
    'Autonomous Systems',
    'Fine-Tuning',
    'Vector Databases',
    'Prompt Architecture',
    'Synthetic Data',
    'Multimodal Models',
    'Neural Networks',
    'Knowledge Graphs',
  ],
  fitness: [
    'Strength Training',
    'Mobility',
    'Bodyweight Control',
    'Progressive Overload',
    'Hypertrophy',
    'Core Stability',
    'Endurance',
    'Flexibility',
    'Push-Ups & Pull-Ups',
    'Recovery & Sleep',
    'Zone 2 Cardio',
    'Metabolic Conditioning',
    'Functional Movement',
    'Grip Strength',
    'Isometric Holds',
  ],
  technology: [
    'Robotics',
    'Embedded Systems',
    'Computer Vision',
    'Cloud Architecture',
    'Hardware Acceleration',
    'Autonomous Vehicles',
    'Sensors & Actuators',
    'Microcontrollers',
    'Cybersecurity',
    'Industrial Automation',
    'Distributed Systems',
    'Spatial Computing',
    'Edge Computing',
  ],
  startups: [
    'Product-Market Fit',
    'Seed Capital',
    'Unit Economics',
    'Distribution Channels',
    'Zero to One',
    'Bootstrapping',
    'Customer Retention',
    'Go-To-Market',
    'Moat Architecture',
    'Viral Loops',
    'Founder-Led Sales',
    'Runway Management',
  ],
  design: [
    'Kinetic Typography',
    'Design Systems',
    'Micro-Interactions',
    'Spatial Layout',
    'Visual Hierarchy',
    'Tactile Interfaces',
    'Motion Physics',
    'Grid Architecture',
    'Typefaces & Kerning',
    'Editorial Aesthetics',
    'Industrial Minimalism',
  ],
  finance: [
    'Cashflow Velocity',
    'Compound Returns',
    'Asset Allocation',
    'Liquidity Pools',
    'Risk Arbitrage',
    'Venture Velocity',
    'Capital Efficiency',
    'Defensive Moats',
    'Macro Cycles',
    'Valuation Multiples',
  ],
  content: [
    'Short-Form Video',
    'Hook Mechanics',
    'Audience Retention',
    'Visual Pacing',
    'Story Architecture',
    'Organic Reach',
    'Personal Branding',
    'Content Flywheel',
    'Editorial Tone',
    'Screen Recording',
  ],
};

function cleanTopic(text: string): string {
  return text.trim().replace(/^[-*•\d.]+\s*/, '').replace(/["'`]/g, '');
}

export function generateRelatedTopics(mainTopic: string, stopOn: string): string[] {
  const mainNorm = mainTopic.toLowerCase().trim();
  const stopNorm = stopOn.toLowerCase().trim();

  // Collect potential candidates
  const candidates = new Set<string>();

  // Detect domain matches
  for (const [key, list] of Object.entries(DOMAIN_SEEDS)) {
    if (mainNorm.includes(key) || stopNorm.includes(key)) {
      list.forEach((t) => candidates.add(t));
    }
  }

  // Add contextual syntheses based on input words
  const words = `${mainTopic} ${stopOn}`.split(/\s+/).filter((w) => w.length > 2);
  const prefixes = [
    'Deep Dive into',
    'Future of',
    'Scaling',
    'Next-Gen',
    'Autonomous',
    'High-Performance',
    'Modern',
    'Core',
  ];

  // Specific thematic bridge generation
  candidates.add(stopOn);
  candidates.add(mainTopic);

  // If we found specific domain keywords, enrich them
  if (mainNorm.includes('startup') || mainNorm.includes('business')) {
    ['GTM Strategy', 'Early Traction', 'Pricing Models', 'Retention Curves', 'Founder Velocity'].forEach((t) =>
      candidates.add(t)
    );
  }
  if (mainNorm.includes('code') || mainNorm.includes('dev') || stopNorm.includes('agent')) {
    ['Tool Calling', 'Autonomous Agents', 'Self-Healing Code', 'Agentic Workflows', 'Context Protocol'].forEach((t) =>
      candidates.add(t)
    );
  }
  if (mainNorm.includes('robot') || stopNorm.includes('robot')) {
    ['Kinematics', 'Actuators', 'Bipedal Locomotion', 'SLAM Navigation', 'Dexterous Manipulation'].forEach((t) =>
      candidates.add(t)
    );
  }

  // Fallback procedural expansions if sparse
  if (candidates.size < 12) {
    words.forEach((w) => {
      const cap = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      candidates.add(`${cap} Architecture`);
      candidates.add(`${cap} Systems`);
      candidates.add(`${cap} Frameworks`);
      candidates.add(`${cap} Workflows`);
      candidates.add(`${cap} Mechanics`);
    });
  }

  // Filter, format, and ensure predetermined stopOn is prioritized and clean
  const topicList = Array.from(candidates)
    .map(cleanTopic)
    .filter((t) => t.length > 0 && t.toLowerCase() !== mainNorm);

  // Pick 12 to 15 distinct topics, with stopOn firmly anchored
  const filtered = topicList.filter((t) => t.toLowerCase() !== stopNorm);
  // Shuffle intermediate topics for freshness
  const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 13);

  // Result always contains stopOn and cohesive variety
  return [stopOn, ...shuffled];
}
