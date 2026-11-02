// Generated from the accepted Foundry artifact; read interface and InvalidCampaign only.
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
    type: "error",
    name: "InvalidCampaign",
    inputs: [],
  },
] as const;
