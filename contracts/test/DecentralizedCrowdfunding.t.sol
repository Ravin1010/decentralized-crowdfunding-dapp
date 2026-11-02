// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DecentralizedCrowdfunding as Crowdfund} from "../src/DecentralizedCrowdfunding.sol";

/// @dev Receiver used only to exercise failed sends and reentrant callbacks.
contract TestReceiver {
    Crowdfund public immutable FUND;
    bool public reject;
    bool public attack;
    bool public withdrawing;
    bool public effectsObserved;
    bytes public reentryError;
    uint256 public campaignId;

    constructor(Crowdfund target) {
        FUND = target;
    }

    function configure(uint256 id, bool rejectEth, bool reenter, bool withdraw) external {
        campaignId = id;
        reject = rejectEth;
        attack = reenter;
        withdrawing = withdraw;
    }

    receive() external payable {
        require(!reject, "receiver rejects ETH");
        if (attack) {
            if (withdrawing) {
                (Crowdfund.Campaign memory campaign,) = FUND.getCampaign(campaignId);
                effectsObserved = campaign.withdrawn;
            } else {
                effectsObserved = FUND.contributions(campaignId, address(this)) == 0;
            }
            (bool success, bytes memory reason) = address(FUND)
                .call(
                    abi.encodeWithSignature(withdrawing ? "withdrawFunds(uint256)" : "claimRefund(uint256)", campaignId)
                );
            require(!success, "reentry succeeded");
            reentryError = reason;
        }
    }
}

