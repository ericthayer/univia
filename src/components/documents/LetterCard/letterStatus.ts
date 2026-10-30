/** Chip color and deadline helpers for demand letters (shared by LetterCard). */
type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export function getRiskColor(risk?: string): ChipColor {
  switch (risk) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
}

export function getStatusColor(status?: string): ChipColor {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'reviewed':
      return 'info';
    case 'responded':
      return 'primary';
    case 'resolved':
      return 'success';
    default:
      return 'default';
  }
}

export function getDaysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
