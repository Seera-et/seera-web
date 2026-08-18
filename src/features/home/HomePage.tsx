import { Scale } from 'lucide-react'
import { Callout } from '@/components/ui'
import { DISCLAIMER } from '@/app/brand'
import { CorpusStats } from './CorpusStats'
import { ExploreGrid } from './ExploreGrid'
import { Hero } from './Hero'

export function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Hero />
      <CorpusStats />
      <ExploreGrid />
      <Callout tone="info" icon={<Scale />} title="Information, not legal advice">
        {DISCLAIMER}
      </Callout>
    </div>
  )
}
