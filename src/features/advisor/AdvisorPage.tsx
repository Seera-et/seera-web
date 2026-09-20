import { useState } from 'react'
import { ArrowLeft, ArrowRight, Briefcase, RotateCcw, Sparkles } from 'lucide-react'
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  ErrorState,
  Input,
  PageHeader,
  SegmentedControl,
  Select,
  Skeleton,
} from '@/components/ui'
import { useAdvice, useBusinessIntake } from '@/lib/api/queries'
import { ApiError } from '@/lib/api'
import { Recommendation } from './Recommendation'
import {
  activityOptions,
  canSubmit,
  EMPTY_ANSWERS,
  isAnswered,
  STEPS,
  toAdviseInput,
  type Answers,
  type StepId,
} from './intake'

/** Yes/no/not-answered, as a three-way control rather than a checkbox. */
const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unset', label: 'Not sure' },
] as const

type YesNo = (typeof YES_NO)[number]['value']

function toYesNo(value: boolean | null): YesNo {
  if (value === null) return 'unset'
  return value ? 'yes' : 'no'
}

function fromYesNo(value: YesNo): boolean | null {
  if (value === 'unset') return null
  return value === 'yes'
}

/**
 * The Business & License Advisor.
 *
 * A step workflow rather than one long form, because the questions are not
 * equally consequential: the founder count decides most of the answer, and
 * asking it alone is enough to produce a real recommendation. Everything after
 * it refines the ranking or adds a caveat, and a reader may stop at any point.
 *
 * Answers live in component state rather than the URL. Unlike a search, this is
 * a description of someone's business plan — it is not something to put in a
 * shareable link by default.
 */
