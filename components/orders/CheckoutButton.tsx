import { checkoutAction } from "@/modules/orders/actions";
import { Button } from "@/components/ui/Button";

async function checkoutFormAction() {
  "use server";
  await checkoutAction();
}

export function CheckoutButton() {
  return (
    <form action={checkoutFormAction}>
      <Button type="submit" className="w-full">
        Proceed to checkout
      </Button>
    </form>
  );
}
