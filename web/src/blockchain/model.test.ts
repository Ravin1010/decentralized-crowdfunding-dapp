import { describe, it, expect } from "vitest";
import { formatEther, parseEther } from "viem";
import { eth, remaining, fundingPercent } from "../campaigns";
import { readConfiguration } from "./config";
import { parseCampaignId, toCampaign } from "./reads";
import { crowdfundingAbi } from "./abi";

const address = "0x1111111111111111111111111111111111111111";
const record = {
  creator: address,
  title: "On-chain title",
  description: "Only the stored description",
  goal: parseEther("2"),
  amountRaised: parseEther("2"),
  deadline: 1900000000n,
  cancelled: false,
  withdrawn: false,
} as const;
describe("exact financial display", () => {
  it("preserves all 18 decimal places", () =>
    expect(eth(1000000000000000001n)).toBe("1.000000000000000001"));
  it("formats one wei without floating point", () =>
    expect(eth(1n)).toBe(formatEther(1n)));
  it("subtracts and clamps remaining wei", () => {
    expect(remaining({ goal: 10n, raised: 3n })).toBe(7n);
    expect(remaining({ goal: 10n, raised: 11n })).toBe(0n);
  });
  it("never rounds almost funded up to 100%", () =>
    expect(
      fundingPercent({ goal: parseEther("1"), raised: parseEther("1") - 1n }),
    ).toBe(99));
  it("caps overfunded or exact goals at 100%", () => {
    expect(fundingPercent({ goal: 10n, raised: 11n })).toBe(100);
    expect(fundingPercent({ goal: 10n, raised: 10n })).toBe(100);
  });
});
describe("contract model and configuration", () => {
  it.each([
    [0, "Active"],
    [1, "Successful"],
    [2, "Failed"],
    [3, "Cancelled"],
  ] as const)("interprets status %i as %s", (ordinal, status) =>
    expect(toCampaign(1n, [record, ordinal]).status).toBe(status),
  );
  it("keeps fully funded Active and withdrawal separate", () => {
    expect(toCampaign(1n, [record, 0]).status).toBe("Active");
    const c = toCampaign(1n, [{ ...record, withdrawn: true }, 1]);
    expect(c.status).toBe("Successful");
    expect(c.withdrawn).toBe(true);
    expect(c.raised).toBe(record.amountRaised);
  });
  it("does not fabricate a live story, plan, or creator", () => {
    const c = toCampaign(9n, [record, 0]);
    expect(c.creator).toBe(address);
    expect(c.story).toBe("");
    expect(c.plan).toBe("");
    expect(c.id).toBe("9");
  });
  it.each(["0", "-1", "1.5", "abc", "01", (2n ** 256n).toString()])(
    "rejects invalid ID %s",
    (id) => expect(parseCampaignId(id)).toBeUndefined(),
  );
  it("accepts the uint256 ID boundary", () =>
    expect(parseCampaignId((2n ** 256n - 1n).toString())).toBe(
      2n ** 256n - 1n,
    ));
  it("defaults to demo without a valid nonzero contract", () => {
    expect(readConfiguration().mode).toBe("demo");
    expect(readConfiguration("bad").mode).toBe("demo");
    expect(
      readConfiguration("0x0000000000000000000000000000000000000000").mode,
    ).toBe("demo");
  });
  it("uses Sepolia with a public default endpoint", () => {
    const config = readConfiguration(address);
    expect(config.mode).toBe("live");
    expect(config.chainId).toBe(11155111);
    expect(config.rpcUrl).toMatch(/^https:/);
  });
  it.each([
    "not-a-url",
    "ftp://example.com",
    "https://name:password@example.com",
    "http://example.com",
  ])("rejects unsafe RPC configuration %s", (url) =>
    expect(readConfiguration(address, url).error).toBeTruthy(),
  );
  it("permits localhost HTTP for verification", () =>
    expect(
      readConfiguration(address, "http://127.0.0.1:18545").error,
    ).toBeUndefined());
  it("exposes only actual read ABI and custom error", () => {
    expect(
      crowdfundingAbi
        .filter((entry) => entry.type === "function")
        .map((entry) => entry.name)
        .sort(),
    ).toEqual([
      "campaignCount",
      "contributions",
      "getCampaign",
      "getCampaignStatus",
    ]);
    expect(
      crowdfundingAbi
        .filter((entry) => entry.type === "function")
        .every((entry) => entry.stateMutability === "view"),
    ).toBe(true);
  });
});
