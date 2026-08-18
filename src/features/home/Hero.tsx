import { Sparkles } from 'lucide-react'
import { Badge, ChipLink } from '@/components/ui'
import { SUGGESTED_QUESTIONS } from '@/features/qa/suggestions'
import { chatPath } from '@/features/qa/url'
import { AskBox } from './AskBox'
import { HeroArtwork } from './HeroArtwork'

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-card border border-line bg-surface px-5 py-10 shadow-soft sm:px-10 sm:py-14">
      <HeroArtwork className="pointer-events-none absolute -right-6 bottom-0 hidden h-[19rem] w-[19rem] lg:block xl:h-[21rem] xl:w-[21rem]" />

      <div className="relative max-w-2xl">
        <Badge tone="brand" icon={<Sparkles />}>
          AI-powered legal intelligence
        </Badge>

        <h1 className="mt-5 text-4xl font-bold leading-[1.12] sm:text-[2.75rem]">
          Understand Ethiopian law.
          <br />
          <span className="text-gradient-brand">Get answers you can check.</span>
        </h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          Ask in English or Amharic. Every answer is drawn from indexed Ethiopian
          legal sources and cites the article it came from — or says plainly that it
          could not find one.
        </p>

        <div className="mt-7 max-w-xl">
          <AskBox />
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-ink">Try asking</p>
          {/* Links, not buttons: they navigate, so middle-click and "open in new
              tab" have to work. */}
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((suggestion) => (
              <li key={suggestion.question}>
                <ChipLink
                  to={chatPath({
                    question: suggestion.question,
                    language: suggestion.language,
                  })}
                >
                  {suggestion.question}
                </ChipLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
