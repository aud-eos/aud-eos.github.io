export function capitalize( str: string ): string {
  if( !str ) return str;
  return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
}

export function stripMarkdown( str: string ): string {
  return str
    .replace( /!\[.*?\]\(.*?\)/g, "" ) // remove images
    .replace( /```[\s\S]*?```/g, "" ) // remove fenced code blocks
    .replace( /`[^`]*`/g, "" ) // remove inline code
    .replace( /#{1,6}\s/g, "" ) // remove headings
    .replace( /\*\*|__|\*|_/g, "" ) // remove bold / italic markers
    .replace( /\[([^\]]+)\]\([^)]+\)/g, "$1" ) // links → link text
    .replace( /^\s*[-*+>]\s/gm, "" ) // remove list items and blockquotes
    .replace( /\s+/g, " " ) // normalise whitespace
    .trim();
}
