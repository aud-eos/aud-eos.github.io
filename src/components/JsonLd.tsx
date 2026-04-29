export interface JsonLdProps {
  schema: Record<string, unknown>;
}

export function JsonLd({ schema }: JsonLdProps ) {
  const json = JSON.stringify( schema )
    .replace( /</g, "\\u003c" )
    .replace( />/g, "\\u003e" );
  return <script type="application/ld+json">{ json }</script>;
}
