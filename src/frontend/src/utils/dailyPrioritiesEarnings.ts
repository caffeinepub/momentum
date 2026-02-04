import type { Task } from '@/backend';

/**
 * Calculates Daily Priorities income using quadrant-based planned-weight threshold scaling.
 * 
 * Logic:
 * 1. For each quadrant (listId 1-4), calculate total planned weight (all tasks, complete or not)
 * 2. Determine scaling divisor based on quadrant's planned weight:
 *    - < 15: divide by 3
 *    - < 30: divide by 2
 *    - >= 30: divide by 1 (full income)
 * 3. Apply divisor to completed weight in that quadrant
 * 4. Sum all scaled completed weights across quadrants
 * 5. Calculate unit from total planned weight across all quadrants
 * 6. Multiply scaled completed weight by unit to get income
 */
export function calculateDailyPrioritiesIncome(
  tasks: Task[],
  maxDailyPriorities: number
): number {
  const quadrantTasks = tasks.filter(t => t.listId >= BigInt(1) && t.listId <= BigInt(4));

  if (quadrantTasks.length === 0) {
    return 0;
  }

  // Calculate total planned weight across all quadrants for unit calculation
  const totalPlannedWeight = quadrantTasks.reduce((sum, task) => sum + task.weight, 0);

  if (totalPlannedWeight === 0) {
    return 0;
  }

  // Calculate unit based on total planned weight
  const unit = maxDailyPriorities / totalPlannedWeight;

  // Process each quadrant separately
  let totalScaledCompletedWeight = 0;

  for (let quadrantId = 1; quadrantId <= 4; quadrantId++) {
    const quadrantTasksForId = quadrantTasks.filter(t => t.listId === BigInt(quadrantId));

    // Calculate planned weight for this quadrant
    const quadrantPlannedWeight = quadrantTasksForId.reduce((sum, task) => sum + task.weight, 0);

    // Calculate completed weight for this quadrant
    const quadrantCompletedWeight = quadrantTasksForId
      .filter(t => t.completed)
      .reduce((sum, task) => sum + task.weight, 0);

    // Determine scaling divisor based on planned weight thresholds
    let divisor = 1;
    if (quadrantPlannedWeight < 15) {
      divisor = 3;
    } else if (quadrantPlannedWeight < 30) {
      divisor = 2;
    }

    // Apply divisor to completed weight
    const scaledCompletedWeight = quadrantCompletedWeight / divisor;
    totalScaledCompletedWeight += scaledCompletedWeight;
  }

  // Calculate final income
  const income = unit * totalScaledCompletedWeight;

  return income;
}
