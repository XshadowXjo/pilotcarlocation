import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from '../home/Footer'

export default function Layout() {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-[#17181A] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="contenu" tabIndex={-1} className="focus-visible:shadow-none focus-visible:outline-none">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}