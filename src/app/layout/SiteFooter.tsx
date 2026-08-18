import { Link } from 'react-router-dom'
import { brand } from '../brand'

const links = [
  { to: '/about', label: 'About' },
  { to: '/about#privacy', label: 'Privacy' },
  { to: '/about#terms', label: 'Terms' },
  { to: '/about#contact', label: 'Contact' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 text-xs text-ink-muted sm:flex-row">
        <p>
          © {brand.legalYear} {brand.name}. Information, not legal advice.
        </p>
        <nav aria-label="Footer">
          <ul className="flex items-center gap-4">
            {links.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
