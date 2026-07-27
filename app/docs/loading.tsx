export default function DocsLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
        <p className="mt-4 text-muted">Loading documentation...</p>
      </div>
    </div>
  );
}
