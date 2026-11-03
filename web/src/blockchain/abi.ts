// Generated from the accepted Foundry artifact; do not edit ABI entries manually.
export const crowdfundingAbi = [
  {
    type: "function",
    name: "campaignCount",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "cancelCampaign",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRefund",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "contribute",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "contributions",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createCampaign",
    inputs: [
      {
        name: "title",
        type: "string",
        internalType: "string",
      },
      {
        name: "description",
        type: "string",
        internalType: "string",
      },
      {
        name: "goal",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "duration",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "campaignId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCampaign",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "campaign",
        type: "tuple",
        internalType: "struct DecentralizedCrowdfunding.Campaign",
        components: [
          {
            name: "creator",
            type: "address",
            internalType: "address",
          },
          {
            name: "title",
            type: "string",
            internalType: "string",
          },
          {
            name: "description",
            type: "string",
            internalType: "string",
          },
          {
            name: "goal",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "amountRaised",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "cancelled",
            type: "bool",
            internalType: "bool",
          },
          {
            name: "withdrawn",
            type: "bool",
            internalType: "bool",
          },
        ],
      },
      {
        name: "status",
        type: "uint8",
        internalType: "enum DecentralizedCrowdfunding.Status",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCampaignStatus",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint8",
        internalType: "enum DecentralizedCrowdfunding.Status",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "withdrawFunds",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CampaignCancelled",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CampaignCreated",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "goal",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "deadline",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ContributionReceived",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "contributor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FundsWithdrawn",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "creator",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RefundClaimed",
    inputs: [
      {
        name: "campaignId",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "contributor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AlreadyWithdrawn",
    inputs: [],
  },
  {
    type: "error",
    name: "CampaignNotActive",
    inputs: [],
  },
  {
    type: "error",
    name: "CampaignNotSuccessful",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyDescription",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyTitle",
    inputs: [],
  },
  {
    type: "error",
    name: "FundingGoalExceeded",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidCampaign",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidDuration",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidGoal",
    inputs: [],
  },
  {
    type: "error",
    name: "NoContribution",
    inputs: [],
  },
  {
    type: "error",
    name: "NotCreator",
    inputs: [],
  },
  {
    type: "error",
    name: "ReentrancyGuardReentrantCall",
    inputs: [],
  },
  {
    type: "error",
    name: "RefundUnavailable",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferFailed",
    inputs: [],
  },
  {
    type: "error",
    name: "ZeroContribution",
    inputs: [],
  },
] as const;
