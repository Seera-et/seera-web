import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui'
import { useTheme } from '../providers/theme-context'

export function ThemeToggle() {
  const { resolved, toggle } = useTheme()
  const next = resolved === 'dark' ? 'light' : 'dark'

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {resolved === 'dark' ? <Moon /> : <Sun />}
    </Button>
  )
}
