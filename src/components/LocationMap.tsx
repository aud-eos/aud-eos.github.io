import { FC } from "react";
import styles from "@/styles/LocationMap.module.scss";

export interface LocationMapProps {
  lat: number;
  lon: number;
  address?: string;
}

export const LocationMap: FC<LocationMapProps> = ({ lat, lon, address }) => {
  const embedUrl = `https://www.google.com/maps?q=${lat},${lon}&output=embed`;

  return (
    <section className={ styles.locationMap }>
      <header className={ styles.locationHeader }>
        <h2>Location</h2>
        { address && <p>{ address }</p> }
      </header>
      <div className={ styles.iframeWrapper }>
        <iframe
          title="Location map"
          src={ embedUrl }
          loading="lazy"
          allowFullScreen
        />
      </div>
    </section>
  );
};
