import { Loader2 } from 'lucide-react';

export default function CenteredSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-brew-accent" />
    </div>
  );
}
