import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerProductRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/marketplace/products/${id}`);
}
