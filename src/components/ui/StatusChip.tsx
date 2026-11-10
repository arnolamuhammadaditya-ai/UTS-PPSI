import { ReportStatus } from '@prisma/client';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/utils';

interface StatusChipProps {
  status: ReportStatus;
  size?: 'sm' | 'md';
}

export default function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const colorClass = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <span
      className={`status-chip ${colorClass} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}
    >
      <span className="relative flex h-1.5 w-1.5 mr-1.5">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${
          status === 'Baru' ? 'bg-yellow-500' :
          status === 'Terverifikasi' ? 'bg-blue-500' :
          status === 'Diproses' ? 'bg-purple-500' :
          status === 'Selesai' ? 'bg-green-500' :
          'bg-red-500'
        }`} />
      </span>
      {label}
    </span>
  );
}

