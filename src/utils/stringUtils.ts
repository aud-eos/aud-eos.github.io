export function capitalize( str: string ): string {
  if( !str ) return str;
  return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
}

export function stripMarkdown( str: string ): string {
  return str
    .replace( /!\[.*?\]\(.*?\)/g, "" ) // remove images
    .replace( /\[([^\]]+)\]\([^)]+\)/g, "$1" ) // links → link text
    .replace( /[#*_`>~]/g, "" ) // remove markdown symbols
    .replace( /\s+/g, " " ) // normalise whitespace
    .trim();
}
