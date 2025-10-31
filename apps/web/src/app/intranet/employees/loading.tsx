import { Loader } from '@jowi/ui';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader size="lg" text="Загрузка сотрудников..." />
    </div>
  );
}
