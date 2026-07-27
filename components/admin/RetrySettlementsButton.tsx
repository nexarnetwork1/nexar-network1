import { retryFailedSettlementsAction } from "@/modules/platform/actions";
import { Button } from "@/components/ui/Button";

export function RetrySettlementsButton() {
  async function handleRetry() {
    "use server";
    await retryFailedSettlementsAction();
  }

  return (
    <form action={handleRetry}>
      <Button type="submit" variant="secondary" size="sm">
        Retry failed settlements
      </Button>
    </form>
  );
}
