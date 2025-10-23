export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">JOWi Shop</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Multi-tenant retail management system
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Dashboard
          </a>
          <a
            href="/login"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition"
          >
            Login
          </a>
        </div>
      </div>
    </main>
  );
}
