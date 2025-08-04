import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBytes, formatPercent } from "@/utils/formatUtils"
import { LuCpu, LuMemoryStick, LuActivity } from "react-icons/lu"

interface CPUOverviewProps {
  cpuUsage: number
  memoryPercent?: number
  totalCores?: number
  isLoading?: boolean
  memoryProcess?: number
}

export const CPUOverview: React.FC<CPUOverviewProps> = ({
  cpuUsage = 0,
  memoryProcess = 0,
  totalCores = 0,
  isLoading = false
}) => {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Card className="bg-stat">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm stat">
            <LuCpu className="h-4 w-4" />
            CPU Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold stat">{isLoading ? "..." : formatPercent(cpuUsage)}</span>
            <span className="ml-2 text-xs text-muted-foreground">Process</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-stat">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm stat">
            <LuMemoryStick className="h-4 w-4" />
            Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold stat">{isLoading ? "..." : formatBytes(memoryProcess).toString()}</span>
            <span className="ml-2 text-xs text-muted-foreground">Used</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-stat">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm stat">
            <LuActivity className="h-4 w-4" />
            System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold stat">{isLoading ? "..." : totalCores}</span>
            <span className="ml-2 text-xs text-muted-foreground">Cores</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}