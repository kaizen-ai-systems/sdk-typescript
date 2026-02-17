import { createClient } from "@kaizen/sdk";

const client = createClient({ apiKey: process.env.KAIZEN_API_KEY || "" });

async function main(): Promise<void> {
  const result = await client.akuma.query({
    dialect: "postgres",
    prompt: "Top 10 customers by MRR last month",
    mode: "sql-only",
  });

  if (result.error) {
    throw new Error(result.error);
  }

  console.log(result.sql);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
