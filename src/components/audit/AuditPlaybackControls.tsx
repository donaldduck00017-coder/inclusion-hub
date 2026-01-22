/**
 * Audit Playback Controls
 * 
 * Bottom bar with playback controls:
 * - Play/Pause
 * - Timeline slider
 * - Speed selector (1x, 2x, 4x)
 * - Reset button
 */

import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { PlaybackSpeed } from '@/types/audit';

interface AuditPlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: PlaybackSpeed;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onReset: () => void;
  disabled?: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const speedOptions: PlaybackSpeed[] = [1, 2, 4];

export function AuditPlaybackControls({
  isPlaying,
  currentTime,
  duration,
  speed,
  onPlay,
  onPause,
  onSeek,
  onSpeedChange,
  onReset,
  disabled = false,
}: AuditPlaybackControlsProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const handleSliderChange = (value: number[]) => {
    const time = (value[0] / 100) * duration;
    onSeek(time);
  };
  
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-card border-t border-border">
      {/* Play/Pause Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={isPlaying ? onPause : onPlay}
        disabled={disabled}
        className="flex-shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      {/* Current Time */}
      <span className="font-mono text-sm text-muted-foreground w-16 flex-shrink-0">
        {formatTime(currentTime)}
      </span>
      
      {/* Timeline Slider */}
      <div className="flex-1 min-w-0">
        <Slider
          value={[progress]}
          max={100}
          step={0.1}
          onValueChange={handleSliderChange}
          disabled={disabled}
          className="cursor-pointer"
        />
      </div>
      
      {/* Duration */}
      <span className="font-mono text-sm text-muted-foreground w-16 flex-shrink-0 text-right">
        {formatTime(duration)}
      </span>
      
      {/* Speed Selector */}
      <div className="flex items-center gap-1 border border-border rounded-md">
        {speedOptions.map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            onClick={() => onSpeedChange(s)}
            disabled={disabled}
            className={cn(
              'h-8 px-3 text-xs font-mono',
              speed === s && 'bg-primary/10 text-primary'
            )}
          >
            {s}x
          </Button>
        ))}
      </div>
      
      {/* Reset Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        disabled={disabled}
        className="flex-shrink-0"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
