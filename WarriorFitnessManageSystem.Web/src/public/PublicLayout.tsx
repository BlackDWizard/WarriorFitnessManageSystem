import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { FaBars, FaXmark } from 'react-icons/fa6';
import { footerNav, mainNav, siteName, socialLinks } from './siteConfig';
import SocialIcons from './components/SocialIcons';
import styles from './PublicLayout.module.css';

// 年份在載入時算一次就好；寫在元件裡面，每次渲染都會重新呼叫 new Date()
const currentYear = new Date().getFullYear();

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // 換頁時捲回頁首（SPA 換頁不會自動回到最上面）
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // 點了選單項目就把手機選單收起來
  const closeMenu = () => setMenuOpen(false);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  return (
    <div className={styles.root}>
      <a href="#main" className={styles.skipLink}>
        跳到主要內容
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand} onClick={closeMenu}>
            {siteName}
          </Link>

          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            aria-label={menuOpen ? '關閉選單' : '開啟選單'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <FaXmark aria-hidden="true" size={20} /> : <FaBars aria-hidden="true" size={20} />}
          </button>

          <nav
            id="main-nav"
            aria-label="主要選單"
            className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}
          >
            {mainNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} onClick={closeMenu}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <p className={styles.footerBrand}>{siteName}</p>
            <nav aria-label="網站資訊" className={styles.footerNav}>
              {footerNav.map((item) => (
                <Link key={item.to} to={item.to} className={styles.footerLink}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <SocialIcons links={socialLinks} className={styles.social} linkClassName={styles.socialLink} />

          <p className={styles.copyright}>
            © {currentYear} {siteName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
