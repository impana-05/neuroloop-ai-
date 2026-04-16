/**
 * Spaced Repetition Algorithm (SM-2 based)
 * 
 * This algorithm calculates the next review date for a concept based on the user's performance.
 * It considers accuracy, number of attempts, and the previous review history.
 */

export interface SpacedRepetitionResult {
  nextReviewDate: number;
  accuracy: number;
  attempts: number;
  weakScore: number;
}

/**
 * Calculates the next review date using a dynamic interval based on performance.
 * 
 * @param isCorrect Whether the user answered correctly in the current session
 * @param currentAccuracy Current accuracy (0-100)
 * @param currentAttempts Number of previous attempts
 * @param currentWeakScore Current weak score (tracks consecutive failures)
 * @returns Updated performance metrics and next review date
 */
export function calculateNextReview(
  isCorrect: boolean,
  currentAccuracy: number,
  currentAttempts: number,
  currentWeakScore: number
): SpacedRepetitionResult {
  const now = Date.now();
  const attempts = currentAttempts + 1;
  const accuracy = ((currentAccuracy * currentAttempts) + (isCorrect ? 100 : 0)) / attempts;
  
  let weakScore = currentWeakScore;
  let intervalDays = 1;

  if (isCorrect) {
    // Reset or decrease weak score on success
    weakScore = Math.max(0, weakScore - 1);
    
    /**
     * Interval calculation:
     * - First success: 1 day
     * - Second consecutive success: 3 days
     * - Subsequent successes: exponential growth based on accuracy
     */
    if (attempts === 1) {
      intervalDays = 1;
    } else if (attempts === 2) {
      intervalDays = 3;
    } else {
      // Dynamic growth: base interval * (accuracy factor)
      // High accuracy (100%) leads to longer intervals
      const accuracyFactor = Math.max(1.2, accuracy / 50); 
      intervalDays = Math.ceil(currentAttempts * accuracyFactor);
    }
  } else {
    // Increase weak score on failure
    weakScore += 1;
    
    // Failures reset the interval to 1 day (immediate review needed)
    intervalDays = 1;
  }

  // Cap interval at 365 days
  intervalDays = Math.min(intervalDays, 365);

  const nextReviewDate = now + (intervalDays * 24 * 60 * 60 * 1000);

  return {
    nextReviewDate,
    accuracy,
    attempts,
    weakScore
  };
}
