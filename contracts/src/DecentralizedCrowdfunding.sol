// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Native ETH, all-or-nothing crowdfunding with individual pull refunds.
contract DecentralizedCrowdfunding is ReentrancyGuard {
    enum Status {
        Active,
        Successful,
        Failed,
        Cancelled
    }

    struct Campaign {
        address creator;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 amountRaised;
        bool cancelled;
        bool withdrawn;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) private campaigns;
    /// @notice Recorded contributions; zeroed on refund, retained after successful withdrawal.
    mapping(uint256 => mapping(address => uint256)) public contributions;

    error InvalidCampaign();
    error EmptyTitle();
    error EmptyDescription();
    error InvalidGoal();
    error InvalidDuration();
    error CampaignNotActive();
    error ZeroContribution();
    error FundingGoalExceeded();
    error NotCreator();
    error CampaignNotSuccessful();
    error AlreadyWithdrawn();
    error RefundUnavailable();
    error NoContribution();
    error TransferFailed();

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 goal, uint256 deadline);
    event ContributionReceived(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event RefundClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event CampaignCancelled(uint256 indexed campaignId, address indexed creator);

    function createCampaign(string calldata title, string calldata description, uint256 goal, uint256 duration)
        external
        returns (uint256 campaignId)
    {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (bytes(description).length == 0) revert EmptyDescription();
        if (goal == 0) revert InvalidGoal();
        if (duration < 60 seconds || duration > 30 days) revert InvalidDuration();

        campaignId = ++campaignCount;
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            title: title,
            description: description,
            goal: goal,
            deadline: block.timestamp + duration,
            amountRaised: 0,
            cancelled: false,
            withdrawn: false
        });
        emit CampaignCreated(campaignId, msg.sender, goal, block.timestamp + duration);
    }

    function contribute(uint256 campaignId) external payable {
        Campaign storage campaign = _campaign(campaignId);
        if (_status(campaign) != Status.Active) revert CampaignNotActive();
        if (msg.value == 0) revert ZeroContribution();
        if (msg.value > campaign.goal - campaign.amountRaised) revert FundingGoalExceeded();

        contributions[campaignId][msg.sender] += msg.value;
        campaign.amountRaised += msg.value;
        emit ContributionReceived(campaignId, msg.sender, msg.value);
    }

    function withdrawFunds(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = _campaign(campaignId);
        if (msg.sender != campaign.creator) revert NotCreator();
        if (_status(campaign) != Status.Successful) revert CampaignNotSuccessful();
        if (campaign.withdrawn) revert AlreadyWithdrawn();

        campaign.withdrawn = true;
        uint256 amount = campaign.amountRaised;
        (bool success,) = payable(campaign.creator).call{value: amount}("");
        if (!success) revert TransferFailed();
        emit FundsWithdrawn(campaignId, campaign.creator, amount);
    }

    function claimRefund(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = _campaign(campaignId);
        Status status = _status(campaign);
        if (status != Status.Failed && status != Status.Cancelled) revert RefundUnavailable();
        uint256 amount = contributions[campaignId][msg.sender];
        if (amount == 0) revert NoContribution();

        contributions[campaignId][msg.sender] = 0;
        (bool success,) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        emit RefundClaimed(campaignId, msg.sender, amount);
    }

    function cancelCampaign(uint256 campaignId) external {
        Campaign storage campaign = _campaign(campaignId);
        if (msg.sender != campaign.creator) revert NotCreator();
        if (_status(campaign) != Status.Active) revert CampaignNotActive();
        campaign.cancelled = true;
        emit CampaignCancelled(campaignId, msg.sender);
    }

    function getCampaign(uint256 campaignId) external view returns (Campaign memory campaign, Status status) {
        Campaign storage stored = _campaign(campaignId);
        return (stored, _status(stored));
    }

    function getCampaignStatus(uint256 campaignId) external view returns (Status) {
        return _status(_campaign(campaignId));
    }

    function _campaign(uint256 campaignId) private view returns (Campaign storage campaign) {
        if (campaignId == 0 || campaignId > campaignCount) revert InvalidCampaign();
        return campaigns[campaignId];
    }

    // Deadline expiry is derived on reads, never synchronized through a transaction.
    function _status(Campaign storage campaign) private view returns (Status) {
        if (campaign.cancelled) return Status.Cancelled;
        if (block.timestamp < campaign.deadline) return Status.Active;
        if (campaign.amountRaised >= campaign.goal) return Status.Successful;
        return Status.Failed;
    }
}
