import type { IconType } from 'react-icons';
import { FaFacebook, FaInstagram, FaLine, FaThreads, FaTiktok, FaYoutube } from 'react-icons/fa6';
import type { SocialLink, SocialPlatform } from '../siteConfig';

// Record<SocialPlatform, ...> 強制每個平台都要有對應的圖示與名稱，漏了會編譯失敗
const platformMeta: Record<SocialPlatform, { label: string; Icon: IconType }> = {
  facebook: { label: 'Facebook', Icon: FaFacebook },
  instagram: { label: 'Instagram', Icon: FaInstagram },
  threads: { label: 'Threads', Icon: FaThreads },
  line: { label: 'LINE', Icon: FaLine },
  youtube: { label: 'YouTube', Icon: FaYoutube },
  tiktok: { label: 'TikTok', Icon: FaTiktok },
};

interface SocialIconsProps {
  links: SocialLink[];
  className?: string;
  linkClassName?: string;
}

export default function SocialIcons({ links, className, linkClassName }: SocialIconsProps) {
  if (links.length === 0) return null;

  return (
    <ul className={className}>
      {links.map((link) => {
        const { label, Icon } = platformMeta[link.platform];
        return (
          <li key={link.platform}>
            {/* 只有圖示沒有文字，所以用 aria-label 告訴螢幕報讀器這是哪個平台 */}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={linkClassName}
            >
              <Icon aria-hidden="true" size={22} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
