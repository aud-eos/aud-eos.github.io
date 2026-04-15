import Link from "next/link";
import { FC } from "react";
import { IconType } from "react-icons";
import {
  FaBandcamp,
  FaDropbox,
  FaGithub,
  FaInstagram,
  FaMixcloud,
  FaSoundcloud,
  FaSpotify,
  FaTiktok,
  FaTwitter,
  FaFacebook,
  FaYoutube,
} from "react-icons/fa";
import { FaSignalMessenger } from "react-icons/fa6";
import { resetCookieConsent } from "@/components/CookieConsent";
import styles from "@/styles/Layout.module.scss";

interface SocialLink {
  href: string;
  icon: IconType;
  title: string;
}

const ICON_SIZE = 36;

const SOCIAL_LINKS: SocialLink[] = [
  { href: "https://www.instagram.com/Audeos", icon: FaInstagram, title: "Follow DJ Audeos on Instagram" },
  { href: "https://soundcloud.com/audeos", icon: FaSoundcloud, title: "Listen DJ Audeos' music streaming on Soundcloud" },
  { href: "https://www.tiktok.com/@audeos1", icon: FaTiktok, title: "Follow Benny Audeos on TikTok!" },
  { href: "https://open.spotify.com/user/audeos?si=c4eec00475634694&nd=1&dlsi=09e968f5187346bd", icon: FaSpotify, title: "Follow Benny Audeos Playlists on Spotify" },
  { href: "https://www.youtube.com/@Audeos", icon: FaYoutube, title: "DJ Audeos Youtube Channel" },
  { href: "https://www.dropbox.com/home/Audeos", icon: FaDropbox, title: "Download free music from DJ Audeos on Dropbox" },
  { href: "https://www.mixcloud.com/AUDEOS/", icon: FaMixcloud, title: "Listen to DJ Mixes from Audeos on Mixcloud" },
  { href: "https://audeos.bandcamp.com/", icon: FaBandcamp, title: "Download music from DJ Audeos on Bandcamp" },
  { href: "https://x.com/audeos", icon: FaTwitter, title: "Audeos on Twitter/X" },
  { href: "https://www.facebook.com/audeos", icon: FaFacebook, title: "DJ Audeos on Facebook" },
  { href: "https://github.com/aud-eos", icon: FaGithub, title: "Audeos on Github" },
  { href: "https://signal.me/#eu/3MmHJflqdOPIJ1J1ZNmOSseSN5oW3woaADHRKZxSnasvbFg0-x5OG4q97CUKt3Iy", icon: FaSignalMessenger, title: "Contact Benny on Signal" },
];

export const Footer: FC = () => {
  return (
    <footer className={ styles.footer }>

      <div className={ styles.socialLinks }>
        { SOCIAL_LINKS.map( ({ href, icon: Icon, title }) => (
          <Link key={ href } href={ href } target="_blank">
            <Icon size={ ICON_SIZE } title={ title } />
          </Link>
        ) ) }
      </div>

      <div>
        <p>
          © { new Date().getFullYear() } Audeos, LLC | All Rights Reserved
        </p>
      </div>

      <div>
        <button className={ styles.cookieLink } onClick={ resetCookieConsent }>
          Update Cookie Preferences
        </button>
      </div>

    </footer>
  );
};
