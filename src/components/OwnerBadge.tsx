import { Badge } from '@/components/ui/badge'
import { ASSET_OWNER_LABELS, ASSET_OWNER_COLORS, type AssetOwner } from '@/types'

export function OwnerBadge({ owner, className }: { owner: AssetOwner; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={`shrink-0 border-transparent text-[11px] font-medium ${className ?? ''}`}
      style={{
        backgroundColor: `${ASSET_OWNER_COLORS[owner]}1a`,
        color: ASSET_OWNER_COLORS[owner],
      }}
    >
      {ASSET_OWNER_LABELS[owner]}
    </Badge>
  )
}
