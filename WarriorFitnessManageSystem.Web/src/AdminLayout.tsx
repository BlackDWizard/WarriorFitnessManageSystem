import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import AdminHeader from './AdminHeader'
import { adminNav, isNavItemActive } from './adminNav'
import styles from './AdminLayout.module.css'

// 前台網址：把目前網址的 admin. 拿掉。本機 admin.localhost:5173 → localhost:5173
const publicSiteUrl = `${window.location.protocol}//${window.location.host.replace(/^admin\./, '')}`

type Props = {
  displayName: string
  expiresAt: number
}

export default function AdminLayout({ displayName, expiresAt }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  const closeMenu = () => setMenuOpen(false)

  // 手機選單打開時，按 Esc 可以關閉
  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <div className={styles.shell}>
      <aside
        id="admin-sidebar"
        aria-label="後台選單"
        className={menuOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar}
      >
        <Link to="/" className={styles.brand} onClick={closeMenu}>
          Warrior Fitness
          <span className={styles.brandSub}>管理後台</span>
        </Link>

        <nav>
          {adminNav.map(group => (
            <div key={group.title} className={styles.group}>
              <p className={styles.groupTitle}>{group.title}</p>
              <ul className={styles.navList}>
                {group.items.map(item => {
                  const active = isNavItemActive(item, pathname)
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        aria-current={active ? 'page' : undefined}
                        className={active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                        onClick={closeMenu}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <a href={publicSiteUrl} target="_blank" rel="noopener noreferrer" className={styles.siteLink}>
          查看前台網站 ↗
        </a>
      </aside>

      {/* 手機選單打開時的半透明遮罩，點一下關閉選單 */}
      {menuOpen && <div className={styles.backdrop} onClick={closeMenu} aria-hidden="true" />}

      <div className={styles.main}>
        <AdminHeader
          displayName={displayName}
          expiresAt={expiresAt}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen(open => !open)}
        />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}