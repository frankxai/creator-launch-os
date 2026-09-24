import { ArrowDown, ArrowRight, ArrowUpRight, Check } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { CopyInstallCommand } from "@/components/copy-install-command"
import { localInstallCommands, starterDeployUrl, starterSourceUrl } from "@/lib/install"
import { templates } from "@/lib/template-catalog"

import styles from "./start.module.css"

export const metadata: Metadata = {
  title: "Get the starter",
  description: "Deploy Creator Launch OS, explore six template directions, or run the free MIT starter locally.",
}

export default function StartPage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={`shell ${styles.intro}`} aria-labelledby="start-title">
        <div>
          <p className={styles.kicker}>Creator Launch OS · Free MIT source</p>
          <h1 id="start-title">Make it <span>your own.</span></h1>
          <p className={styles.lede}>A storefront, release studio, and six creative directions. Start with the source. Keep control of what comes next.</p>
          <a href="#directions" className={styles.textLink}>Explore the directions <ArrowDown size={16} aria-hidden="true" /></a>
        </div>

        <div className={`premium-grain ${styles.deployPanel}`}>
          <p className={styles.panelLabel}>Your copy starts here</p>
          <h2>Deploy the starter</h2>
          <p>The complete free repository, in your own Git account and Vercel project. No API keys needed to try it.</p>
          <a href={starterDeployUrl} className={styles.deployButton} aria-describedby="deploy-expectations">
            Deploy with Vercel <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <p id="deploy-expectations" className={styles.finePrint}>Opens Vercel setup. Sign in, choose an account and an unused repository name, then confirm deployment. Hosting terms and costs are separate.</p>
          <div className={styles.panelLinks}>
            <a href="#local">Run locally instead</a>
            <a href={starterSourceUrl}>Inspect the source <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <section id="directions" className={styles.directory} aria-labelledby="directions-title">
        <div className="shell">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Find your starting point</p>
              <h2 id="directions-title">Six directions. <span>Distinct points of view.</span></h2>
            </div>
            <p>Explore each interactive study before you commit. They are examples, not connected businesses.</p>
          </div>
          <div className={styles.directionGrid}>
            {templates.map((template, index) => (
              <Link key={template.id} href={`/studio/templates/${template.id}`} className={styles.direction}>
                <span className={styles.directionNumber} aria-hidden="true">0{index + 1}</span>
                <div>
                  <span className={styles.directionAudience}>{template.audience}</span>
                  <h3>{template.name}</h3>
                  <p>{template.note}</p>
                </div>
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
            ))}
          </div>
          <p className={styles.directoryNote}>The Vercel button installs the public default branch. It does not carry edits made in the template workbench.</p>
        </div>
      </section>

      <section id="local" className={`shell ${styles.local}`} aria-labelledby="local-title">
        <div>
          <p className={styles.kicker}>For your own workspace</p>
          <h2 id="local-title">Start locally.</h2>
          <p>Use Git, Node.js 22 or newer, and pnpm 10.28.0. Run these commands in a folder where you want a new copy.</p>
          <p>If a <code>creator-launch-os</code> folder already exists, choose another location. Nothing here runs automatically.</p>
          <a href={`${starterSourceUrl}#run-locally`} className={styles.textLink}>Read the setup guide <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
        <CopyInstallCommand commands={localInstallCommands} />
      </section>

      <section className={styles.nextSteps} aria-labelledby="next-title">
        <div className={`shell ${styles.nextGrid}`}>
          <div>
            <p className={styles.kicker}>After your first run</p>
            <h2 id="next-title">A beginning.<br /><span>Not a black box.</span></h2>
            <p>The studio uses sample data. Payments, member access, email capture, and AI services need their own implementation and verification.</p>
          </div>
          <ol className={styles.checklist}>
            <li><Check size={20} aria-hidden="true" /><div><h3>Make the identity yours</h3><p>Edit <code>lib/site.ts</code> and replace sample copy, colors, and assets.</p></div></li>
            <li><Check size={20} aria-hidden="true" /><div><h3>Publish real work</h3><p>Replace <code>lib/products.ts</code> with your catalog. Check rights and links before sharing.</p></div></li>
            <li><Check size={20} aria-hidden="true" /><div><h3>Test the whole path</h3><p>Keep the no-payment demo until checkout and delivery work. Verify keyboard, mobile, and reduced-motion views.</p></div></li>
          </ol>
        </div>
      </section>
    </main>
  )
}
