import Link from "next/link";
import { FC } from "react";
import { FaBandcamp, FaDropbox, FaGithub, FaInstagram, FaMixcloud, FaSoundcloud, FaSpotify, FaTiktok } from "react-icons/fa";
import { FaSignalMessenger } from "react-icons/fa6";

import styles from "@/styles/Layout.module.scss";

export const Footer: FC = () => {
  return (
    <footer className={ styles.footer }>

      <div>

        { /* Instagram */ }
        <Link href="https://www.instagram.com/Audeos" target="_blank">
            <FaInstagram size={ 50 } title="Follow DJ Audeos on Instagram" />
        </Link>

        { /* Soundcloud */ }
        <Link href="https://soundcloud.com/audeos" target="_blank">
            <FaSoundcloud size={ 50 } title="Listen DJ Audeos' music streaming on Soundcloud" />
        </Link>

        { /* TikTok */ }
        <Link href="https://www.tiktok.com/@audeos1" target="_blank">
          <FaTiktok size={ 50 } title="Follow Benny Audeos on TikTok!" />
        </Link>

        { /* Spotify */ }
        <Link href="https://open.spotify.com/user/audeos?si=c4eec00475634694&nd=1&dlsi=09e968f5187346bd" target="_blank">
          <FaSpotify size={ 50 } title="Follow Benny Audeos Playlists on Spotify" />
        </Link>

        { /* Dropbox */ }
        <Link href="https://www.dropbox.com/home/Audeos" target="_blank">
          <FaDropbox size={ 50 } title="Download free music from DJ Audeos on Dropbox" />
        </Link>

        { /* Mixcloud */ }
        <Link href="https://www.mixcloud.com/AUDEOS/" target="_blank">
          <FaMixcloud size={ 50 } title="Listen to DJ Mixes from Audeos on Mixcloud" />
        </Link>

        { /* Bandcamp */ }
        <Link href="https://audeos.bandcamp.com/" target="_blank">
          <FaBandcamp size={ 50 } title="Download music from DJ Audeos on Bandcamp" />
        </Link>

        { /* Github */ }
        <Link href="" target="_blank">
          <FaGithub size={ 50 } title="Audeos on Github" />
        </Link>

        { /* Signal */ }
        <Link href="https://signal.me/#eu/3MmHJflqdOPIJ1J1ZNmOSseSN5oW3woaADHRKZxSnasvbFg0-x5OG4q97CUKt3Iy" target="_blank">
          <FaSignalMessenger size={ 50 } title="Contact Benny on Signal" />
        </Link>

      </div>

      <div>
        <p>
          © { new Date().getFullYear() } Audeos, LLC | All Rights Reserved
        </p>
      </div>
    </footer>
  );
};
