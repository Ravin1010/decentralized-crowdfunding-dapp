export type Campaign = {
  id: string;
  title: string;
  description: string;
  story: string;
  plan: string;
  creator: string;
  goal: number;
  raised: number;
  deadline: string;
  status: "Active" | "Successful" | "Failed" | "Cancelled";
  cover: string;
  coverTitle: string;
  coverNote: string;
};
// Fixed snapshot: dates and statuses intentionally do not track the visitor's clock.
export const snapshot = "2 November 2026, 12:00 UTC";
export const campaigns: Campaign[] = [
  {
    id: "1",
    title: "A little library. A bigger world.",
    description:
      "Help turn an unused corner into a welcoming neighbourhood reading room.",
    story:
      "A place to sit, a story to share, and a shelf within reach. The Little Library Collective imagines a free reading room where neighbours of all ages can discover books and learn together.",
    plan: "The proposed budget covers accessible shelving, reading tables, starter books and materials for volunteer-led reading sessions.",
    creator: "Little Library Collective",
    goal: 4,
    raised: 2.6,
    deadline: "20 Nov 2026, 12:00 UTC",
    status: "Active",
    cover: "library",
    coverTitle: "Room for\nevery story.",
    coverNote: "THE LITTLE LIBRARY PROJECT",
  },
  {
    id: "2",
    title: "Tools to share. Skills to grow.",
    description:
      "A shared repair bench that helps useful things find a second life.",
    story:
      "The Repair Circle wants to make everyday repairs approachable. A shared workbench and a small tool collection would help neighbours learn from each other and keep useful objects in use.",
    plan: "Funds are planned for hand tools, safety equipment and a sturdy communal workbench.",
    creator: "Repair Circle",
    goal: 3,
    raised: 3,
    deadline: "12 Nov 2026, 12:00 UTC",
    status: "Active",
    cover: "repair",
    coverTitle: "Make good.\nTogether.",
    coverNote: "THE COMMUNITY REPAIR BENCH",
  },
  {
    id: "3",
    title: "Growing a greener gathering place.",
    description:
      "Raised garden beds and a shared space for a neighbourhood to flourish.",
    story:
      "The Common Ground group designed a small shared garden with raised beds, a seed exchange and space to gather. This fictional campaign has reached its goal and its deadline has passed.",
    plan: "The sample budget includes timber beds, soil, seeds and accessible paths.",
    creator: "Common Ground",
    goal: 5,
    raised: 5,
    deadline: "28 Oct 2026, 12:00 UTC",
    status: "Successful",
    cover: "garden",
    coverTitle: "Good things\ntake roots.",
    coverNote: "THE COMMON GROUND GARDEN",
  },
  {
    id: "4",
    title: "An open stage for local stories.",
    description:
      "Portable equipment for small performances in shared community spaces.",
    story:
      "Open Stage proposed a portable performance kit for storytelling and music. The funding deadline passed before the goal was met.",
    plan: "The intended budget covered a compact PA system, microphones and accessible stage materials.",
    creator: "Open Stage",
    goal: 2.5,
    raised: 1.1,
    deadline: "30 Oct 2026, 12:00 UTC",
    status: "Failed",
    cover: "stage",
    coverTitle: "Every voice\nhas a place.",
    coverNote: "THE OPEN STAGE PROJECT",
  },
  {
    id: "5",
    title: "More ways to move around town.",
    description: "A volunteer bicycle workshop for everyday journeys.",
    story:
      "Everyday Wheels proposed a volunteer bicycle repair space. The demo creator cancelled the campaign before its deadline after the proposed venue became unavailable.",
    plan: "The original plan included repair stands, spare parts and a secure tool cabinet.",
    creator: "Everyday Wheels",
    goal: 3.5,
    raised: 0.7,
    deadline: "16 Nov 2026, 12:00 UTC",
    status: "Cancelled",
    cover: "wheels",
    coverTitle: "Small wheels.\nNew routes.",
    coverNote: "THE EVERYDAY WHEELS WORKSHOP",
  },
  {
    id: "6",
    title: "A kitchen that brings us together.",
    description:
      "Equip a shared kitchen for neighbour-led cooking and food skills sessions.",
    story:
      "Shared Table imagines a friendly kitchen where neighbours can exchange recipes and build practical cooking skills. The space is designed around simple meals and shared knowledge.",
    plan: "The proposed budget covers cookware, food-safe storage and equipment for small cooking sessions.",
    creator: "Shared Table",
    goal: 6,
    raised: 1.8,
    deadline: "25 Nov 2026, 12:00 UTC",
    status: "Active",
    cover: "kitchen",
    coverTitle: "A seat at\nthe table.",
    coverNote: "THE SHARED TABLE KITCHEN",
  },
];
export const eth = (value: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 4 }).format(value);
export const remaining = (campaign: Campaign) =>
  Math.max(0, Number((campaign.goal - campaign.raised).toFixed(4)));