export function AdvisorPage() {
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS)
  const [stepIndex, setStepIndex] = useState(0)

  const intake = useBusinessIntake()
  const advice = useAdvice()

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((previous) => ({ ...previous, [key]: value }))
  }

  function restart() {
    setAnswers(EMPTY_ANSWERS)
    setStepIndex(0)
    advice.reset()
  }

  // A missing rule set is the one failure worth its own message: the feature is
  // built and working, and this deployment simply has no rules loaded.
  const noRuleSet =
    intake.error instanceof ApiError && intake.error.code === 'no_rule_set'

  if (noRuleSet) {
    return (
      <Shell>
        <Callout tone="warning" title="The advisor has no rule set loaded">
          This deployment has no published business rule set, so there is nothing
          to apply to your answers. An administrator loads one through the admin
          API; until then the advisor cannot recommend a structure.
        </Callout>
      </Shell>
    )
  }

  if (intake.isError) {
    return (
      <Shell>
        <Card>
          <ErrorState error={intake.error} onRetry={() => void intake.refetch()} />
        </Card>
      </Shell>
    )
  }

  if (intake.isPending || !intake.data) {
    return (
      <Shell>
        <Skeleton className="h-64 w-full rounded-card" />
      </Shell>
    )
  }

  const form = intake.data

  if (advice.data) {
    return (
      <Shell>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            Based on {answers.founders}{' '}
            {answers.founders === 1 ? 'owner' : 'owners'}
            {answers.activityCode
              ? `, ${form.activities.find((a) => a.code === answers.activityCode)?.name.toLowerCase() ?? ''}`
              : ''}
            .
          </p>
          <Button variant="secondary" size="sm" leadingIcon={<RotateCcw />} onClick={restart}>
            Start again
          </Button>
        </div>
        <Recommendation result={advice.data} />
      </Shell>
    )
  }

  return (
    <Shell>
      <Card className="p-5">
        {/* Progress, stated as a count rather than a bar: six questions is
            few enough that the number is more informative than a fill level. */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Question {stepIndex + 1} of {STEPS.length}
          </p>
          {step.required ? (
            <Badge tone="brand">Required</Badge>
          ) : (
            <Badge tone="neutral">Optional</Badge>
          )}
        </div>

        <ol className="mt-3 flex gap-1.5" aria-label="Progress">
          {STEPS.map((candidate, index) => (
            <li
              key={candidate.id}
              aria-current={index === stepIndex ? 'step' : undefined}
              className={
                index === stepIndex
                  ? 'h-1.5 flex-1 rounded-full bg-brand-500'
                  : isAnswered(answers, candidate.id)
                    ? 'h-1.5 flex-1 rounded-full bg-brand-300 dark:bg-brand-800'
                    : 'h-1.5 flex-1 rounded-full bg-surface-sunken'
              }
            />
          ))}
        </ol>

        <CardTitle as="h2" className="mt-4 text-base">
          {step.title}
        </CardTitle>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.purpose}</p>

        <div className="mt-4">
          <StepField
            step={step.id}
            answers={answers}
            activities={activityOptions(form.activities)}
            onChange={set}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<ArrowLeft />}
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((index) => index - 1)}
          >
            Back
          </Button>

          <div className="flex items-center gap-2">
            {!isLast ? (
              <Button
                variant="secondary"
                size="sm"
                trailingIcon={<ArrowRight />}
                disabled={step.required && !isAnswered(answers, step.id)}
                onClick={() => setStepIndex((index) => index + 1)}
              >
                {isAnswered(answers, step.id) ? 'Next' : 'Skip'}
              </Button>
            ) : null}

            {/* Available from the moment the founder count is in, not only on
                the last step: the remaining questions are refinements, and
                making the reader click through all six to see anything would
                be a worse product than letting them ask early. */}
            <Button
              size="sm"
              leadingIcon={<Sparkles />}
              loading={advice.isPending}
              disabled={!canSubmit(answers)}
              onClick={() => advice.mutate(toAdviseInput(answers))}
            >
              Get recommendation
            </Button>
          </div>
        </div>
      </Card>

      {advice.isError ? (
        <Card>
          <ErrorState
            error={advice.error}
            onRetry={() => advice.mutate(toAdviseInput(answers))}
          />
        </Card>
      ) : null}

      {form.unsupported.length > 0 ? (
        <Card className="p-4">
          <CardTitle as="h2" className="text-sm">
            What this advisor cannot tell you
          </CardTitle>
          <p className="mt-1 text-xs text-ink-muted">
            Stated up front rather than after you have answered, because these
            are the gaps most likely to matter.
          </p>
          <ul className="mt-2 space-y-1.5">
            {form.unsupported.map((line) => (
              <li key={line} className="text-xs leading-relaxed text-ink-soft">
                {line}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </Shell>
  )
}

function StepField({
  step,
  answers,
  activities,
  onChange,
}: {
  step: StepId
  answers: Answers
  activities: { value: string; label: string }[]
  onChange: <K extends keyof Answers>(key: K, value: Answers[K]) => void
}) {
  switch (step) {
    case 'founders':
      return (
        <Input
          label="Number of owners"
          type="number"
          min={1}
          inputMode="numeric"
          value={answers.founders === null ? '' : String(answers.founders)}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10)
            onChange('founders', Number.isFinite(parsed) && parsed >= 1 ? parsed : null)
          }}
        />
      )

    case 'activity':
      return (
        <Select
          label="Main activity"
          options={activities}
          value={answers.activityCode ?? ''}
          onChange={(event) => onChange('activityCode', event.target.value || null)}
        />
      )

    case 'capital':
      return (
        <Input
          label="Capital available (ETB)"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Leave blank if undecided"
          value={answers.capitalBirr === null ? '' : String(answers.capitalBirr)}
          onChange={(event) => {
            const parsed = Number.parseFloat(event.target.value)
            onChange('capitalBirr', Number.isFinite(parsed) && parsed >= 0 ? parsed : null)
          }}
        />
      )

    case 'liability':
      return (
        <SegmentedControl
          label="Shielded from business debts"
          value={toYesNo(answers.wantsLimitedLiability)}
          segments={YES_NO}
          onChange={(value) => onChange('wantsLimitedLiability', fromYesNo(value))}
        />
      )

    case 'public':
      return (
        <SegmentedControl
          label="Offer shares to the public"
          value={toYesNo(answers.raiseFromPublic)}
          segments={YES_NO}
          onChange={(value) => onChange('raiseFromPublic', fromYesNo(value))}
        />
      )

    case 'foreign':
      return (
        <SegmentedControl
          label="Foreign owner involved"
          value={toYesNo(answers.foreignOwnership)}
          segments={YES_NO}
          onChange={(value) => onChange('foreignOwnership', fromYesNo(value))}
        />
      )
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        eyebrow={
          <Badge tone="neutral" icon={<Briefcase />}>
            Business &amp; licence advisor
          </Badge>
        }
        title="Which legal form fits your business?"
        description="Answers are matched against the Commercial Code's own requirements. Every figure and every step below cites the article it comes from — nothing here is generated."
      />
      {children}
    </div>
  )
}
