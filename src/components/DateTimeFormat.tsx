import { useEffect, useState } from "react";


export interface DateTimeFormatProps {
    timestamp: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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
  const day = hydrated ? date.getDate() : date.getUTCDate();
  const year = hydrated ? date.getFullYear() : date.getUTCFullYear();
  const hours = hydrated ? date.getHours() : date.getUTCHours();
  const minutes = hydrated ? date.getMinutes() : date.getUTCMinutes();
  const dayName = hydrated ? DAY_NAMES[date.getDay()] : DAY_NAMES[date.getUTCDay()];
  const monthName = hydrated ? MONTH_NAMES[date.getMonth()] : MONTH_NAMES[date.getUTCMonth()];

  const ampm = hours >= 12 ? "PM" : "AM";
  const twelveHourFormat = hours % 12 || 12;

  const timeString = `${ doubleDigit( twelveHourFormat ) }:${ doubleDigit( minutes ) } ${ ampm }`;

  return (
    <time>
      { dayName }, { monthName } { day }, { year } { timeString }
    </time>
  );
}
