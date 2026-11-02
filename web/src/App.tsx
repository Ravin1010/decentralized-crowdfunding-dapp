import { Arrow, Spark } from "./Icons";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { eth, remaining, snapshot } from "./campaigns";
import type { Campaign } from "./campaigns";
import { parseEther } from "viem";
import { Wallet } from "./Wallet";
import { contractConfig } from "./blockchain/config";
import {
  parseCampaignId,
  useCampaignList,
  useCampaign,
  useContribution,
} from "./blockchain/reads";
import {
  Brand,
  CampaignCard,
  CampaignStatusBadge,
  Cover,
  FundingProgress,
} from "./components";

function Header() {
  return (
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
            aria-current={location.pathname === "/create" ? "page" : undefined}
          >
            Start a campaign
          </a>
        </nav>
        <Wallet />
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Brand />
        <p>Good ideas move forward, together.</p>
        <span>Read-only · No transactions enabled</span>
        <a href="/campaigns">
          Explore <Arrow />
        </a>
      </div>
    </footer>
  );
}
function DemoNote() {
  if (contractConfig.mode === "live")
    return (
      <div className="demo-note live-context">
        <span className="demo-label">SEPOLIA · READ ONLY</span>
        <span>
          Contract <code>{contractConfig.address}</code>
          <br />
          Chain 11155111 · Public RPC reads · No transactions enabled
        </span>
      </div>
    );
  return (
    <div className="demo-note">
      <span className="demo-label">DEMO</span>
      <span>
        Fictional campaigns & sample ETH amounts. No real funds accepted.{" "}
        {contractConfig.demoReason}
        <span className="snapshot"> Fixed snapshot: {snapshot}.</span>
      </span>
    </div>
  );
}
function Home() {
  const list = useCampaignList();
  const c = list.data?.[0];
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
        {c ? (
          <div className="hero-feature">
            <div className="feature-kicker">
              <span>IN THE SPOTLIGHT</span>
              <span>
                {c.mode === "demo" ? "01 / DEMO PROJECT" : `CAMPAIGN #${c.id}`}
              </span>
            </div>
            <a
              href={c ? `/campaigns/${c.id}` : "/campaigns"}
              className="feature-cover-link"
              aria-label={`Discover ${c.title}`}
            >
              <Cover campaign={c} featured />
            </a>
            <div className="feature-info">
              <div>
                <CampaignStatusBadge campaign={c} />
                <h2>
                  <a href={c ? `/campaigns/${c.id}` : "/campaigns"}>
                    {c.title}
                  </a>
                </h2>
              </div>
              <a
                className="circle-link"
                href={c ? `/campaigns/${c.id}` : "/campaigns"}
                aria-label={`View ${c.title}`}
              >
                <Arrow />
              </a>
            </div>
            <FundingProgress campaign={c} />
          </div>
        ) : (
          <div className="hero-feature">
            <p className="eyebrow">THE COMMUNITY NOTICEBOARD</p>
            <h2>A space for shared possibilities.</h2>
            <p>Explore campaigns to see what’s on the noticeboard.</p>
            <a className="text-link" href="/campaigns">
              Explore campaigns <Arrow />
            </a>
          </div>
        )}
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
        <ReadStatus result={list} />
        <div className="campaign-grid">
          {(contractConfig.mode === "demo" && list.data
            ? [list.data[1], list.data[2], list.data[5]]
            : list.data?.slice(0, 3) || []
          ).map((c) => (
            <CampaignCard
              key={`${contractConfig.chainId}:${contractConfig.address}:${c.id}`}
              campaign={c}
            />
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
              Financial actions will be available in Iteration 5.
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
  const [page, setPage] = useState(0);
  const list = useCampaignList(page);
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
          All campaigns <span>{list.total?.toString() ?? "…"}</span>
        </h2>
        <span>One community. Many possibilities.</span>
      </div>
      <ReadStatus result={list} />
      <div className="campaign-grid">
        {(list.data || []).map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
      {contractConfig.mode === "demo" ? (
        <p className="list-note">
          You’ve seen all six demonstration campaigns. Every project here is
          fictional.
        </p>
      ) : (
        <div className="actions pagination" aria-label="Campaign pages">
          <button
            className="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>Page {page + 1}</span>
          <button
            className="button"
            disabled={!list.hasNext}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
function Detail({ campaign: c }: { campaign: Campaign }) {
  const full = remaining(c) === 0n;
  const message =
    c.status === "Cancelled"
      ? "Cancelled by the creator before the deadline. Contributors would be able to claim their own refunds."
      : c.status === "Failed"
        ? "The deadline passed without reaching the goal. Contributors would be able to claim their own refunds."
        : c.status === "Successful"
          ? "The goal was met and the deadline has passed. The creator can withdraw once under the contract rules, unless already withdrawn."
          : full
            ? "The goal is met. This campaign remains Active until its deadline; further contributions are closed."
            : "The campaign is accepting funding under its contract rules. Transactions are unavailable in this read-only checkpoint.";
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
            <h2>
              {c.mode === "demo"
                ? "A small project with shared purpose."
                : "The creator’s description"}
            </h2>
            <p className="campaign-description">
              {c.mode === "demo" ? c.story : c.description}
            </p>
            {c.mode === "demo" && (
              <>
                <h3>What the funding makes possible</h3>
                <p>{c.plan}</p>
              </>
            )}
            <div className="creator">
              <span className="creator-icon" aria-hidden="true">
                <Arrow />
              </span>
              <div>
                <span className="small">
                  {c.mode === "demo"
                    ? "Fictional project creator"
                    : "Creator wallet"}
                </span>
                <strong>{c.creator}</strong>
                {c.mode === "demo" && <code>0x1234…ABCD · demo wallet</code>}
              </div>
            </div>
          </div>
        </div>
        <aside className="funding-panel" aria-label="Campaign funding">
          <p className="eyebrow">A COLLECTIVE EFFORT</p>
          <div
            className={`raised-large ${eth(c.raised).length > 14 ? "precise-amount" : ""}`}
          >
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
            <div>
              <dt>Creator withdrawal</dt>
              <dd>
                {c.mode === "demo"
                  ? "Sample only"
                  : c.withdrawn
                    ? "Completed"
                    : "Not withdrawn"}
              </dd>
            </div>
          </dl>
          <div className={`outcome ${c.status.toLowerCase()}`}>
            <strong>
              {c.status === "Active"
                ? full
                  ? "Fully funded — awaiting deadline"
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
              ? "Contribute ETH · unavailable"
              : "Contributions closed"}
          </button>
          <p className="small panel-note">
            Read-only checkpoint. Contributions, withdrawals, refunds and
            cancellation are unavailable until Iteration 5.
          </p>
          {c.mode === "live" && (
            <WalletContribution campaignId={BigInt(c.id)} />
          )}
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
    try {
      if (
        parseEther(values.goal) <= 0n ||
        !/^\d+(\.\d{1,18})?$/.test(values.goal)
      )
        throw new Error();
    } catch {
      next.goal = "Enter a positive ETH amount with up to 18 decimal places.";
    }
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
  const detailMatch = path.match(/^\/campaigns\/([^/]+)$/);
  const title =
    path === "/"
      ? "Community-powered ideas"
      : path === "/campaigns"
        ? "Explore campaigns"
        : path === "/create"
          ? "Start a campaign"
          : detailMatch
            ? "Campaign details"
            : "Page not found";
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
        ) : detailMatch ? (
          <CampaignDetail idText={detailMatch[1]} />
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

type ReadResult = {
  error?: string | null;
  loading: boolean;
  refreshing: boolean;
  updatedAt: number;
  refresh: () => Promise<void>;
  data?: unknown;
  total?: bigint;
};
function ReadStatus({ result }: { result: ReadResult }) {
  if (contractConfig.mode === "demo") return null;
  return (
    <div className="read-status" aria-live="polite">
      {result.error ? (
        <p role="alert">
          Could not read the Sepolia contract.{" "}
          {result.data
            ? "Previous data shown — stale, not confirmed by the latest refresh."
            : "No campaign data is available."}{" "}
          {result.error}
        </p>
      ) : result.loading ? (
        <p role="status">Loading campaigns from Sepolia…</p>
      ) : result.total === 0n ? (
        <p role="status">No campaigns yet. This contract has no campaigns.</p>
      ) : (
        <p>
          {result.refreshing
            ? "Refreshing public data…"
            : "Public data loaded."}{" "}
          {result.updatedAt > 0 &&
            `Last successful read: ${new Date(result.updatedAt).toLocaleTimeString()}.`}
        </p>
      )}
      <button
        className="button"
        disabled={result.refreshing}
        onClick={() => void result.refresh()}
      >
        Refresh public data
      </button>
    </div>
  );
}
function CampaignDetail({ idText }: { idText: string }) {
  const id = parseCampaignId(idText);
  if (id === undefined)
    return (
      <div className="container page">
        <h1>Invalid campaign ID</h1>
        <p>Choose a positive campaign ID from the noticeboard.</p>
        <a href="/campaigns">All campaigns</a>
      </div>
    );
  return <CampaignRead id={id} />;
}
function CampaignRead({ id }: { id: bigint }) {
  const result = useCampaign(id);
  if (!result.data)
    return (
      <div className="container page">
        <DemoNote />
        <h1>Campaign #{id.toString()}</h1>
        <ReadStatus result={result} />
        {!result.loading && !result.error && <p>Campaign not found.</p>}
        <a href="/campaigns">All campaigns</a>
      </div>
    );
  return (
    <>
      <div className="container">
        <ReadStatus result={result} />
      </div>
      <Detail campaign={result.data} />
    </>
  );
}
function WalletContribution({ campaignId }: { campaignId: bigint }) {
  const read = useContribution(campaignId);
  return (
    <div className="wallet-contribution" aria-live="polite">
      <h3>Your contribution</h3>
      {!read.isConnected ? (
        <p>Connect your wallet to read your recorded contribution.</p>
      ) : read.chainId !== contractConfig.chainId ? (
        <p>Switch to Sepolia to read this wallet’s contribution.</p>
      ) : read.rpcError ? (
        <p role="alert">
          Public RPC unavailable. Your contribution could not be confirmed.
        </p>
      ) : !read.enabled ? (
        <p>Waiting for the public RPC…</p>
      ) : read.isError ? (
        <p role="alert">
          Your contribution could not be confirmed. Refresh to retry.
        </p>
      ) : read.data === undefined ? (
        <p>Reading your contribution…</p>
      ) : (
        <p>
          <strong>{eth(read.data)} ETH</strong>
          {read.isFetching && " · Refreshing…"}
        </p>
      )}
      <p className="small">
        Recorded contributions are not automatically refundable balances.
        Successful campaigns retain records after withdrawal.
      </p>
      {read.enabled && (
        <button
          className="button"
          disabled={read.isFetching}
          onClick={() => void read.refetch()}
        >
          Refresh your contribution
        </button>
      )}
    </div>
  );
}
