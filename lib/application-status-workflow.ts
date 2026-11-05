export const applicationStatuses = [
  'new',
  'under_review',
  'qualified',
  'need_information',
  'contacted',
  'accepted',
  'rejected',
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

const allowedTransitions: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  new: ['under_review'],
  under_review: ['qualified', 'need_information', 'rejected'],
  need_information: ['under_review', 'rejected'],
  qualified: ['contacted', 'need_information', 'rejected'],
  contacted: ['accepted', 'rejected', 'need_information'],
  accepted: [],
  rejected: [],
};

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return (applicationStatuses as readonly string[]).includes(value);
}

export function getAllowedStatusTransitions(status: string): readonly ApplicationStatus[] {
  return isApplicationStatus(status) ? allowedTransitions[status] : [];
}

export function canTransitionApplicationStatus(from: string, to: string): boolean {
  if (from === to) return true;
  if (!isApplicationStatus(from) || !isApplicationStatus(to)) return false;
  return allowedTransitions[from].includes(to);
}

export function isTerminalApplicationStatus(status: string): boolean {
  return status === 'accepted' || status === 'rejected';
}
