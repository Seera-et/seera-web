import type { AdviseInput, BusinessActivity } from '@/lib/api'

/**
 * The answers as the form holds them.
 *
 * `null` means "not answered yet", which the wire format preserves by omitting
 * the field — the server distinguishes an unanswered question from a negative
 * answer, and collapsing the two here would invent an answer on the reader's
 * behalf.
 */
export type Answers = {
  founders: number | null
  activityCode: string | null
  capitalBirr: number | null
  wantsLimitedLiability: boolean | null
  raiseFromPublic: boolean | null
  foreignOwnership: boolean | null
}

export const EMPTY_ANSWERS: Answers = {
  founders: null,
  activityCode: null,
  capitalBirr: null,
  wantsLimitedLiability: null,
  raiseFromPublic: null,
  foreignOwnership: null,
}

/** A step in the workflow. */
export type StepId =
  | 'founders'
  | 'activity'
  | 'capital'
  | 'liability'
  | 'public'
  | 'foreign'

export type Step = {
  id: StepId
  title: string
  /** Why the question is being asked, in terms of what it changes. */
  purpose: string
  /** False where the reader may move on without answering. */
  required: boolean
}

/**
 * The questions, in order.
 *
 * Founder count first because it is the most discriminating answer — it alone
 * eliminates most forms — and it is the only required one. Everything after it
 * refines the ranking or adds a caveat, and a reader who stops early still gets
 * a real recommendation rather than an error.
 */
export const STEPS: readonly Step[] = [
  {
    id: 'founders',
    title: 'How many people will own the business?',
    purpose:
      'The single most decisive answer. Most legal forms are defined by how many members they admit.',
    required: true,
  },
  {
    id: 'activity',
    title: 'What will the business do?',
    purpose:
      'Decides whether a sector licence comes into it, and which provisions are relevant.',
    required: false,
  },
  {
    id: 'capital',
    title: 'How much capital can the owners contribute?',
    purpose:
      'Some forms carry a statutory minimum. Leave this blank if you have not decided — it will not rule anything out.',
    required: false,
  },
  {
    id: 'liability',
    title: 'Do you want to be shielded from the business’s debts?',
    purpose:
      'A preference, not a legal constraint: it changes which form is recommended first, never which are lawful.',
    required: false,
  },
  {
    id: 'public',
    title: 'Will you offer shares to the public?',
    purpose:
      'This one is a legal constraint. Some forms may not do it at all.',
    required: false,
  },
  {
    id: 'foreign',
    title: 'Will any owner be a foreign national or company?',
    purpose:
      'Asked so the answer can be explicit about what it cannot tell you — no investment legislation is indexed.',
    required: false,
  },
]

/** Whether a step has been answered. */
export function isAnswered(answers: Answers, step: StepId): boolean {
  switch (step) {
    case 'founders':
      return answers.founders !== null
    case 'activity':
      return answers.activityCode !== null
    case 'capital':
      return answers.capitalBirr !== null
    case 'liability':
      return answers.wantsLimitedLiability !== null
    case 'public':
      return answers.raiseFromPublic !== null
    case 'foreign':
      return answers.foreignOwnership !== null
  }
}

/** Whether there is enough to ask for a recommendation at all. */
export function canSubmit(answers: Answers): boolean {
  return answers.founders !== null && answers.founders >= 1
}

/** Converts the form state to the request body, dropping unanswered fields. */
export function toAdviseInput(answers: Answers): AdviseInput {
  const input: AdviseInput = { founders: answers.founders ?? 1 }
  if (answers.activityCode) input.activityCode = answers.activityCode
  if (answers.capitalBirr !== null) input.capitalBirr = answers.capitalBirr
  if (answers.wantsLimitedLiability !== null)
    input.wantsLimitedLiability = answers.wantsLimitedLiability
  if (answers.raiseFromPublic !== null) input.raiseFromPublic = answers.raiseFromPublic
  if (answers.foreignOwnership !== null) input.foreignOwnership = answers.foreignOwnership
  return input
}

/** Groups the activity list so regulated sectors are visibly separate. */
export function activityOptions(activities: BusinessActivity[]) {
  return [
    { value: '', label: 'Not sure yet' },
    ...activities.map((activity) => ({
      value: activity.code,
      // The marker is explained beside the field: a regulated sector is where
      // the corpus is most likely to be missing the licensing law.
      label: activity.regulated ? `${activity.name} (regulated)` : activity.name,
    })),
  ]
}
