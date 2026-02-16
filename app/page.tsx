import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <span className="text-2xl font-bold tracking-tight">
          Handy<span className="text-teal">.</span>
        </span>
        <Link
          href="/onboarding"
          className="text-sm text-gray-400 hover:text-teal transition-colors"
        >
          Get Started
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight">
            Your Global Tax Compliance Platform
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Traded crypto across borders? Earned income in multiple countries?
            Handy tells you exactly what you owe, where you owe it, and how to
            stay compliant — so you never miss an obligation.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center px-8 py-4 bg-teal text-navy font-semibold rounded-lg hover:bg-teal-light transition-colors text-lg"
            >
              Check Your Obligations
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Free to check. No credit card required.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-20 max-w-5xl mx-auto w-full">
        <div className="grid sm:grid-cols-3 gap-8">
          <div className="bg-navy-light rounded-xl p-6 border border-gray-800">
            <div className="text-teal text-2xl mb-3">&#9670;</div>
            <h3 className="font-semibold text-lg mb-2">
              Multi-Jurisdiction Rules
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tax rules for 50+ countries, continuously updated. We track
              thresholds, deadlines, and filing requirements so you don&apos;t
              have to.
            </p>
          </div>
          <div className="bg-navy-light rounded-xl p-6 border border-gray-800">
            <div className="text-teal text-2xl mb-3">&#9670;</div>
            <h3 className="font-semibold text-lg mb-2">Crypto-First</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Built for the complexity of digital assets — staking rewards,
              DeFi, NFTs, cross-chain swaps. We speak your language.
            </p>
          </div>
          <div className="bg-navy-light rounded-xl p-6 border border-gray-800">
            <div className="text-teal text-2xl mb-3">&#9670;</div>
            <h3 className="font-semibold text-lg mb-2">
              Actionable Guidance
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Not just &quot;you might owe taxes.&quot; We tell you exactly what
              forms to file, which deadlines matter, and connect you to local
              professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <span>&copy; 2026 Handy. All rights reserved.</span>
          <span>Global tax compliance, simplified.</span>
        </div>
      </footer>
    </main>
  );
}