contract DecentralizedCrowdfundingTest is Test {
    Crowdfund internal fund;
    address internal creator = address(0xC0);
    address internal alice = address(0xA1);
    address internal bob = address(0xB0);
    uint256 internal id;
    uint256 internal deadline;

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 goal, uint256 deadline);
    event ContributionReceived(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event RefundClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount);
    event CampaignCancelled(uint256 indexed campaignId, address indexed creator);

    function setUp() public {
        vm.warp(1_000);
        fund = new Crowdfund();
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        id = _create(creator, 5 ether, 60);
        deadline = block.timestamp + 60;
    }

    function _create(address owner, uint256 goal, uint256 duration) internal returns (uint256) {
        vm.prank(owner);
        return fund.createCampaign("Community garden", "A shared garden", goal, duration);
    }

    function _give(uint256 campaignId, address who, uint256 amount) internal {
        vm.prank(who);
        fund.contribute{value: amount}(campaignId);
    }

    function _cancel(uint256 campaignId) internal {
        vm.prank(creator);
        fund.cancelCampaign(campaignId);
    }

    function _raised(uint256 campaignId) internal view returns (uint256) {
        (Crowdfund.Campaign memory campaign,) = fund.getCampaign(campaignId);
        return campaign.amountRaised;
    }

    function testCreationDetailsAndSequentialIds() public {
        assertEq(id, 1);
        vm.expectEmit(true, true, false, true, address(fund));
        emit CampaignCreated(2, bob, 7 ether, block.timestamp + 1 days);
        assertEq(_create(bob, 7 ether, 1 days), 2);
        assertEq(fund.campaignCount(), 2);
        (Crowdfund.Campaign memory campaign, Crowdfund.Status status) = fund.getCampaign(2);
        assertEq(campaign.creator, bob);
        assertEq(campaign.title, "Community garden");
        assertEq(campaign.description, "A shared garden");
        assertEq(campaign.goal, 7 ether);
        assertEq(campaign.deadline, block.timestamp + 1 days);
        assertEq(campaign.amountRaised, 0);
        assertFalse(campaign.cancelled);
        assertFalse(campaign.withdrawn);
        assertEq(uint256(status), uint256(Crowdfund.Status.Active));
    }

    function testRejectEmptyTitle() public {
        vm.expectRevert(Crowdfund.EmptyTitle.selector);
        fund.createCampaign("", "Description", 1, 60);
    }

    function testRejectEmptyDescription() public {
        vm.expectRevert(Crowdfund.EmptyDescription.selector);
        fund.createCampaign("Title", "", 1, 60);
    }

    function testRejectZeroGoal() public {
        vm.expectRevert(Crowdfund.InvalidGoal.selector);
        fund.createCampaign("Title", "Description", 0, 60);
    }

    function testRejectShortDuration() public {
        vm.expectRevert(Crowdfund.InvalidDuration.selector);
        _create(creator, 1, 59);
    }

    function testRejectLongDuration() public {
        vm.expectRevert(Crowdfund.InvalidDuration.selector);
        _create(creator, 1, 30 days + 1);
    }

    function testMinimumAndMaximumDuration() public {
        uint256 minId = _create(creator, 1, 60);
        uint256 maxId = _create(creator, 1, 30 days);
        (Crowdfund.Campaign memory minimum,) = fund.getCampaign(minId);
        (Crowdfund.Campaign memory maximum,) = fund.getCampaign(maxId);
        assertEq(minimum.deadline, block.timestamp + 60);
        assertEq(maximum.deadline, block.timestamp + 30 days);
    }

    function testContributionAccumulatesAndEmits() public {
        vm.expectEmit(true, true, false, true, address(fund));
        emit ContributionReceived(id, alice, 1 ether);
        _give(id, alice, 1 ether);
        _give(id, alice, 2 ether);
        assertEq(fund.contributions(id, alice), 3 ether);
        assertEq(_raised(id), 3 ether);
        assertEq(address(fund).balance, 3 ether);
        assertEq(alice.balance, 97 ether);
    }

    function testRejectZeroContribution() public {
        vm.expectRevert(Crowdfund.ZeroContribution.selector);
        _give(id, alice, 0);
    }

    function testExactGoalRemainsActiveAndRejectsFurtherFunding() public {
        _give(id, alice, 3 ether);
        _give(id, bob, 2 ether);
        assertEq(_raised(id), 5 ether);
        assertEq(uint256(fund.getCampaignStatus(id)), uint256(Crowdfund.Status.Active));
        vm.expectRevert(Crowdfund.FundingGoalExceeded.selector);
        _give(id, alice, 1);
    }

    function testOverfundingRevertsWithoutAccountingChanges() public {
        _give(id, alice, 3 ether);
        vm.expectRevert(Crowdfund.FundingGoalExceeded.selector);
        _give(id, bob, 2.1 ether);
        assertEq(_raised(id), 3 ether);
        assertEq(fund.contributions(id, bob), 0);
        assertEq(address(fund).balance, 3 ether);
        assertEq(bob.balance, 100 ether);
    }

    function testContributionOneSecondBeforeDeadline() public {
        vm.warp(deadline - 1);
        _give(id, alice, 1 ether);
        assertEq(_raised(id), 1 ether);
    }

    function testRejectContributionAtDeadline() public {
        vm.warp(deadline);
        vm.expectRevert(Crowdfund.CampaignNotActive.selector);
        _give(id, alice, 1 ether);
    }

    function testRejectContributionAfterDeadline() public {
        vm.warp(deadline + 1);
        vm.expectRevert(Crowdfund.CampaignNotActive.selector);
        _give(id, alice, 1 ether);
    }

    function testRejectContributionAfterCancellation() public {
        _cancel(id);
        vm.expectRevert(Crowdfund.CampaignNotActive.selector);
        _give(id, alice, 1 ether);
    }

    function testMultipleContributors() public {
        _give(id, alice, 1 ether);
        _give(id, bob, 2 ether);
        assertEq(fund.contributions(id, alice), 1 ether);
        assertEq(fund.contributions(id, bob), 2 ether);
        assertEq(_raised(id), 3 ether);
    }

    function testStatusAtDeadlineBoundaries() public {
        _give(id, alice, 5 ether);
        uint256 failed = _create(bob, 2 ether, 60);
        _give(failed, bob, 1 ether);
        vm.warp(deadline - 1);
        assertEq(uint256(fund.getCampaignStatus(id)), uint256(Crowdfund.Status.Active));
        assertEq(uint256(fund.getCampaignStatus(failed)), uint256(Crowdfund.Status.Active));
        vm.warp(deadline);
        assertEq(uint256(fund.getCampaignStatus(id)), uint256(Crowdfund.Status.Successful));
        assertEq(uint256(fund.getCampaignStatus(failed)), uint256(Crowdfund.Status.Failed));
        vm.warp(deadline + 1);
        assertEq(uint256(fund.getCampaignStatus(id)), uint256(Crowdfund.Status.Successful));
        assertEq(uint256(fund.getCampaignStatus(failed)), uint256(Crowdfund.Status.Failed));
    }

    function testStatusQueriesWriteNoStorage() public {
        _give(id, alice, 5 ether);
        vm.warp(deadline);
        vm.record();
        fund.getCampaign(id);
        fund.getCampaignStatus(id);
        (, bytes32[] memory writes) = vm.accesses(address(fund));
        assertEq(writes.length, 0);
        (bool success,) = address(fund).staticcall(abi.encodeCall(fund.getCampaignStatus, (id)));
        assertTrue(success);
    }

    function testInvalidCampaignReadsAndWrites() public {
        // Zero, next unallocated ID, and maximum ID must never expose default campaigns.
        uint256[3] memory invalid = [uint256(0), fund.campaignCount() + 1, type(uint256).max];
        for (uint256 i; i < invalid.length; ++i) {
            uint256 badId = invalid[i];
            vm.expectRevert(Crowdfund.InvalidCampaign.selector);
            fund.getCampaign(badId);
            vm.expectRevert(Crowdfund.InvalidCampaign.selector);
            fund.getCampaignStatus(badId);
            vm.expectRevert(Crowdfund.InvalidCampaign.selector);
            _give(badId, alice, 1);
            vm.expectRevert(Crowdfund.InvalidCampaign.selector);
            fund.cancelCampaign(badId);
            vm.expectRevert(Crowdfund.InvalidCampaign.selector);
            fund.withdrawFunds(badId);
            vm.expectRevert(Crowdfund.InvalidCampaign.selector);
            fund.claimRefund(badId);
        }
    }

    function testCreatorCancellationEmitsAndPersistsStatus() public {
        vm.warp(deadline - 1);
        vm.expectEmit(true, true, false, true, address(fund));
        emit CampaignCancelled(id, creator);
        _cancel(id);
        (Crowdfund.Campaign memory campaign, Crowdfund.Status status) = fund.getCampaign(id);
        assertTrue(campaign.cancelled);
        assertEq(uint256(status), uint256(Crowdfund.Status.Cancelled));
        vm.warp(deadline + 1);
        assertEq(uint256(fund.getCampaignStatus(id)), uint256(Crowdfund.Status.Cancelled));
    }

    function testFullyFundedCancellationAllowsImmediateRefund() public {
        _give(id, alice, 5 ether);
        _cancel(id);
        vm.prank(alice);
        fund.claimRefund(id);
        assertEq(alice.balance, 100 ether);
        assertEq(_raised(id), 5 ether);
        vm.warp(deadline);
        assertEq(uint256(fund.getCampaignStatus(id)), uint256(Crowdfund.Status.Cancelled));
    }

    function testRejectNonCreatorCancellation() public {
        vm.prank(alice);
        vm.expectRevert(Crowdfund.NotCreator.selector);
        fund.cancelCampaign(id);
    }

    function testRejectCancellationAtDeadline() public {
        vm.warp(deadline);
        vm.expectRevert(Crowdfund.CampaignNotActive.selector);
        _cancel(id);
    }

    function testRejectCancellationAfterDeadline() public {
        vm.warp(deadline + 1);
        vm.expectRevert(Crowdfund.CampaignNotActive.selector);
        _cancel(id);
    }

    function testRejectRepeatedCancellation() public {
        _cancel(id);
        vm.expectRevert(Crowdfund.CampaignNotActive.selector);
        _cancel(id);
    }

    function testSuccessfulWithdrawalPreservesHistoryAndEmits() public {
        _give(id, alice, 5 ether);
        vm.warp(deadline);
        vm.expectEmit(true, true, false, true, address(fund));
        emit FundsWithdrawn(id, creator, 5 ether);
        vm.prank(creator);
        fund.withdrawFunds(id);
        (Crowdfund.Campaign memory campaign, Crowdfund.Status status) = fund.getCampaign(id);
        assertTrue(campaign.withdrawn);
        assertEq(campaign.amountRaised, 5 ether);
        assertEq(creator.balance, 5 ether);
        assertEq(address(fund).balance, 0);
        assertEq(uint256(status), uint256(Crowdfund.Status.Successful));
        assertEq(fund.contributions(id, alice), 5 ether);
    }

    function testRejectEarlyWithdrawalEvenFullyFunded() public {
        _give(id, alice, 5 ether);
        vm.warp(deadline - 1);
        vm.prank(creator);
        vm.expectRevert(Crowdfund.CampaignNotSuccessful.selector);
        fund.withdrawFunds(id);
    }

    function testRejectFailedWithdrawal() public {
        _give(id, alice, 1 ether);
        vm.warp(deadline);
        vm.prank(creator);
        vm.expectRevert(Crowdfund.CampaignNotSuccessful.selector);
        fund.withdrawFunds(id);
    }

    function testRejectCancelledWithdrawal() public {
        _give(id, alice, 5 ether);
        _cancel(id);
        vm.warp(deadline);
        vm.prank(creator);
        vm.expectRevert(Crowdfund.CampaignNotSuccessful.selector);
        fund.withdrawFunds(id);
    }

    function testRejectUnauthorizedWithdrawal() public {
        _give(id, alice, 5 ether);
        vm.warp(deadline);
        vm.prank(alice);
        vm.expectRevert(Crowdfund.NotCreator.selector);
        fund.withdrawFunds(id);
    }

    function testRejectDoubleWithdrawal() public {
        _give(id, alice, 5 ether);
        vm.warp(deadline);
        vm.startPrank(creator);
        fund.withdrawFunds(id);
        vm.expectRevert(Crowdfund.AlreadyWithdrawn.selector);
        fund.withdrawFunds(id);
        vm.stopPrank();
    }

    function testRefundForFailedCampaignPreservesHistoryAndEmits() public {
        _give(id, alice, 1 ether);
        vm.warp(deadline);
        vm.expectEmit(true, true, false, true, address(fund));
        emit RefundClaimed(id, alice, 1 ether);
        vm.prank(alice);
        fund.claimRefund(id);
        assertEq(alice.balance, 100 ether);
        assertEq(fund.contributions(id, alice), 0);
        assertEq(_raised(id), 1 ether);
        assertEq(address(fund).balance, 0);
    }

    function testCancelledRefundsAreIndividual() public {
        _give(id, alice, 1 ether);
        _give(id, alice, 1 ether);
        _give(id, bob, 2 ether);
        _cancel(id);
        vm.prank(alice);
        fund.claimRefund(id);
        assertEq(alice.balance, 100 ether);
        assertEq(bob.balance, 98 ether);
        assertEq(fund.contributions(id, bob), 2 ether);
        assertEq(address(fund).balance, 2 ether);
        vm.prank(bob);
        fund.claimRefund(id);
        assertEq(bob.balance, 100 ether);
        assertEq(_raised(id), 4 ether);
        assertEq(address(fund).balance, 0);
    }

    function testRejectDoubleRefund() public {
        _give(id, alice, 1 ether);
        _cancel(id);
        vm.startPrank(alice);
        fund.claimRefund(id);
        vm.expectRevert(Crowdfund.NoContribution.selector);
        fund.claimRefund(id);
        vm.stopPrank();
    }

    function testRejectSuccessfulRefundBeforeAndAfterWithdrawal() public {
        _give(id, alice, 5 ether);
        vm.warp(deadline);
        vm.prank(alice);
        vm.expectRevert(Crowdfund.RefundUnavailable.selector);
        fund.claimRefund(id);
        vm.prank(creator);
        fund.withdrawFunds(id);
        vm.prank(alice);
        vm.expectRevert(Crowdfund.RefundUnavailable.selector);
        fund.claimRefund(id);
    }

    function testRejectActiveRefund() public {
        _give(id, alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(Crowdfund.RefundUnavailable.selector);
        fund.claimRefund(id);
    }

    function testRejectRefundWithoutContribution() public {
        _give(id, alice, 1 ether);
        vm.warp(deadline);
        vm.prank(bob);
        vm.expectRevert(Crowdfund.NoContribution.selector);
        fund.claimRefund(id);
    }

    function testWithdrawalTransferFailureRollsBackAndCanRetry() public {
        TestReceiver receiver = new TestReceiver(fund);
        uint256 target = _create(address(receiver), 1 ether, 60);
        _give(target, alice, 1 ether);
        receiver.configure(target, true, false, true);
        vm.warp(deadline);
        vm.prank(address(receiver));
        vm.expectRevert(Crowdfund.TransferFailed.selector);
        fund.withdrawFunds(target);
        (Crowdfund.Campaign memory campaign,) = fund.getCampaign(target);
        assertFalse(campaign.withdrawn);
        assertEq(campaign.amountRaised, 1 ether);
        assertEq(address(fund).balance, 1 ether);
        assertEq(address(receiver).balance, 0);
        receiver.configure(target, false, false, true);
        vm.prank(address(receiver));
        fund.withdrawFunds(target);
        assertEq(address(receiver).balance, 1 ether);
        assertEq(address(fund).balance, 0);
    }

    function testRefundTransferFailureRollsBackAndCanRetry() public {
        TestReceiver receiver = new TestReceiver(fund);
        vm.deal(address(receiver), 1 ether);
        _give(id, address(receiver), 1 ether);
        _cancel(id);
        receiver.configure(id, true, false, false);
        vm.prank(address(receiver));
        vm.expectRevert(Crowdfund.TransferFailed.selector);
        fund.claimRefund(id);
        assertEq(fund.contributions(id, address(receiver)), 1 ether);
        assertEq(_raised(id), 1 ether);
        assertEq(address(fund).balance, 1 ether);
        receiver.configure(id, false, false, false);
        vm.prank(address(receiver));
        fund.claimRefund(id);
        assertEq(address(receiver).balance, 1 ether);
        assertEq(fund.contributions(id, address(receiver)), 0);
        assertEq(address(fund).balance, 0);
    }

    function testWithdrawalReentrancyBlockedWithEffectsVisible() public {
        TestReceiver receiver = new TestReceiver(fund);
        uint256 target = _create(address(receiver), 1 ether, 60);
        _give(target, alice, 1 ether);
        _give(id, bob, 2 ether); // Unrelated escrow must remain untouched.
        receiver.configure(target, false, true, true);
        vm.warp(deadline);
        vm.prank(address(receiver));
        fund.withdrawFunds(target);
        assertTrue(receiver.effectsObserved());
        assertEq(receiver.reentryError(), abi.encodeWithSignature("ReentrancyGuardReentrantCall()"));
        assertEq(address(receiver).balance, 1 ether);
        assertEq(address(fund).balance, 2 ether);
        assertEq(fund.contributions(id, bob), 2 ether);
    }

    function testRefundReentrancyBlockedWithEffectsVisible() public {
        TestReceiver receiver = new TestReceiver(fund);
        vm.deal(address(receiver), 1 ether);
        _give(id, address(receiver), 1 ether);
        _give(id, bob, 2 ether);
        _cancel(id);
        receiver.configure(id, false, true, false);
        vm.prank(address(receiver));
        fund.claimRefund(id);
        assertTrue(receiver.effectsObserved());
        assertEq(receiver.reentryError(), abi.encodeWithSignature("ReentrancyGuardReentrantCall()"));
        assertEq(address(receiver).balance, 1 ether);
        assertEq(fund.contributions(id, address(receiver)), 0);
        assertEq(fund.contributions(id, bob), 2 ether);
        assertEq(address(fund).balance, 2 ether);
        assertEq(_raised(id), 3 ether);
    }

    function testCampaignAccountingIsolationAcrossSettlements() public {
        uint256 successful = _create(bob, 2 ether, 60);
        uint256 cancelled = _create(creator, 4 ether, 60);
        _give(id, alice, 1 ether);
        _give(successful, alice, 2 ether);
        _give(cancelled, bob, 3 ether);
        _cancel(cancelled);
        vm.prank(bob);
        fund.claimRefund(cancelled);
        assertEq(address(fund).balance, 3 ether);
        assertEq(fund.contributions(id, alice), 1 ether);
        assertEq(fund.contributions(successful, alice), 2 ether);
        vm.warp(deadline);
        vm.prank(bob);
        fund.withdrawFunds(successful);
        assertEq(address(fund).balance, 1 ether);
        vm.prank(alice);
        fund.claimRefund(id);
        assertEq(address(fund).balance, 0);
        assertEq(_raised(id), 1 ether);
        assertEq(_raised(successful), 2 ether);
        assertEq(_raised(cancelled), 3 ether);
        assertEq(alice.balance, 98 ether);
        assertEq(bob.balance, 102 ether);
    }

    function testFuzzFundingCapAndRefundConservation(uint96 first, uint96 second) public {
        uint256 a = bound(uint256(first), 1, 5 ether - 1);
        uint256 b = bound(uint256(second), 1, 5 ether - a);
        _give(id, alice, a);
        _give(id, bob, b);
        assertEq(_raised(id), a + b);
        assertLe(_raised(id), 5 ether);
        _cancel(id);
        vm.prank(alice);
        fund.claimRefund(id);
        assertEq(address(fund).balance, b);
        vm.prank(bob);
        fund.claimRefund(id);
        assertEq(address(fund).balance, 0);
        assertEq(_raised(id), a + b);
        assertEq(alice.balance, 100 ether);
        assertEq(bob.balance, 100 ether);
    }
}
