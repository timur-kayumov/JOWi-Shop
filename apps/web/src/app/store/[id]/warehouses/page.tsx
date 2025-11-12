import { redirect } from 'next/navigation';

export default function WarehousesPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/store/${params.id}/warehouses/warehouses-list`);
}
