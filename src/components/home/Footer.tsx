const footerLinks = ['Mentions légales', 'CGU', 'Confidentialité']

export default function Footer() {
  return (
    <footer className="flex flex-col items-center gap-4 border-t border-black/[0.08] bg-[#D8D8D6] px-6 py-6 text-center md:flex-row md:justify-between md:px-11 md:text-left">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 shrink-0 rotate-45 bg-[#B8F000]" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#17181A]">
          PCE — Pilot Car Élite
        </span>
      </div>

      <p className="m-0 text-[11px] tracking-wide text-[#4A4C50]">
        © 2026 PCE — PILOT CAR ÉLITE. Tous droits réservés. — Yvelines, France
      </p>

      <div className="flex gap-5">
        {footerLinks.map((link) => (
          <button
            key={link}
            className="text-[10px] font-bold uppercase tracking-wider text-[#4A4C50] transition-colors hover:text-[#17181A]"
          >
            {link}
          </button>
        ))}
      </div>
    </footer>
  )
}