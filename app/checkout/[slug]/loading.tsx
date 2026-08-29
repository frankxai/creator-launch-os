export default function CheckoutLoadingPage() {
  return (
    <main
      id="main-content"
      className="shell min-h-[68vh] py-20"
      aria-busy="true"
      aria-label="Loading checkout preview"
    >
      <div className="max-w-4xl animate-pulse motion-reduce:animate-none">
        <div className="h-3 w-40 rounded-full bg-ink/10" />
        <div className="mt-7 h-16 w-full rounded-2xl bg-ink/10" />
        <div className="mt-4 h-16 w-4/5 rounded-2xl bg-ink/10" />
        <div className="mt-9 h-5 w-2/3 rounded-full bg-ink/10" />
      </div>
      <span className="sr-only">Loading checkout preview</span>
    </main>
  )
}
