export default function AppLoading() {
  return (
    <div className="flex min-h-screen animate-pulse bg-slate-100">
      <div className="hidden w-64 bg-slate-900 md:block" />
      <div className="flex-1 p-8">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="mt-8 h-48 rounded-2xl bg-white" />
      </div>
    </div>
  );
}
