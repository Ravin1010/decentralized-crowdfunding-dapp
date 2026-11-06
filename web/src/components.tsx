import { Arrow } from "./Icons";
import type { Campaign } from "./campaigns";
import { eth, remaining, fundingPercent } from "./campaigns";

export function Brand() {
  return (
    <a className="brand" href="/">
      <span className="brand-mark" aria-hidden="true">
        d<span>c</span>
      </span>
      <span>
        DeCen <span className="brand-sub">CROWDFUND</span>
      </span>
    </a>
  );
}
export function CampaignStatusBadge({ campaign: c }: { campaign: Campaign }) {
  return (
    <span className={`badge ${c.status.toLowerCase()}`}>
      <span aria-hidden="true">●</span>{" "}
      {c.status === "Active" && remaining(c) === 0n
        ? "Fully funded — awaiting deadline"
        : c.status}
    </span>
  );
}
export function Cover({
  campaign: c,
  featured = false,
  decorative = true,
}: {
  campaign: Campaign;
  featured?: boolean;
  decorative?: boolean;
}) {
  return (
    <div
      className={`cover ${c.cover} ${featured ? "cover-featured" : ""}`}
      aria-hidden={decorative}
    >
      <span className="cover-note">{c.coverNote}</span>
      <strong>{c.coverTitle}</strong>
      <div className="cover-art">
        {c.cover === "library" ? (
          <>
            <i />
            <i />
            <i />
            <i />
            <i />
          </>
        ) : c.cover === "wheels" ? (
          <>
            <i />
            <i />
          </>
        ) : (
          <>
            <i />
            <i />
            <i />
          </>
        )}
      </div>
      <span className="cover-bottom">
        A COMMUNITY IDEA{" "}
        <span>
          <Arrow />
        </span>
      </span>
    </div>
  );
}
export function FundingProgress({ campaign: c }: { campaign: Campaign }) {
  const percent = fundingPercent(c);
  return (
    <div className="funding">
      <div className="funding-top">
        <span>
          <strong>{eth(c.raised)} ETH</strong> raised
        </span>
        <span>{Math.floor(percent)}%</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={`${c.title} funding`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${eth(c.raised)} of ${eth(c.goal)} ETH`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="funding-bottom">
        <span>Goal {eth(c.goal)} ETH</span>
        <span>{eth(remaining(c))} ETH remaining</span>
      </div>
    </div>
  );
}
export function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  return (
    <article className="campaign-card">
      <a
        className="cover-link"
        href={`/campaigns/${c.id}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <Cover campaign={c} />
      </a>
      <div className="card-content">
        <CampaignStatusBadge campaign={c} />
        <h3>
          <a href={`/campaigns/${c.id}`}>{c.title}</a>
        </h3>
        <p>{c.description}</p>
        <FundingProgress campaign={c} />
        <div className="card-end">
          <span>
            {c.status === "Active"
              ? "Deadline"
              : c.status === "Cancelled"
                ? "Original deadline"
                : "Ended"}{" "}
            · {c.deadline.split(",")[0]}
          </span>
          <span aria-hidden="true">
            <Arrow />
          </span>
        </div>
      </div>
    </article>
  );
}
