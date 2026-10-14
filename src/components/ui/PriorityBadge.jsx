import { PRIORITY_CONFIG } from '../../data/mockData';

export default function PriorityBadge({ priority, size = 'sm' }) {
  const config = PRIORITY_CONFIG[priority];
  if (!config) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${config.color}`}>
      {config.label}
    </span>
  );
}
