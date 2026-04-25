import { FC } from "react";
import styles from "@/styles/LocationMap.module.scss";

export interface LocationMapProps {
  googleMapsUrl?: string;
  address?: string;
}

function extractCoordinates( googleMapsUrl: string ): { lat: number; lon: number } | null {
  const match = googleMapsUrl.match( /@(-?\d+\.?\d*),(-?\d+\.?\d*)/ );
  if( !match ) {
    return null;
  }
  return { lat: Number( match[1] ), lon: Number( match[2] ) };
}

export const LocationMap: FC<LocationMapProps> = ({ googleMapsUrl, address }) => {
  const coords = googleMapsUrl ? extractCoordinates( googleMapsUrl ) : null;

  return (
    <section className={ styles.locationMap }>
      <header className={ styles.locationHeader }>
        <h2>Location</h2>
        { address && googleMapsUrl && (
          <p><a href={ googleMapsUrl } target="_blank" rel="noopener noreferrer">{ address }</a></p>
        ) }
        { address && !googleMapsUrl && (
          <p>{ address }</p>
        ) }
      </header>
      { coords && (
        <div className={ styles.iframeWrapper }>
          <iframe
            title="Location map"
            src={ `https://www.google.com/maps?q=${coords.lat},${coords.lon}&output=embed` }
            loading="lazy"
            allowFullScreen
          />
        </div>
      ) }
    </section>
  );
};
