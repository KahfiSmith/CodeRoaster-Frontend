export const CodeReviewResults = () => {
  return (
    <div className="bg-sky border-4 border-charcoal rounded-lg shadow-[0px_4px_0px_0px_#27292b]">
      <div className="bg-charcoal p-4 border-b-4 border-charcoal">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-sky flex items-center gap-2">
            <span>🔍</span>
            Code Review Results
          </h2>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-coral"></div>
            <div className="w-3 h-3 rounded-full bg-amber"></div>
            <div className="w-3 h-3 rounded-full bg-sky"></div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-sky/80 min-h-[300px]">
        <div className="bg-charcoal rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-sky rounded-full animate-pulse"></div>
            <span className="text-sky font-bold text-sm">
              Ready for code analysis...
            </span>
          </div>
        </div>
        <div className="bg-cream border-3 border-charcoal rounded-lg p-4">
          <pre className="text-charcoal text-sm overflow-x-auto font-mono leading-relaxed">
            {`// Upload your code to see the magic happen! ✨
            // Supported formats: JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP...

            function codeReviewExample() {
              console.log("Hello, Code Roaster! ☕");
              console.log("Ready to roast your code...");
            }`}
          </pre>
        </div>
        <div className="mt-4 p-3 bg-amber/20 border-2 border-charcoal rounded-lg">
          <p className="text-charcoal text-sm font-medium">
            💡 <strong>Tip:</strong> Upload any code file and get instant
            feedback on code quality, potential bugs, and improvement
            suggestions!
          </p>
        </div>
      </div>
    </div>
  );
};
