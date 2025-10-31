import { Loader } from '@jowi/ui';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Loader size="lg" text="Загрузка..." />
    </div>
  );
}
