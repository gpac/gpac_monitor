import { memo } from "react"
import { LuCpu } from "react-icons/lu"
import { Chart, ChartDataPoint, ChartConfig } from "@/components/common/Chart"

export interface CPUDataPoint extends ChartDataPoint {
  cpu_percent: number
  memory_percent: number
}

interface CPUChartProps {
  currentCPUPercent: number
  isLive: boolean
}

const cpuChartConfig: ChartConfig = {
  title: "CPU Usage Over Time",
  icon: <LuCpu className="h-4 w-4" />,
  height: 200,
  maxPoints: 400,
  throttleInterval: 50,
  yAxisDomain: [0, 100],
  yAxisFormatter: (value: number) => `${value}%`,
  areas: [
    {
      dataKey: "cpu_percent",
      name: "GPAC Process",
      stroke: "#ef4444",
      fill: "url(#processGradient)",
      strokeWidth: 2
    }
  ],
  tooltip: {
    formatter: (value: number) => [`${value.toFixed(2)}%`, "CPU Usage"],
    labelFormatter: (label: string) => `Time: ${label}`
  },
  gradients: [
    {
      id: "processGradient",
      color: "#ef4444",
      opacity: { start: 0.6, end: 0.1 }
    }
  ]
}

export const CPUChart = memo(({ currentCPUPercent, isLive }: CPUChartProps) => {
  const createDataPoint = (timestamp: number, time: string, currentValue: number): CPUDataPoint => ({
    timestamp,
    time,
    cpu_percent: currentValue,
    memory_percent: 0
  })

  return (
    <Chart
      config={cpuChartConfig}
      currentValue={currentCPUPercent}
      isLive={isLive}
      createDataPoint={createDataPoint}
    />
  )
})