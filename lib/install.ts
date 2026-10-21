export const starterSourceUrl = "https://github.com/frankxai/creator-launch-os"

// Clone the public default branch. Never imply this carries atelier edits,
// activates an integration, or bypasses the provider's approval flow.
export const starterDeployUrl = `https://vercel.com/new/clone?${new URLSearchParams({
  "repository-url": starterSourceUrl,
  "project-name": "creator-launch-os",
  "repository-name": "creator-launch-os",
}).toString()}`

export const localInstallCommands = [
  `git clone ${starterSourceUrl}.git`,
  "cd creator-launch-os",
  "pnpm install --frozen-lockfile",
  "pnpm dev",
].join("\n")
