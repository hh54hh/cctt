import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Bug,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  enableVerboseLogging,
  enableQuietMode,
  restoreConsole,
} from "../utils/consoleFilter";
import { performanceOptimizer } from "../utils/performanceOptimizer";

interface PerformanceStats {
  fps: number;
  memoryUsage: number;
  errorCount: number;
  warningCount: number;
}

export default function DebuggingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [consoleMode, setConsoleMode] = useState<
    "normal" | "verbose" | "quiet"
  >("normal");
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    fps: 60,
    memoryUsage: 0,
    errorCount: 0,
    warningCount: 0,
  });

  // Monitor performance stats
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const updateStats = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        setPerformanceStats((prev) => ({
          ...prev,
          fps,
          memoryUsage: (performance as any).memory
            ? Math.round(
                (performance as any).memory.usedJSHeapSize / 1024 / 1024,
              )
            : 0,
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(updateStats);
    };

    if (isOpen) {
      animationId = requestAnimationFrame(updateStats);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isOpen]);

  const handleConsoleMode = (mode: "normal" | "verbose" | "quiet") => {
    setConsoleMode(mode);

    switch (mode) {
      case "verbose":
        enableVerboseLogging();
        break;
      case "quiet":
        enableQuietMode();
        break;
      case "normal":
        restoreConsole();
        break;
    }
  };

  const handleEmergencyReset = () => {
    performanceOptimizer.emergencyReset();
    setPerformanceStats((prev) => ({
      ...prev,
      errorCount: 0,
      warningCount: 0,
    }));
  };

  const applyOptimizations = () => {
    performanceOptimizer.applyOptimizations();
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2 fixed bottom-4 right-4 z-50"
      >
        <Bug className="h-4 w-4" />
        Debug Panel
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debug & Performance Panel
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Control console output and monitor performance
              </p>
            </div>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Performance Stats */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceStats.fps}
                </div>
                <div className="text-sm text-blue-600">FPS</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performanceStats.memoryUsage}
                </div>
                <div className="text-sm text-green-600">MB Memory</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {performanceStats.errorCount}
                </div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {performanceStats.warningCount}
                </div>
                <div className="text-sm text-yellow-600">Warnings</div>
              </div>
            </div>
          </div>

          {/* Console Control */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Console Output Control
            </h3>
            <div className="flex gap-2 mb-3">
              <Button
                onClick={() => handleConsoleMode("normal")}
                variant={consoleMode === "normal" ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Volume2 className="h-4 w-4" />
                Normal
              </Button>
              <Button
                onClick={() => handleConsoleMode("verbose")}
                variant={consoleMode === "verbose" ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Volume2 className="h-4 w-4" />
                Verbose
              </Button>
              <Button
                onClick={() => handleConsoleMode("quiet")}
                variant={consoleMode === "quiet" ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <VolumeX className="h-4 w-4" />
                Quiet
              </Button>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Current Mode:</strong> {consoleMode}
                <br />
                <strong>Normal:</strong> Filtered third-party warnings
                <br />
                <strong>Verbose:</strong> Show all messages including
                third-party
                <br />
                <strong>Quiet:</strong> Suppress all warnings
              </AlertDescription>
            </Alert>
          </div>

          {/* Performance Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance Actions
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={applyOptimizations}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                Apply Optimizations
              </Button>
              <Button
                onClick={handleEmergencyReset}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Emergency Reset
              </Button>
            </div>
          </div>

          {/* Status Indicators */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Status</h3>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={performanceStats.fps >= 50 ? "default" : "destructive"}
              >
                {performanceStats.fps >= 50 ? "✅" : "⚠️"} FPS:{" "}
                {performanceStats.fps >= 50 ? "Good" : "Low"}
              </Badge>
              <Badge
                variant={
                  performanceStats.memoryUsage < 100 ? "default" : "secondary"
                }
              >
                {performanceStats.memoryUsage < 100 ? "✅" : "⚠️"} Memory:{" "}
                {performanceStats.memoryUsage < 100 ? "Good" : "High"}
              </Badge>
              <Badge variant="outline">🔇 Third-party warnings filtered</Badge>
              <Badge variant="outline">
                ⚡ Performance optimizations active
              </Badge>
            </div>
          </div>

          {/* Development Tools */}
          {process.env.NODE_ENV === "development" && (
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <strong>Development Mode Active</strong>
                <br />
                • Console filtering is active
                <br />
                • Performance monitoring enabled
                <br />
                • Third-party library warnings suppressed
                <br />• Call <code>enableVerboseLogging()</code> in console to
                see all messages
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
