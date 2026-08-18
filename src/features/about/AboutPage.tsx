import type { ReactNode } from 'react'
import {
  BadgeCheck,
  BookOpenCheck,
  Database,
  Languages,
  ListOrdered,
  Mail,
  MessageSquare,
  Scale,
  ScrollText,
  SearchX,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { DISCLAIMER, brand } from '@/app/brand'
import {
  ActionCard,
  Badge,
  Callout,
  Card,
  CardDescription,
  CardTitle,
  IconTile,
  PageHeader,
} from '@/components/ui'

/** How answers are produced — the real pipeline, in order. */
const pipeline = [
  {
    icon: <Database />,
    title: 'Retrieve',
    body: 'Hybrid search over the indexed corpus: vector similarity, keyword match and direct article lookup. Only published provisions that were in force on the date asked about are considered — that filter is a database predicate, not an instruction to the model.',
  },
  {
    icon: <ListOrdered />,
    title: 'Rerank',
    body: 'The wide candidate set is reordered by relevance and cut to a handful. If nothing scores well enough, the request stops here and Seera abstains.',
  },
  {
    icon: <ScrollText />,
    title: 'Generate with citations required',
    body: 'The surviving provisions become the model’s entire context, and every claim must carry a marker pointing at one of them. The model is never asked to answer from memory.',
  },
  {
    icon: <BadgeCheck />,
    title: 'Check the grounding',
    body: 'Each marker is validated against the provisions actually supplied while the answer streams. What you see labelled “Grounded” has passed that check.',
  },
]

/** How a follow-up is handled, which is not obvious and affects what to expect. */
const followUpNote =
  'In a thread, a follow-up like “what about for a PLC?” is first rewritten into a standalone question, because a pronoun retrieves nothing on its own. Earlier turns tell Seera what you are asking — they are never treated as evidence, so every legal claim still has to cite a provision retrieved for that question.'

const guarantees = [
  {
    icon: <SearchX />,
    title: 'It says when it does not know',
    body: 'If retrieval finds nothing solid, the answer is that nothing was found — with what was searched and how to narrow it. An honest miss is a correct answer; a plausible invention is the failure this system is built to prevent.',
  },
  {
    icon: <ScrollText />,
    title: 'Citations point at records, not links',
    body: 'Every source card resolves to a stored chunk, article and version in the database. Nothing is a model-written reference or a page number that was never parsed.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Versions are never overwritten',
    body: 'Amendments and repeals add versions rather than replacing them, so an answer can state which version it relied on and from when it applied. Ask “as of” a date to see what the law was then.',
  },
  {
    icon: <Languages />,
    title: 'Amharic is a first-class source language',
    body: 'Questions and provisions in Amharic are indexed and cited the same way as English ones, and an English question can be answered from an Amharic provision.',
  },
]

/** The four things every source card shows, and what each one means. */
const CITATION_ANATOMY: ReadonlyArray<[string, string]> = [
  ['Document', 'Which code, proclamation, regulation or directive it comes from.'],
  ['Article', 'The article or section number, and its heading where one exists.'],
  [
    'Version and effective date',
    'Which version of that provision was used, and the date from which it applied. A repealed version is labelled as repealed.',
  ],
  [
    'Verbatim text',
    'The stored source text, unedited. “Approximate boundary” means the article edges were recovered by fallback during parsing, so read the surrounding text with a little care.',
  ],
]

export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={
          <Badge tone="brand" icon={<Sparkles />}>
            About {brand.name}
          </Badge>
        }
        title="Answers you can check"
        description={`${brand.name} answers questions about Ethiopian law from indexed legal sources, and shows the article behind every claim so you can verify it yourself.`}
      />

      <Section
        id="how-it-works"
        title="How an answer is built"
        description="Four stages. Retrieval decides what the model is allowed to see."
      >
        <ol className="grid gap-3 sm:grid-cols-2">
          {pipeline.map((step, index) => (
            <Card as="li" key={step.title} className="p-5">
              <div className="flex items-center gap-3">
                <IconTile>{step.icon}</IconTile>
                <div>
                  <p className="text-xs font-semibold text-ink-muted">
                    Step {index + 1}
                  </p>
                  <CardTitle>{step.title}</CardTitle>
                </div>
              </div>
              <CardDescription className="mt-2.5">{step.body}</CardDescription>
            </Card>
          ))}
        </ol>
        <Callout tone="info" title="Follow-up questions">
          {followUpNote}
        </Callout>
      </Section>

      <Section
        id="reading-a-citation"
        title="How to read a source card"
        description="Every citation carries the same four things."
      >
        <Card className="p-0">
          <dl className="divide-y divide-line">
            {CITATION_ANATOMY.map(([term, definition]) => (
              <div key={term} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
                <dt className="w-48 shrink-0 text-sm font-semibold text-ink">{term}</dt>
                <dd className="text-sm leading-relaxed text-ink-soft">{definition}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </Section>

      <Section id="limits" title="What Seera does and does not promise">
        <div className="grid gap-3 sm:grid-cols-2">
          {guarantees.map((item) => (
            <Card key={item.title} className="p-5">
              <IconTile>{item.icon}</IconTile>
              <CardTitle className="mt-3">{item.title}</CardTitle>
              <CardDescription className="mt-1.5">{item.body}</CardDescription>
            </Card>
          ))}
        </div>

        <Callout tone="warning" className="mt-3" title="Coverage is partial">
          The corpus does not yet contain all Ethiopian law. An answer being absent
          here does not mean the law is silent — it means Seera has not indexed a
          source that answers it. The Legal Explorer shows what is indexed.
        </Callout>

        <Callout tone="info" className="mt-3" icon={<Scale />} title="Not legal advice">
          {DISCLAIMER}
        </Callout>
      </Section>

      <Section id="privacy" title="Privacy">
        <Card className="space-y-3 p-5 text-sm leading-relaxed text-ink-soft">
          <p>
            Questions are sent to the {brand.name} API to be answered, and the request
            is logged with a request ID, timing and which sources were retrieved.
            Answer text and full prompts are not logged.
          </p>
          <p>
            Conversations and bookmarks are stored in your browser, not on a server.
            A follow-up sends the earlier turns of that thread so the question can be
            understood, and the server discards them with the response. There are no
            accounts yet, so nothing you ask is tied to an identity, and clearing site
            data removes everything.
          </p>
        </Card>
      </Section>

      <Section id="terms" title="Terms">
        <Card className="space-y-3 p-5 text-sm leading-relaxed text-ink-soft">
          <p>
            {brand.name} is an information tool. It does not create a lawyer–client
            relationship, and its output must not be relied on as legal advice for any
            decision with consequences. Verify anything that matters against the
            official published source and take advice from a licensed advocate.
          </p>
          <p>
            The service is provided as is, without warranty of accuracy, completeness
            or fitness for a particular purpose.
          </p>
        </Card>
      </Section>

      <Section id="contact" title="Contact">
        <Card className="flex flex-wrap items-center gap-3 p-5">
          <IconTile>
            <Mail />
          </IconTile>
          <p className="text-sm leading-relaxed text-ink-soft">
            Found an answer that cited the wrong provision, or a document that parsed
            badly? Those are the reports worth sending — a mis-citation is a bug, not a
            matter of opinion.
          </p>
        </Card>
      </Section>

      <Section id="next" title="Where to go next">
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            icon={<MessageSquare />}
            title="Ask a question"
            description="Put a real question in and read the sources it cites."
            cta="Open legal chat"
            to="/chat"
          />
          <ActionCard
            icon={<BookOpenCheck />}
            title="See what is indexed"
            description="Browse the documents the corpus covers so far."
            cta="Open explorer"
            to="/explorer"
          />
        </div>
      </Section>
    </div>
  )
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    // scroll-mt keeps the heading clear of the sticky header when linked to.
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 space-y-3">
      <div className="space-y-1">
        <h2 id={`${id}-heading`} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        {description ? <p className="text-sm text-ink-soft">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
