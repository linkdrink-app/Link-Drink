export function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[28px] border border-amber-100/10 bg-[#16110f]/90 p-5 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">{children}</div>;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`w-full rounded-2xl bg-gradient-to-r from-amber-600 via-red-900 to-slate-950 px-4 py-4 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.98] ${props.className || ""}`} />;
}