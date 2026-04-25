import { FC } from "react";
import styles from "@/styles/LocationMap.module.scss";

export interface LocationMapProps {
  lat: number;
  lon: number;
}

export const LocationMap: FC<LocationMapProps> = ({ lat, lon }) => {
  const embedUrl = `https://www.google.com/maps?q=${lat},${lon}&output=embed`;

  return (
    <section className={ styles.locationMap }>
      <header className={ styles.locationHeader }>
        <h2>Location</h2>
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
