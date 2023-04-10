import { useEffect, useState } from "react";


export interface DateTimeFormatProps {
    timestamp: string;
}

const doubleDigit = ( number: number ): string => `0${number}`.slice( -2 );

export default function DateTimeFormat({ timestamp }: DateTimeFormatProps ){

  const [ hydrated, setHydrated ] = useState( false );
	useEffect( () => {
		setHydrated( true );
	}, [] );

  const date = new Date( timestamp );

  // Convert the date to UTC format on the server, which should be
  // the same for all users. Then we still use the locale format
  // once the app is hydrated.
  const month = ( hydrated ? date.getMonth() : date.getUTCMonth() ) + 1;
  const day = hydrated ? date.getDate() : date.getUTCDate();
  const year = hydrated ? date.getFullYear() : date.getUTCFullYear();
  const hours = hydrated ? date.getHours() : date.getUTCHours();
  const minutes = hydrated ? date.getMinutes() : date.getUTCMinutes();

  const ampm = hours >= 12 ? "PM" : "AM";
  const twelveHourFormat = hours % 12 || 12;

  const dateString = `${ year }-${ doubleDigit( month ) }-${ doubleDigit( day ) }`;
  const timeString = `${ doubleDigit( twelveHourFormat ) }:${ doubleDigit( minutes ) } ${ ampm }`;

  return (
    <time>
      { dateString } { timeString }
    </time>
  );
}
