import { Button } from "@/components/ui/Button";

interface ActionButtonsProps {
  onAddToInventory: () => void;
  onScanAgain: () => void;
  addingToInventory?: boolean;
  addedToInventory?: boolean;
}

export function ActionButtons({
  onAddToInventory,
  onScanAgain,
  addingToInventory,
  addedToInventory,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-3 px-4 py-4">
      <Button
        variant="primary"
        fullWidth
        onClick={onAddToInventory}
        loading={addingToInventory}
        disabled={addedToInventory}
      >
        {addedToInventory ? "✓ Added" : addingToInventory ? "Adding..." : "Add to Inventory"}
      </Button>
      <Button variant="secondary" fullWidth onClick={onScanAgain}>
        Scan Again
      </Button>
    </div>
  );
}
