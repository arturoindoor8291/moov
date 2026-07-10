/**
 * One-time seed for the /portafolio dashboard's initial users.
 * Not deployed — run locally against the real Airtable base once.
 *
 *   node --env-file=.env.local --import tsx scripts/seed-portfolio-users.ts
 *
 * Change both passwords via the Usuarios UI immediately after go-live —
 * these are deliberately weak MVP defaults.
 */
import { createPortfolioUser, getPortfolioUserByUsername } from "../lib/portfolioUsers";

const SEED_USERS: { username: string; password: string; role: "admin" | "viewer" }[] = [
  { username: "admin", password: "admin", role: "admin" },
  { username: "huerpel", password: "Moov", role: "viewer" },
];

async function main() {
  for (const seed of SEED_USERS) {
    const existing = await getPortfolioUserByUsername(seed.username);
    if (existing) {
      console.log(`Skipping "${seed.username}" — already exists.`);
      continue;
    }
    await createPortfolioUser(seed);
    console.log(`Created user "${seed.username}" (role: ${seed.role}).`);
  }
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
