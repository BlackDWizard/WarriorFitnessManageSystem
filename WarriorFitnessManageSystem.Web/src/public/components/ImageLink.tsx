import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = {
  href: string | null
  className?: string
  tabIndex?: number
  children: ReactNode
}

// 依連結種類決定怎麼包：
// 站內路徑（/pricing）用 Link，不重新載入整個網站；外部網址開新分頁；沒有連結就只顯示內容
export default function ImageLink({ href, className, tabIndex, children }: Props) {
  if (!href) return <>{children}</>

  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className} tabIndex={tabIndex} draggable={false}>
        {children}
      </Link>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} tabIndex={tabIndex} draggable={false}>
      {children}
    </a>
  )
}