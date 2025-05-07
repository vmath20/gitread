export default function LoadingIndicator() {
  return (
    <div className="text-center mt-8 space-y-2">
      <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-white"></div>
        <p className="text-gray-600 font-medium">
          Generating README
          <span className="animate-[ellipsis_1.5s_steps(4,jump-none)_infinite]">...</span>
        </p>
      </div>
      <div className="flex flex-col items-center text-sm text-gray-500 space-y-1">
        <p className="animate-pulse">🔍 Analyzing repository structure</p>
        <p className="animate-pulse delay-300">📝 Crafting documentation</p>
        <p className="animate-pulse delay-500">✨ Adding finishing touches</p>
      </div>
    </div>
  );
} 