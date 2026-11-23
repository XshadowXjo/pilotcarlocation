import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Véhicules', to: '/vehicules' },
  { label: 'Réservation', to: '/reservation' },
  { label: 'Tarifs & Services', to: '/tarifs-services' },
  { label: 'Contact', to: '/contact' },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user, isAdmin, signOut } = useAuth()

  return (
    <>
    <header className="sticky top-0 z-100 border-b border-black/[0.07] bg-[#E4E2E2] backdrop-blur-sm">
      <div className="flex h-20 items-center justify-between px-6 md:px-11">
        {/* Logo */}
        <NavLink to="/">
          <img className="p-5" src="/images/logo9.png" alt="Logo Pilot Car Élite" />
        </NavLink>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Auth desktop */}
        {user ? (
          <div className="hidden items-center gap-3 md:flex">
            {isAdmin && <NavLink to="/admin" className="nav-link">Admin</NavLink>}
            <NavLink to="/compte" className="nav-link">Mon compte</NavLink>
            <button className="btn-outline" onClick={() => signOut()}>Déconnexion</button>
          </div>
        ) : (
          <button className="btn-cta hidden md:inline-flex" onClick={() => setAuthModalOpen(true)}>
            Se connecter
          </button>
        )}

        {/* Bouton hamburger, mobile uniquement */}
        <button
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={isMenuOpen}
        >
          <span className={`h-0.5 w-6 bg-[#17181A] transition-transform ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`h-0.5 w-6 bg-[#17181A] transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-6 bg-[#17181A] transition-transform ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Volet nav mobile */}
      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-black/[0.07] bg-[#E4E2E2] px-6 py-4 md:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => `nav-link py-2${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              {isAdmin && (
                <NavLink to="/admin" onClick={() => setIsMenuOpen(false)} className="nav-link py-2">
                  Admin
                </NavLink>
              )}
              <NavLink to="/compte" onClick={() => setIsMenuOpen(false)} className="nav-link py-2">Mon compte</NavLink>
              <Button className="mt-2" onClick={() => { signOut(); setIsMenuOpen(false) }}>Déconnexion</Button>
            </>
          ) : (
            <Button className="mt-2" onClick={() => { setAuthModalOpen(true); setIsMenuOpen(false) }}>
              Se connecter
            </Button>
          )}
        </nav>
      )}
    </header>
    <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}