import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import DateTimeFormat from "@/components/DateTimeFormat";

// 2024-06-15T10:30:00.000Z is a Saturday in UTC
const TIMESTAMP = "2024-06-15T10:30:00.000Z";

describe( "DateTimeFormat", () => {
  it( "renders a <time> element", () => {
    render( <DateTimeFormat timestamp={ TIMESTAMP } /> );
    expect( screen.getByRole( "time" ) ).toBeInTheDocument();
  });

  it( "includes the month, day, and year", () => {
    render( <DateTimeFormat timestamp={ TIMESTAMP } /> );
    const time = screen.getByRole( "time" );
    expect( time ).toHaveTextContent( "June" );
    expect( time ).toHaveTextContent( "15" );
    expect( time ).toHaveTextContent( "2024" );
  });

  it( "includes the day name by default", () => {
    render( <DateTimeFormat timestamp={ TIMESTAMP } /> );
    expect( screen.getByRole( "time" ) ).toHaveTextContent( "Saturday" );
  });

  it( "omits the day name when withDayName is false", () => {
    render( <DateTimeFormat timestamp={ TIMESTAMP } withDayName={ false } /> );
    expect( screen.getByRole( "time" ) ).not.toHaveTextContent( "Saturday" );
  });

  it( "includes the time by default", () => {
    render( <DateTimeFormat timestamp={ TIMESTAMP } /> );
    // 10:30 UTC → 10:30 AM in UTC timezone
    expect( screen.getByRole( "time" ) ).toHaveTextContent( "10:30 AM" );
  });

  it( "omits the time when withTime is false", () => {
    render( <DateTimeFormat timestamp={ TIMESTAMP } withTime={ false } /> );
    expect( screen.getByRole( "time" ) ).not.toHaveTextContent( "AM" );
    expect( screen.getByRole( "time" ) ).not.toHaveTextContent( "PM" );
  });

  it( "formats PM times correctly", () => {
    render( <DateTimeFormat timestamp="2024-06-15T13:05:00.000Z" /> );
    expect( screen.getByRole( "time" ) ).toHaveTextContent( "01:05 PM" );
  });

  it( "formats midnight as 12:00 AM", () => {
    render( <DateTimeFormat timestamp="2024-06-15T00:00:00.000Z" /> );
    expect( screen.getByRole( "time" ) ).toHaveTextContent( "12:00 AM" );
  });

  it( "formats noon as 12:00 PM", () => {
    render( <DateTimeFormat timestamp="2024-06-15T12:00:00.000Z" /> );
    expect( screen.getByRole( "time" ) ).toHaveTextContent( "12:00 PM" );
  });
});
