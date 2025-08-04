import { Button } from "@/components/ui/button"
import { LuPlay, LuPause } from "react-icons/lu"

interface LiveToggleProps {
  isLive: boolean
  onToggle: (isLive: boolean) => void
  disabled?: boolean
}

export const LiveToggle: React.FC<LiveToggleProps> = ({ isLive, onToggle, disabled = false }) => {
  const handleClick = () => {
    onToggle(!isLive)
  }
  return (
    <Button
      variant={isLive ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isLive}
      className="flex items-center gap-2">
      {isLive ? (
        <>
          <LuPause className="h-4 w-4" />
          <span>Pause</span>
        </>
      ) : (
        <>
          <LuPlay className="h-4 w-4" />
          <span>Live</span>
        </>
      )}
    </Button>
  )
}