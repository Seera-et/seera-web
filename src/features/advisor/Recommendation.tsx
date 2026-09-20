import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleSlash,
  FileWarning,
  Info,
  ListChecks,
  ShieldQuestion,
  XCircle,
} from 'lucide-react'
import {
  Badge,
  Callout,
  Card,
  CardTitle,
  EmptyState,
  IconTile,
} from '@/components/ui'
import type {
  BusinessCandidate,
  BusinessRecommendation,
  BusinessRequirement,
  BusinessStructure,
} from '@/lib/api'
import { formatNumber } from '@/lib/utils/format'
import { SourceList } from './SourceList'

/**
 * The advisor's answer.
 *
 * Nothing rendered here is generated text. Each line is either a rule's own
 * reason or the verbatim words of a provision, which is why every claim can
 * carry the article it came from.
 */
export function Recommendation({ result }: { result: BusinessRecommendation }) {
  return (
    <div className="space-y-4">
      {result.recommended ? (
        <RecommendedCard candidate={result.recommended} />
      ) : (
        <Card>
          <EmptyState
            icon={<CircleSlash />}
            title="No legal form fits those answers"
            description="Every form in the rule set is ruled out by something you told us. The reasons are listed below — changing one answer will usually open several of them up again."
          />
        </Card>
      )}

      {result.unsupported.length > 0 ? (
        <div className="space-y-2">
          {result.unsupported.map((line) => (
            <Callout key={line} tone="warning" title="This corpus cannot answer that">
              {line}
            </Callout>
          ))}
        </div>
      ) : null}

      {result.steps.length > 0 ? (
        <RequirementSection
          title="Registration steps"
          icon={<ListChecks />}
          requirements={result.steps}
          emptyNote=""
        />
      ) : null}

      <RequirementSection
        title="Licences"
        icon={<FileWarning />}
        requirements={result.licences}
        emptyNote="No licence requirement is stated in the indexed legislation. That means none could be cited — not that none applies."
      />

      {result.alternatives.length > 0 ? (
        <Card className="p-4">
          <CardTitle as="h2" className="text-sm">
            Other lawful forms
          </CardTitle>
          <p className="mt-0.5 text-xs text-ink-muted">
            Permitted by your answers, ranked below the recommendation.
          </p>
          <ul className="mt-3 space-y-2">
            {result.alternatives.map((candidate) => (
              <li key={candidate.structure.code}>
                <CandidateRow candidate={candidate} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {result.excluded.length > 0 ? (
        <Card className="p-4">
          <CardTitle as="h2" className="text-sm">
            Ruled out, and why
          </CardTitle>
          <p className="mt-0.5 text-xs text-ink-muted">
            {/* "Why not a private limited company?" is the next question a
                founder asks, and answering it is free. */}
            Each of these is unavailable because of a specific provision.
          </p>
          <ul className="mt-3 space-y-2">
            {result.excluded.map((candidate) => (
              <li key={candidate.structure.code}>
                <CandidateRow candidate={candidate} excluded />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {result.caveats.length > 0 ? (
        <div className="space-y-2">
          {result.caveats.map((caveat) => (
            <Callout
              key={caveat.title}
              tone="info"
              title={caveat.title}
              icon={<Info />}
            >
              {caveat.detail ? <p>{caveat.detail}</p> : null}
              <SourceList sources={caveat.sources} />
            </Callout>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-ink-muted">
        Applied from rule set <code className="font-mono">{result.ruleSetLabel}</code>.
        Every figure above is read from the provision cited beside it.
      </p>
    </div>
  )
}

function RecommendedCard({ candidate }: { candidate: BusinessCandidate }) {
  const { structure } = candidate

  return (
    <Card className="border-brand-200 p-5 dark:border-brand-900">
      <div className="flex items-start gap-3">
        <IconTile tone="brand">
          <Building2 />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
            Recommended structure
          </p>
          <CardTitle as="h2" className="mt-0.5 text-lg">
            {structure.name}
          </CardTitle>
          {structure.summary ? (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {structure.summary}
            </p>
          ) : null}
        </div>
      </div>

      <StructureFacts structure={structure} />

      <div className="mt-4 space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Why
        </p>
        {candidate.reasons.map((reason, index) => (
          <div key={`${reason.code}-${index}`}>
            <p className="flex items-start gap-2 text-sm text-ink">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-success-500"
              />
              <span>{reason.message}</span>
            </p>
            <div className="pl-6">
              <SourceList sources={reason.sources} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * The form's statutory facts.
 *
 * A bound the corpus does not establish is shown as "not stated" rather than
 * omitted or rendered as "no limit" — those are three different things, and
 * only one of them is true.
 */
function StructureFacts({ structure }: { structure: BusinessStructure }) {
  const members =
    structure.minMembers !== null && structure.maxMembers !== null
      ? structure.minMembers === structure.maxMembers
        ? `${structure.minMembers}`
        : `${structure.minMembers}–${structure.maxMembers}`
      : structure.minMembers !== null
        ? `at least ${structure.minMembers}`
        : structure.maxMembers !== null
          ? `at most ${structure.maxMembers}`
          : null

  return (
    <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      <Fact label="Members">
        {members ?? <NotStated />}
      </Fact>
      <Fact label="Minimum capital">
        {structure.minCapital !== null ? (
          `${formatNumber(structure.minCapital)} ${structure.currency ?? ''}`.trim()
        ) : (
          <NotStated />
        )}
      </Fact>
      {structure.liability ? (
        <Fact label="Liability">{structure.liability}</Fact>
      ) : null}
      {structure.nameSuffix ? (
        <Fact label="Name must end with">“{structure.nameSuffix}”</Fact>
      ) : null}
    </dl>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}

/** Deliberately explicit: the corpus is silent, which is not the same as "none". */
function NotStated() {
  return (
    <span className="inline-flex items-center gap-1 text-ink-muted">
      <ShieldQuestion aria-hidden="true" className="size-3.5" />
      Not stated in the indexed corpus
    </span>
  )
}

function CandidateRow({
  candidate,
  excluded = false,
}: {
  candidate: BusinessCandidate
  excluded?: boolean
}) {
  // On an excluded form the disqualifying reason is the only one that matters;
  // listing the findings it also satisfied would bury it.
  const reasons = excluded
    ? candidate.reasons.filter((reason) => reason.disqualifying)
    : candidate.reasons

  return (
    <div className="rounded-card border border-line bg-surface-sunken/50 p-3">
      <div className="flex items-center gap-2">
        {excluded ? (
          <XCircle aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
        ) : (
          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-success-500" />
        )}
        <p className="text-sm font-medium text-ink">{candidate.structure.name}</p>
      </div>
      {reasons.map((reason, index) => (
        <div key={`${reason.code}-${index}`} className="mt-1.5 pl-6">
          <p className="text-xs leading-relaxed text-ink-soft">{reason.message}</p>
          <SourceList sources={reason.sources} />
        </div>
      ))}
    </div>
  )
}

function RequirementSection({
  title,
  icon,
  requirements,
  emptyNote,
}: {
  title: string
  icon: React.ReactNode
  requirements: BusinessRequirement[]
  emptyNote: string
}) {
  if (requirements.length === 0) {
    if (!emptyNote) return null
    return (
      <Card className="p-4">
        <CardTitle as="h2" className="flex items-center gap-2 text-sm">
          {icon}
          {title}
        </CardTitle>
        <p className="mt-1.5 flex items-start gap-2 text-sm text-ink-soft">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-warning-500"
          />
          <span>{emptyNote}</span>
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <CardTitle as="h2" className="flex items-center gap-2 text-sm">
        {icon}
        {title}
      </CardTitle>
      <ol className="mt-3 space-y-3">
        {requirements.map((requirement, index) => (
          <li key={requirement.title} className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-accent text-xs font-semibold text-brand-700 dark:text-brand-300">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{requirement.title}</p>
              {requirement.detail ? (
                <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">
                  {requirement.detail}
                </p>
              ) : null}
              {requirement.authority ? (
                <Badge tone="neutral" className="mt-1.5">
                  {requirement.authority}
                </Badge>
              ) : null}
              <SourceList sources={requirement.sources} />
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
