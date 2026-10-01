import { fraudRepository } from './fraud.repository.js';
import { fraudDetectionEngine } from './engine/fraud-detection.engine.js';
import { Asset } from '../assets/asset.model.js';
import { User } from '../users/user.model.js';
import {
  RiskLevel,
  AssessmentStatus,
  ReviewDecisionType,
} from './constants/fraud.constant.js';
import {
  VerificationStatus,
  AssetStatus,
} from '../../common/constants/asset-types.constant.js';
import { NotFoundError, BadRequestError } from '../../common/errors/index.js';

export class FraudService {
  /**
   * @param {FraudRepository} [repo]
   * @param {FraudDetectionEngine} [engine]
   */
  constructor(repo = fraudRepository, engine = fraudDetectionEngine) {
    this.repo = repo;
    this.engine = engine;
  }

  /**
   * Assess asset risk using explainable signals
   * Core Rule: High-risk assets enter MANUAL_REVIEW rather than permanently banned
   *
   * @param {string} assetId
   * @param {object} [context]
   */
  async assessAsset(assetId, context = {}) {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const user = await User.findById(asset.ownerId);

    // Run explainable multi-signal engine
    const evaluation = await this.engine.evaluate({
      asset,
      user,
      context,
    });

    // Requirement: High-risk assets enter MANUAL_REVIEW rather than permanent ban
    let assessmentStatus = AssessmentStatus.PENDING_REVIEW;
    if (evaluation.riskLevel === RiskLevel.HIGH || evaluation.riskLevel === RiskLevel.CRITICAL) {
      await Asset.findByIdAndUpdate(asset._id, {
        $set: {
          verificationStatus: VerificationStatus.MANUAL_REVIEW,
          'metadata.fraudRiskLevel': evaluation.riskLevel,
          'metadata.fraudScore': evaluation.overallScore,
          'metadata.enteredManualReviewAt': new Date(),
        },
      });
      assessmentStatus = AssessmentStatus.PENDING_REVIEW;
    } else if (evaluation.riskLevel === RiskLevel.LOW) {
      assessmentStatus = AssessmentStatus.AUTO_APPROVED;
    }

    // Persist immutable explainable assessment record
    const assessment = await this.repo.create({
      targetType: 'ASSET',
      targetId: asset._id,
      assetId: asset._id,
      userId: user ? user._id : null,
      riskLevel: evaluation.riskLevel,
      overallScore: evaluation.overallScore,
      confidence: evaluation.confidence,
      individualSignals: evaluation.individualSignals,
      summaryExplanation: evaluation.summaryExplanation,
      recommendedAction: evaluation.recommendedAction,
      status: assessmentStatus,
      modelVersion: evaluation.modelVersion,
      provider: evaluation.provider,
      timestamp: evaluation.timestamp,
    });

    return assessment;
  }

  /**
   * Assess user account risk using explainable signals
   *
   * @param {string} userId
   * @param {object} [context]
   */
  async assessUser(userId, context = {}) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const evaluation = await this.engine.evaluate({
      user,
      context,
    });

    const assessment = await this.repo.create({
      targetType: 'USER',
      targetId: user._id,
      userId: user._id,
      riskLevel: evaluation.riskLevel,
      overallScore: evaluation.overallScore,
      confidence: evaluation.confidence,
      individualSignals: evaluation.individualSignals,
      summaryExplanation: evaluation.summaryExplanation,
      recommendedAction: evaluation.recommendedAction,
      status: evaluation.riskLevel === RiskLevel.LOW ? AssessmentStatus.AUTO_APPROVED : AssessmentStatus.PENDING_REVIEW,
      modelVersion: evaluation.modelVersion,
      provider: evaluation.provider,
      timestamp: evaluation.timestamp,
    });

    return assessment;
  }

  /**
   * List fraud assessments for admin oversight
   *
   * @param {object} filter
   * @param {object} options
   */
  async getAssessments(filter = {}, options = {}) {
    return this.repo.find(filter, options);
  }

  /**
   * Get single assessment by ID with individual signal details
   *
   * @param {string} id
   */
  async getAssessmentById(id) {
    const assessment = await this.repo.findById(id);
    if (!assessment) {
      throw new NotFoundError('Fraud assessment not found');
    }
    return assessment;
  }

  /**
   * Admin review API to resolve an assessment decision
   *
   * @param {string} assessmentId
   * @param {string} adminId
   * @param {object} decisionData
   * @param {string} decisionData.decision - APPROVE | FLAG_FOR_MONITORING | MANUAL_REVIEW | REJECT_ASSET | SUSPEND_USER
   * @param {string} decisionData.notes
   */
  async reviewAssessment(assessmentId, adminId, decisionData) {
    const assessment = await this.repo.findById(assessmentId);
    if (!assessment) {
      throw new NotFoundError('Fraud assessment not found');
    }

    const { decision, notes } = decisionData;
    if (!Object.values(ReviewDecisionType).includes(decision)) {
      throw new BadRequestError(`Invalid review decision: ${decision}`);
    }

    // Apply administrative action to asset / user
    if (assessment.assetId) {
      if (decision === ReviewDecisionType.APPROVE) {
        await Asset.findByIdAndUpdate(assessment.assetId._id, {
          $set: {
            verificationStatus: VerificationStatus.VERIFIED,
            status: AssetStatus.VERIFIED,
            'metadata.clearedByAdminId': adminId,
            'metadata.clearedAt': new Date(),
          },
        });
      } else if (decision === ReviewDecisionType.REJECT_ASSET) {
        await Asset.findByIdAndUpdate(assessment.assetId._id, {
          $set: {
            verificationStatus: VerificationStatus.FAILED,
            status: AssetStatus.REJECTED,
            'metadata.rejectedByAdminId': adminId,
            'metadata.rejectedAt': new Date(),
          },
        });
      }
    }

    if (assessment.userId && decision === ReviewDecisionType.SUSPEND_USER) {
      await User.findByIdAndUpdate(assessment.userId._id, {
        $set: {
          accountStatus: 'SUSPENDED',
          'metadata.suspendedByAdminId': adminId,
          'metadata.suspendedReason': notes,
        },
      });
    }

    // Update assessment status
    const updated = await this.repo.updateById(assessmentId, {
      status: AssessmentStatus.RESOLVED,
      reviewDecision: {
        decision,
        notes,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    return updated;
  }
}

export const fraudService = new FraudService();
