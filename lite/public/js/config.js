// ROUTEX frontend config.
// API_BASE: "" = same origin (local + Vercel). If hosting on Firebase, set your Vercel URL, e.g. "https://routex.vercel.app".
// FIREBASE: paste your web app config from Firebase Console > Project settings. Leave apiKey empty for demo mode (localStorage only).
export const CONFIG = {
  API_BASE: "",
  FIREBASE: {
    apiKey: "AIzaSyBq6Lw3hTIGulWsmwac4MzIcn783Pt5Jfs",
    authDomain: "routex-ai-73ed3.firebaseapp.com",
    projectId: "routex-ai-73ed3",
    storageBucket: "routex-ai-73ed3.firebasestorage.app",
    messagingSenderId: "61130193337",
    appId: "1:61130193337:web:351092a5cd2f6904269e68"
  }
};

export const AGENTS = {
  MATH:      { key: "MATH",      role: "Math Expert",    icon: "∑",   color: "#ffb454" },
  EXPLAIN:   { key: "EXPLAIN",   role: "Teacher",        icon: "◉",   color: "#4ee1c1" },
  CODE:      { key: "CODE",      role: "Code Assistant", icon: "</>", color: "#b48cff" },
  TRANSLATE: { key: "TRANSLATE", role: "Translator",     icon: "文",  color: "#ff7eb6" },
  SUMMARIZE: { key: "SUMMARIZE", role: "Summarizer",     icon: "≡",   color: "#6ad1ff" },
  WRITE:     { key: "WRITE",     role: "Writer",         icon: "✎",   color: "#a3e635" }
};
export const ROUTER = { key: "ROUTER", role: "Query Router", icon: "⇄", color: "#7c9cff" };

export const EXAMPLES = [
  "What is 15 × 240 + 37 × 12?",
  "Explain how neural networks learn",
  "Write a Python function to check for palindromes",
  "Translate 'Knowledge is power' into Urdu",
  "Write a polite email asking my teacher for an extension",
  "Summarize: Artificial intelligence is transforming industries by automating tasks, improving decisions and enabling new products."
];

export const AGENT_INFO = {
  MATH:      { goal: "Solves equations and calculations step by step, then verifies the final answer.", ex: "What is 15 × 240 + 37 × 12?" },
  EXPLAIN:   { goal: "Breaks big ideas into simple language with analogies and tiny examples.", ex: "Explain how neural networks learn" },
  CODE:      { goal: "Writes, debugs and explains clean code with short comments.", ex: "Write a Python function to check for palindromes" },
  TRANSLATE: { goal: "Translates between languages while keeping tone and meaning intact.", ex: "Translate 'Knowledge is power' into Urdu" },
  WRITE:     { goal: "Drafts polished emails, essays, posts and stories in the tone you ask for.", ex: "Write a polite email asking my teacher for an extension" },
  SUMMARIZE: { goal: "Condenses long text into a crisp summary with key points.", ex: "Summarize: AI is transforming industries by automating tasks and improving decisions." }
};
export const DEMO_LOOP = [
  ["Solve 48 × 12 + 7", "MATH"], ["Why is the sky blue?", "EXPLAIN"], ["Fix this Python bug", "CODE"],
  ["Translate hello to French", "TRANSLATE"], ["Summarize this article", "SUMMARIZE"], ["Draft an email to my manager", "WRITE"]
];
