import fs from "fs";
import path from "path";
import { SearchPost } from "@/lib/searchTypes";

export function generateSearchIndex( posts: SearchPost[] ) {
  const publicDir = path.join( process.cwd(), "public" );
  fs.mkdirSync( publicDir, { recursive: true });
  const filePath = path.join( publicDir, "search-index.json" );
  fs.writeFileSync( filePath, JSON.stringify( posts ) );
}
