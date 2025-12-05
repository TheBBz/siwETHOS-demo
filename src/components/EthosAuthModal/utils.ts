/**
 * Utility functions for EthosAuthModal
 */

import { SCORE_COLORS } from './constants';

/**
 * Get the color for a credibility score based on Ethos score levels
 */
export function getScoreColor(score: number): string {
  if (score >= 2600) return SCORE_COLORS.renowned;
  if (score >= 2400) return SCORE_COLORS.revered;
  if (score >= 2200) return SCORE_COLORS.distinguished;
  if (score >= 2000) return SCORE_COLORS.exemplary;
  if (score >= 1800) return SCORE_COLORS.reputable;
  if (score >= 1600) return SCORE_COLORS.established;
  if (score >= 1400) return SCORE_COLORS.known;
  if (score >= 1200) return SCORE_COLORS.neutral;
  if (score >= 800) return SCORE_COLORS.questionable;
  return SCORE_COLORS.untrusted;
}

/**
 * Get the score level name for a credibility score
 */
export function getScoreLevel(score: number): string {
  if (score >= 2600) return 'Renowned';
  if (score >= 2400) return 'Revered';
  if (score >= 2200) return 'Distinguished';
  if (score >= 2000) return 'Exemplary';
  if (score >= 1800) return 'Reputable';
  if (score >= 1600) return 'Established';
  if (score >= 1400) return 'Known';
  if (score >= 1200) return 'Neutral';
  if (score >= 800) return 'Questionable';
  return 'Untrusted';
}
