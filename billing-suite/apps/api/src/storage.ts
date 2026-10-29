import fs from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

/**
 * Local-disk storage for development. Swap this module for an S3/R2 implementation
 * (private bucket + signed URLs) in production - keep the same two functions.
 */
export async function saveFile(key: string, data: Buffer) {
  const full = path.resolve(env.STORAGE_DIR, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
}
export const readFile = (key: string) => fs.readFile(path.resolve(env.STORAGE_DIR, key));
