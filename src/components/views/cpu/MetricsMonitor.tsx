import React, { useState, useDeferredValue } from "react"

import { CPUChart } from "./components/CPUChart"
import { CPUOverview } from "./components/CPUOverview"
import { LiveToggle } from "./components/LiveToggle"
import { useCPUStats } from "./hooks/useCPUStats"
import WidgetWrapper from '@/components/common/WidgetWrapper';

interface MetricsMonitorProps {
  id: string
  title: string
}

const MetricsMonitor: React.FC<MetricsMonitorProps> = ({ id, title }) => {
  const [isLive, setIsLive] = useState(true)

  const { stats, isSubscribed } = useCPUStats( isLive, 150)

  const deferredStats = useDeferredValue(stats)
  const deferredSubscribed = useDeferredValue(isSubscribed)

  const currentStats = deferredStats[deferredStats.length - 1] || null

  const currentCPUPercent = currentStats?.process_cpu_usage || 0

  const currentMemoryProcess = currentStats?.process_memory || 0
  const totalCores = currentStats?.nb_cores || 0
  const isLoading = !deferredSubscribed
  
  // Debug logging for MetricsMonitor
  console.log('[MetricsMonitor] Current state:', {
    statsLength: deferredStats.length,
    isSubscribed: deferredSubscribed,
    isLoading,
    currentStats: currentStats ? {
      timestamp: currentStats.timestamp,
      processUsage: currentStats.process_cpu_usage,
      processMemory: currentStats.process_memory,
      nbCores: currentStats.nb_cores
    } : null,
    propsToOverview: {
      cpuUsage: currentCPUPercent,
      memoryProcess: currentMemoryProcess,
      totalCores,
      isLoading
    }
  });

  return (
      <WidgetWrapper id={id} title={title}>
    <div className="container mx-auto space-y-4 p-4">
      <div className="flex items-center justify-items-start">
        <LiveToggle isLive={isLive} onToggle={setIsLive} />
      </div>
      
      <div className="w-full">
        <CPUOverview
          cpuUsage={currentCPUPercent}
          memoryProcess={currentMemoryProcess}
          totalCores={totalCores}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CPUChart currentCPUPercent={currentCPUPercent} isLive={isLive} />
   
      </div>
    </div>
    </WidgetWrapper>
  )
}

export default MetricsMonitor
