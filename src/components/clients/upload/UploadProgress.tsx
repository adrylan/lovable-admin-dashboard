import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <div className="space-y-2">
      <Progress value={progress} />
      <p className="text-sm text-center text-gray-500">
        Importando... {progress}%
      </p>
    </div>
  );
}