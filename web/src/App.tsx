import { Arrow, Spark, WalletIcon } from "./Icons";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { campaigns, eth, remaining, snapshot } from "./campaigns";
import type { Campaign } from "./campaigns";
import {
  Brand,
  CampaignCard,
  CampaignStatusBadge,
  Cover,
  FundingProgress,
} from "./components";

function Header() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav aria-label="Main navigation">
            <a
              href="/campaigns"
              aria-current={
                location.pathname.startsWith("/campaigns") ? "page" : undefined
              }
            >
              Explore campaigns
            </a>
            <a
              href="/create"
              aria-current={
                location.pathname === "/create" ? "page" : undefined
              }
            >
              Start a campaign
            </a>
          </nav>
          <button
            className="button wallet-button"
            onClick={() => dialog.current?.showModal()}
          >
            <span aria-hidden="true">
              <WalletIcon />
            </span>{" "}
            Wallet preview
          </button>
        </div>
      </header>
      <dialog ref={dialog} aria-labelledby="wallet-title">
        <div className="dialog-heading">
          <span className="eyebrow">VISUAL PREVIEW ONLY</span>
          <button
            className="close"
            aria-label="Close wallet preview"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <h2 id="wallet-title">Your wallet, your choice.</h2>
        <p>
          Browsing is always open. Wallet connection and transactions will be
          available in a future iteration.
        </p>
        <ul className="wallet-states">
          <li>
            <strong>Disconnected</strong>
            <span>Connect a wallet to take part.</span>
          </li>
          <li>
            <strong>Connected · Sepolia</strong>
            <code>0x1234…ABCD · demo address</code>
          </li>
          <li>
            <strong>Wrong network</strong>
            <span>Switch to Sepolia before continuing.</span>
          </li>
          <li>
            <strong>Awaiting signature</strong>
            <span>Review the request in your wallet.</span>
          </li>
          <li>
            <strong>Transaction pending</strong>
            <span>Waiting for chain confirmation.</span>
          </li>
        </ul>
        <p className="small">
          These are isolated design examples. No wallet is connected and no
          transaction is being processed.
        </p>
        <button
          className="button primary"
          onClick={() => dialog.current?.close()}
        >
          Continue browsing
        </button>
      </dialog>
    </>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Brand />
        <p>Good ideas move forward, together.</p>
        <span>Static prototype · No real fundraising</span>
        <a href="/campaigns">
          Explore <Arrow />
        </a>
      </div>
    </footer>
  );
}
function DemoNote() {
  return (
    <div className="demo-note">
      <span className="demo-label">DEMO</span>
      <span>
        Fictional campaigns & sample ETH amounts. No real funds accepted.
        <span className="snapshot"> Fixed snapshot: {snapshot}.</span>
      </span>
    </div>
  );
}
function Home() {
  const c = campaigns[0];
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-cross">
              <Spark />
            </span>{" "}
            SMALL IDEAS. SHARED POSSIBILITIES.
          </p>
          <h1>
            Big change
            <br />
            starts with
            <br />
            <span>all of us.</span>
          </h1>
          <p className="hero-description">
            A reading room. A shared garden. A better everyday.
            <br className="desktop-break" /> Back the ideas that bring people
            together.
          </p>
          <div className="actions">
            <a className="button primary" href="/campaigns">
              Explore campaigns{" "}
              <span>
                <Arrow />
              </span>
            </a>
            <a className="text-link" href="/create">
              Start something good{" "}
              <span>
                <Arrow direction="right" />
              </span>
            </a>
          </div>
          <div className="hero-footnote">
            <span aria-hidden="true">
              <Spark />
            </span>{" "}
            Community powered. Built for transparency.
          </div>
        </div>
        <div className="hero-feature">
          <div className="feature-kicker">
            <span>IN THE SPOTLIGHT</span>
            <span>01 / DEMO PROJECT</span>
          </div>
          <a
            href="/campaigns/1"
            className="feature-cover-link"
            aria-label={`Discover ${c.title}`}
          >
            <Cover campaign={c} featured />
          </a>
          <div className="feature-info">
            <div>
              <CampaignStatusBadge campaign={c} />
              <h2>
                <a href="/campaigns/1">
                  A little library.
                  <br />A bigger world.
                </a>
              </h2>
            </div>
            <a
              className="circle-link"
              href="/campaigns/1"
              aria-label="View little library campaign"
            >
              <Arrow />
            </a>
          </div>
          <FundingProgress campaign={c} />
        </div>
      </section>
      <div className="container">
        <DemoNote />
      </div>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR SOMETHING</p>
            <h2>Ideas worth getting behind.</h2>
          </div>
          <a className="text-link" href="/campaigns">
            View all campaigns <Arrow />
          </a>
        </div>
        <div className="campaign-grid">
          {[campaigns[1], campaigns[2], campaigns[5]].map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="container how-layout">
          <div>
            <p className="eyebrow">A SHARED WAY FORWARD</p>
            <h2>
              From a good idea
              <br />
              to a collective effort.
            </h2>
            <p>
              Clear goals. A fixed deadline.
              <br />A community that makes the difference.
            </p>
            <span className="small">
              The intended model for future blockchain integration.
            </span>
          </div>
          <ol className="steps">
            <li>
              <span>01</span>
              <div>
                <h3>Find an idea you believe in.</h3>
                <p>
                  Explore a project’s story, funding goal and timeline. No
                  wallet needed to browse.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Help it reach the finish line.</h3>
                <p>
                  Contribute ETH up to the remaining goal. Once fully funded,
                  contributions close.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>A clear outcome for everyone.</h3>
                <p>
                  After a successful deadline, the creator can withdraw. If
                  failed or cancelled, contributors can claim their own refunds.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <section className="container closing">
        <span className="tiny-cross" aria-hidden="true">
          <Spark />
        </span>
        <div>
          <h2>Every shared effort starts somewhere.</h2>
          <p>Give your community’s next good idea a place to begin.</p>
        </div>
        <a className="button primary" href="/create">
          Start a campaign <Arrow />
        </a>
      </section>
    </>
  );
}
function Explore() {
  return (
    <div className="container page">
      <div className="page-intro">
        <p className="eyebrow">THE COMMUNITY NOTICEBOARD</p>
        <h1>
          Find an idea.
          <br />
          <span>Be part of its story.</span>
        </h1>
        <p>
          Discover small projects with a shared purpose.
          <br />
          Explore the stories, the goals and the possibilities.
        </p>
      </div>
      <DemoNote />
      <div className="list-heading">
        <h2>
          All campaigns <span>06</span>
        </h2>
        <span>One community. Many possibilities.</span>
      </div>
      <div className="campaign-grid">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
      <p className="list-note">
        You’ve seen all six demonstration campaigns. Every project here is
        fictional.
      </p>
    </div>
  );
}
function Detail({ campaign: c }: { campaign: Campaign }) {
  const full = remaining(c) === 0;
  const message =
    c.status === "Cancelled"
      ? "Cancelled by the creator before the deadline. Contributors would be able to claim their own refunds."
      : c.status === "Failed"
        ? "The deadline passed without reaching the goal. Contributors would be able to claim their own refunds."
        : c.status === "Successful"
          ? "The goal was met and the deadline has passed. The creator would now be eligible to withdraw."
          : full
            ? "The goal is met. This campaign remains Active until its deadline; further contributions are closed."
            : "Contributions would be open until the deadline or until the goal is reached.";
  return (
    <div className="container page detail-page">
      <a className="back-link" href="/campaigns">
        <Arrow direction="left" /> All campaigns
      </a>
      <DemoNote />
      <div className="detail-heading">
        <CampaignStatusBadge campaign={c} />
        <h1>{c.title}</h1>
        <p>{c.description}</p>
      </div>
      <div className="detail-layout">
        <div>
          <Cover campaign={c} featured />
          <div className="story">
            <p className="eyebrow">THE IDEA BEHIND THE CAMPAIGN</p>
            <h2>A small project with shared purpose.</h2>
            <p>{c.story}</p>
            <h3>What the funding makes possible</h3>
            <p>{c.plan}</p>
            <div className="creator">
              <span className="creator-icon" aria-hidden="true">
                <Arrow />
              </span>
              <div>
                <span className="small">Fictional project creator</span>
                <strong>{c.creator}</strong>
                <code>0x1234…ABCD · demo wallet</code>
              </div>
            </div>
          </div>
        </div>
        <aside className="funding-panel" aria-label="Campaign funding">
          <p className="eyebrow">A COLLECTIVE EFFORT</p>
          <div className="raised-large">
            {eth(c.raised)} <span>ETH</span>
          </div>
          <p className="muted">raised of a {eth(c.goal)} ETH goal</p>
          <FundingProgress campaign={c} />
          <dl>
            <div>
              <dt>Remaining to goal</dt>
              <dd>{eth(remaining(c))} ETH</dd>
            </div>
            <div>
              <dt>
                {c.status === "Cancelled" ? "Original deadline" : "Deadline"}
              </dt>
              <dd>{c.deadline}</dd>
            </div>
            <div>
              <dt>Campaign status</dt>
              <dd>{c.status}</dd>
            </div>
          </dl>
          <div className={`outcome ${c.status.toLowerCase()}`}>
            <strong>
              {c.status === "Active"
                ? full
                  ? "Fully funded · awaiting deadline"
                  : "Help this idea take shape"
                : c.status === "Successful"
                  ? "Goal reached. A new beginning."
                  : c.status === "Failed"
                    ? "Goal not reached"
                    : "This campaign was cancelled"}
            </strong>
            <p>{message}</p>
          </div>
          {c.status === "Active" && !full && (
            <div className="contribution-preview">
              <label htmlFor="contribution">Contribution amount (ETH)</label>
              <input
                id="contribution"
                type="number"
                placeholder="0.00"
                disabled
                aria-describedby="contribution-help"
              />
              <span className="small" id="contribution-help">
                Maximum contribution: {eth(remaining(c))} ETH
              </span>
            </div>
          )}
          <button className="button primary full-width" disabled>
            {c.status === "Active" && !full
              ? "Contribute ETH · prototype only"
              : "Contributions closed"}
          </button>
          <p className="small panel-note">
            Wallet and contract integration are not available. No contributions,
            withdrawals or refunds can be made in this prototype.
          </p>
          <a className="text-link" href="/campaigns">
            Explore more ideas <Arrow />
          </a>
        </aside>
      </div>
    </div>
  );
}
type Field = "title" | "description" | "goal" | "duration";
function Create() {
  const [values, setValues] = useState({
    title: "",
    description: "",
    goal: "",
    duration: "14",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [reviewed, setReviewed] = useState(false);
  const result = useRef<HTMLDivElement>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!values.title.trim()) next.title = "Give your campaign a title.";
    if (!values.description.trim())
      next.description = "Tell people about your project.";
    if (!Number.isFinite(Number(values.goal)) || Number(values.goal) <= 0)
      next.goal = "Enter a funding goal greater than 0 ETH.";
    if (
      !Number.isInteger(Number(values.duration)) ||
      Number(values.duration) < 1 ||
      Number(values.duration) > 30
    )
      next.duration = "Choose a whole number from 1 to 30 days.";
    setErrors(next);
    setReviewed(Object.keys(next).length === 0);
    if (Object.keys(next).length)
      document.getElementById(Object.keys(next)[0])?.focus();
    else requestAnimationFrame(() => result.current?.focus());
  }
  return (
    <div className="container page create-page">
      <a className="back-link" href="/campaigns">
        <Arrow direction="left" /> Back to exploring
      </a>
      <div className="create-layout">
        <div className="create-intro">
          <p className="eyebrow">MAKE ROOM FOR A GOOD IDEA</p>
          <h1>
            Something good
            <br />
            starts with <span>you.</span>
          </h1>
          <p>
            Tell your story. Set a clear goal.
            <br />
            Invite your community to be part of it.
          </p>
          <div className="creation-guide">
            <h2>A little clarity goes a long way.</h2>
            <ul>
              <li>
                <span>01</span> Be specific about what you’ll make possible.
              </li>
              <li>
                <span>02</span> Set a goal that reflects what you need.
              </li>
              <li>
                <span>03</span> Choose a deadline within 30 days.
              </li>
            </ul>
          </div>
          <div className="create-note">
            <strong>Good to know</strong>
            <p>
              Funding is capped at your goal. Reaching it early closes
              contributions, but the campaign stays Active until its deadline.
            </p>
            <p>
              If the campaign fails or is cancelled, contributors can claim
              refunds once integration is available.
            </p>
          </div>
        </div>
        <form className="create-form" onSubmit={submit} noValidate>
          <div className="form-heading">
            <span className="demo-label">PROTOTYPE FORM</span>
            <h2>Your campaign, at a glance.</h2>
            <p>Try the form locally. Nothing is published or saved.</p>
          </div>
          {(["title", "description", "goal", "duration"] as Field[]).map(
            (field) => {
              const labels = {
                title: "Campaign title",
                description: "Your story",
                goal: "Funding goal (ETH)",
                duration: "Campaign duration (days)",
              };
              const help = {
                title:
                  "A clear, memorable name for your project. Up to 100 characters.",
                description:
                  "Explain the idea, who it helps and how the funds will be used. Up to 3,000 characters.",
                goal: "Native ETH only. Choose an amount greater than zero.",
                duration:
                  "Choose 1–30 whole days. The contract will support 60 seconds to 30 days.",
              };
              const props = {
                id: field,
                name: field,
                value: values[field],
                required: true,
                "aria-invalid": !!errors[field],
                "aria-describedby": `${field}-help${errors[field] ? ` ${field}-error` : ""}`,
                onChange: (
                  event: React.ChangeEvent<
                    HTMLInputElement | HTMLTextAreaElement
                  >,
                ) => {
                  setValues({ ...values, [field]: event.target.value });
                  setReviewed(false);
                },
              };
              return (
                <div className="form-field" key={field}>
                  <label htmlFor={field}>
                    {labels[field]} <span aria-hidden="true">*</span>
                  </label>
                  {field === "description" ? (
                    <textarea
                      {...props}
                      rows={5}
                      maxLength={3000}
                      placeholder="What could your community make possible, together?"
                    />
                  ) : (
                    <input
                      {...props}
                      type={
                        field === "goal" || field === "duration"
                          ? "number"
                          : "text"
                      }
                      min={
                        field === "duration"
                          ? 1
                          : field === "goal"
                            ? "0.000000000000000001"
                            : undefined
                      }
                      max={field === "duration" ? 30 : undefined}
                      step={
                        field === "goal"
                          ? "any"
                          : field === "duration"
                            ? 1
                            : undefined
                      }
                      maxLength={field === "title" ? 100 : undefined}
                      placeholder={
                        field === "title"
                          ? "e.g. A reading room for our neighbourhood"
                          : "e.g. 4"
                      }
                    />
                  )}
                  <p id={`${field}-help`} className="field-help">
                    {help[field]}
                  </p>
                  {errors[field] && (
                    <p className="field-error" id={`${field}-error`}>
                      {errors[field]}
                    </p>
                  )}
                </div>
              );
            },
          )}
          <div className="form-submit">
            <button type="submit" className="button primary full-width">
              Review demo campaign{" "}
              <span>
                <Arrow direction="right" />
              </span>
            </button>
            <p className="small">
              Local validation only. Publishing will require a connected wallet
              and a confirmed contract transaction in a future iteration.
            </p>
          </div>
          {reviewed && (
            <div
              ref={result}
              tabIndex={-1}
              className="review-result"
              role="status"
            >
              <strong>Demo details look ready.</strong>
              <p>
                “{values.title.trim()}” · {values.goal} ETH · {values.duration}{" "}
                days
              </p>
              <p>
                No campaign was created, saved or published. This is a local
                form review.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
function App() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  const c = campaigns.find((c) => path === `/campaigns/${c.id}`);
  const title =
    path === "/"
      ? "Community-powered ideas"
      : path === "/campaigns"
        ? "Explore campaigns"
        : path === "/create"
          ? "Start a campaign"
          : c?.title || "Page not found";
  document.title = `${title} · DeCen Crowdfund`;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        {path === "/" ? (
          <Home />
        ) : path === "/campaigns" ? (
          <Explore />
        ) : path === "/create" ? (
          <Create />
        ) : c ? (
          <Detail campaign={c} />
        ) : (
          <div className="container page">
            <h1>This page isn’t here.</h1>
            <p>Find your way back to the community.</p>
            <a className="button primary" href="/campaigns">
              Explore campaigns
            </a>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
export default App;
