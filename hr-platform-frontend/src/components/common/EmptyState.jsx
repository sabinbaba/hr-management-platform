import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Icon size={32} strokeWidth={1.5} className="mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
