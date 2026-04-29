import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "@/components/JsonLd";

describe( "JsonLd", () => {
  it( "renders a script tag with type application/ld+json", () => {
    const { container } = render( <JsonLd schema={ { "@type": "WebSite" } } /> );
    const script = container.querySelector( "script" );
    expect( script?.getAttribute( "type" ) ).toBe( "application/ld+json" );
  });

  it( "stringifies the schema as the script body", () => {
    const { container } = render(
      <JsonLd schema={ { "@type": "WebSite", "name": "Audeos" } } />,
    );
    const script = container.querySelector( "script" );
    expect( script?.textContent ).toContain( "\"@type\":\"WebSite\"" );
    expect( script?.textContent ).toContain( "\"name\":\"Audeos\"" );
  });

  it( "escapes < to \\u003c so </script> in strings cannot break out", () => {
    const malicious = { "@type": "WebSite", "headline": "Hi </script><script>alert(1)</script>" };
    const { container } = render( <JsonLd schema={ malicious } /> );
    const script = container.querySelector( "script" );
    expect( script?.textContent ).not.toContain( "</script>" );
    expect( script?.textContent ).toContain( "\\u003c/script\\u003e" );
  });
});
