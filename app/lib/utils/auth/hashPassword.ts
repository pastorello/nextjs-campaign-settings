import * as bcrypt from "bcrypt";

export default async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; // o 12 per maggiore sicurezza
  return await bcrypt.hash(password, saltRounds);
}
