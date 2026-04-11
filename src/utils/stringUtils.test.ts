import { describe, it, expect } from "vitest";
import { capitalize, stripMarkdown } from "./stringUtils";

describe( "capitalize", () => {
  it( "capitalizes the first letter of a lowercase string", () => {
    expect( capitalize( "house" ) ).toBe( "House" );
  });

  it( "leaves an already-capitalized string unchanged", () => {
    expect( capitalize( "House" ) ).toBe( "House" );
  });

  it( "capitalizes only the first letter, leaving the rest as-is", () => {
    expect( capitalize( "hOUSE" ) ).toBe( "HOUSE" );
  });

  it( "handles a single character", () => {
    expect( capitalize( "a" ) ).toBe( "A" );
  });

  it( "returns an empty string unchanged", () => {
    expect( capitalize( "" ) ).toBe( "" );
  });
});

describe( "stripMarkdown", () => {
  it( "removes inline images", () => {
    expect( stripMarkdown( "Hello ![alt](https://example.com/img.png) world" ) ).toBe( "Hello world" );
  });

  it( "removes fenced code blocks", () => {
    expect( stripMarkdown( "Intro\n```js\nconst x = 1;\n```\nOutro" ) ).toBe( "Intro Outro" );
  });

  it( "removes inline code", () => {
    expect( stripMarkdown( "Use `yarn install` to install" ) ).toBe( "Use to install" );
  });

  it( "removes markdown headings", () => {
    expect( stripMarkdown( "## Section Title" ) ).toBe( "Section Title" );
  });

  it( "removes bold markers", () => {
    expect( stripMarkdown( "This is **bold** text" ) ).toBe( "This is bold text" );
  });

  it( "removes italic markers", () => {
    expect( stripMarkdown( "This is *italic* text" ) ).toBe( "This is italic text" );
  });

  it( "converts links to link text only", () => {
    expect( stripMarkdown( "Visit [Audeos](https://audeos.com) today" ) ).toBe( "Visit Audeos today" );
  });

  it( "removes list item markers", () => {
    expect( stripMarkdown( "- First item" ) ).toBe( "First item" );
  });

  it( "removes blockquote markers", () => {
    expect( stripMarkdown( "> A quoted line" ) ).toBe( "A quoted line" );
  });

  it( "normalises extra whitespace", () => {
    expect( stripMarkdown( "too   many    spaces" ) ).toBe( "too many spaces" );
  });

  it( "returns an empty string unchanged", () => {
    expect( stripMarkdown( "" ) ).toBe( "" );
  });

  it( "returns plain text unchanged", () => {
    expect( stripMarkdown( "Hello world" ) ).toBe( "Hello world" );
  });
});
