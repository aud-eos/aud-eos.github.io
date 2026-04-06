import fs from "fs";
import path from "path";
import { SearchPost } from "@/lib/searchTypes";

export function generateSearchIndex( posts: SearchPost[] ) {
  const filePath = path.join( process.cwd(), "public", "search-index.json" );
  fs.writeFileSync( filePath, JSON.stringify( posts ) );
}
