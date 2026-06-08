export const copy = {
  title: "🕵️  AI MURDER MYSTERY",
  intro: [
    "In the sleepy town of Tokeland, Washington, wealthy hotel owner Don Dahlgren was found dead in the FISHY FJORD, the local pub.",
    "You are the world-renowned detective Ricardo Rivera. Find the murderer.",
  ],

  menuPrompt: "What would you like to do?",
  interrogateLabel: (name: string) => `🕵️  Interrogate ${name}`,
  accuseLabel: "⚖️  Accuse someone",
  quitLabel: "🚪 Quit",

  accusePrompt: "Who is the murderer?",
  confirmAccuse: (name: string) =>
    `Accuse ${name}? This ends the investigation.`,

  win: (guilty: string) =>
    `Correct. ${guilty} was the murderer. Case closed, detective.`,
  lose: (guilty: string, accused: string) =>
    `Wrong. You accused ${accused}, but ${guilty} was the killer. They walk free.`,

  farewell: "Thanks for playing. 🕵️",
};
