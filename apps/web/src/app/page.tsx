import { APP_NAME } from "@make-my-marriage/shared";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-8 text-stone-900">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">{APP_NAME}</h1>
        <p className="mt-3 text-stone-600">Project setup is ready.</p>
      </div>
    </main>
  );
}
