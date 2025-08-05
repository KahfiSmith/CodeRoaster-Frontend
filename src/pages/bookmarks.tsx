// File: src/components/bookmarks/BookmarkManager.tsx
import React, { useState } from "react";
import {
  Bookmark,
  Search,
  Filter,
  Code,
  Lightbulb,
  Shield,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout";
import { BookmarkCardProps, BookmarkDetailModalProps, BookmarkItem, Category } from "@/types";

const sampleBookmarks: BookmarkItem[] = [
  {
    id: 1,
    title: "Proper Error Handling in Async Functions",
    category: "best-practices",
    language: "javascript",
    description:
      "Always use try-catch blocks with async/await to handle errors properly",
    codeExample: {
      wrong: `async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}`,
      correct: `async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}`,
    },
    tags: ["async", "error-handling", "fetch"],
    dateAdded: "2025-07-22",
    usageCount: 5,
  },
  {
    id: 2,
    title: "Use const/let instead of var",
    category: "best-practices",
    language: "javascript",
    description:
      "Avoid using var, prefer const for immutable values and let for mutable ones",
    codeExample: {
      wrong: `var name = 'John';
var age = 30;
if (true) {
  var message = 'Hello';
}`,
      correct: `const name = 'John';
let age = 30;
if (true) {
  const message = 'Hello';
}`,
    },
    tags: ["variables", "scope", "es6"],
    dateAdded: "2025-07-20",
    usageCount: 8,
  },
  {
    id: 3,
    title: "Validate Input Parameters",
    category: "security",
    language: "javascript",
    description:
      "Always validate and sanitize user inputs to prevent security vulnerabilities",
    codeExample: {
      wrong: `function createUser(data) {
  const user = new User(data);
  return user.save();
}`,
      correct: `function createUser(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid user data');
  }
  
  const { name, email } = data;
  if (!name || !email) {
    throw new Error('Name and email are required');
  }
  
  const user = new User({ name, email });
  return user.save();
}`,
    },
    tags: ["security", "validation", "input"],
    dateAdded: "2025-07-18",
    usageCount: 12,
  },
];

const categoryIcons: Record<BookmarkItem["category"], React.ReactNode> = {
  "best-practices": <Lightbulb className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  performance: <Zap className="w-4 h-4" />,
  bugs: <Code className="w-4 h-4" />,
  documentation: <Bookmark className="w-4 h-4" />,
};

const categoryColors: Record<BookmarkItem["category"], string> = {
  "best-practices": "bg-amber",
  security: "bg-coral",
  performance: "bg-sky",
  bugs: "bg-soft-coral",
  documentation: "bg-cream",
};

export const Bookmarks: React.FC = () => {
  const [bookmarks] = useState<BookmarkItem[]>(sampleBookmarks);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkItem | null>(
    null
  );

  const categories: Category[] = [
    { id: "all", name: "All Bookmarks", count: bookmarks.length },
    {
      id: "best-practices",
      name: "Best Practices",
      count: bookmarks.filter((b) => b.category === "best-practices").length,
    },
    {
      id: "security",
      name: "Security",
      count: bookmarks.filter((b) => b.category === "security").length,
    },
    {
      id: "performance",
      name: "Performance",
      count: bookmarks.filter((b) => b.category === "performance").length,
    },
    {
      id: "bugs",
      name: "Bug Fixes",
      count: bookmarks.filter((b) => b.category === "bugs").length,
    },
    {
      id: "documentation",
      name: "Documentation",
      count: bookmarks.filter((b) => b.category === "documentation").length,
    },
  ];

  const filteredBookmarks = bookmarks.filter((bookmark: BookmarkItem) => {
    const matchesCategory =
      selectedCategory === "all" || bookmark.category === selectedCategory;
    const matchesSearch =
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookmark.tags.some((tag: string) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-cream min-h-screen p-8">
      <Header />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Categories */}
        <div className="w-full lg:w-1/4">
          <div className="bg-sky border-4 border-charcoal rounded-lg shadow-[0px_4px_0px_0px_#27292b] sticky top-8">
            <div className="bg-charcoal p-4 border-b-4 border-charcoal">
              <h2 className="text-xl font-bold text-sky flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Categories
              </h2>
            </div>
            <div className="p-4 bg-sky/80">
              {categories.map((category: Category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-3 mb-2 rounded-lg border-2 border-charcoal font-bold transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-charcoal text-sky shadow-[0px_2px_0px_0px_#27292b]"
                      : "bg-cream text-charcoal hover:bg-amber/50 shadow-[0px_3px_0px_0px_#27292b] hover:shadow-[0px_1px_0px_0px_#27292b] hover:translate-y-[2px]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {category.id !== "all" &&
                        category.id in categoryIcons &&
                        categoryIcons[category.id as BookmarkItem["category"]]}
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className="text-xs bg-charcoal text-cream px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          {/* Search Bar */}
          <div className="bg-coral border-4 border-charcoal rounded-lg shadow-[0px_4px_0px_0px_#27292b] mb-6">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search bookmarks, tags, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-cream border-3 border-charcoal rounded-lg text-charcoal font-bold placeholder:text-charcoal/60 focus:outline-none focus:shadow-[0px_0px_0px_3px_#27292b]"
                />
              </div>
            </div>
          </div>

          {/* Bookmarks Grid */}
          <div className="grid gap-6">
            {filteredBookmarks.length > 0 ? (
              filteredBookmarks.map((bookmark: BookmarkItem) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onClick={() => setSelectedBookmark(bookmark)}
                />
              ))
            ) : (
              <div className="bg-amber/20 border-3 border-charcoal rounded-lg p-8 text-center">
                <img
                  src="icons/coffee.svg"
                  alt=""
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                />
                <h3 className="text-xl font-bold text-charcoal mb-2">
                  No bookmarks found
                </h3>
                <p className="text-charcoal/70 font-medium">
                  Try adjusting your search or browse different categories.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bookmark Detail Modal */}
      {selectedBookmark && (
        <BookmarkDetailModal
          bookmark={selectedBookmark}
          onClose={() => setSelectedBookmark(null)}
        />
      )}
    </div>
  );
};

// Bookmark Card Component
const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, onClick }) => {
  return (
    <div
      className={`${
        categoryColors[bookmark.category]
      } border-4 border-charcoal rounded-lg shadow-[0px_4px_0px_0px_#27292b] hover:shadow-[0px_2px_0px_0px_#27292b] hover:translate-y-[2px] transition-all duration-200 cursor-pointer`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {categoryIcons[bookmark.category]}
            <span className="text-xs bg-charcoal text-cream px-3 py-1 rounded-full font-bold">
              {bookmark.language}
            </span>
            <span className="text-xs bg-charcoal text-cream px-3 py-1 rounded-full font-bold">
              {bookmark.category}
            </span>
          </div>
          <Bookmark className="w-5 h-5 text-charcoal" />
        </div>

        <h3 className="text-lg font-bold text-charcoal mb-2 leading-tight">
          {bookmark.title}
        </h3>

        <p className="text-charcoal/80 text-sm mb-4 font-medium leading-relaxed">
          {bookmark.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
          {bookmark.tags.map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-charcoal/20 text-charcoal px-2 py-1 rounded font-bold"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="bg-charcoal rounded-lg p-3">
          <div className="text-xs text-cream font-bold mb-1">Preview:</div>
          <pre className="text-cream text-xs font-mono leading-tight overflow-hidden">
            {bookmark.codeExample.correct.split("\n").slice(0, 3).join("\n")}
            {bookmark.codeExample.correct.split("\n").length > 3 && "..."}
          </pre>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-charcoal/70">
          <span className="font-medium">Added: {bookmark.dateAdded}</span>
          <span className="font-medium">Used {bookmark.usageCount} times</span>
        </div>
      </div>
    </div>
  );
};

// Bookmark Detail Modal
const BookmarkDetailModal: React.FC<BookmarkDetailModalProps> = ({
  bookmark,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"wrong" | "correct">("wrong");

  return (
    <div className="fixed inset-0 bg-charcoal/80 flex items-center justify-center p-4 z-50">
      <div className="bg-cream border-4 border-charcoal rounded-lg shadow-[0px_8px_0px_0px_#27292b] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-charcoal p-4 border-b-4 border-charcoal sticky top-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-cream flex items-center gap-2">
              {categoryIcons[bookmark.category]}
              {bookmark.title}
            </h2>
            <button
              onClick={onClose}
              className="text-cream hover:text-coral text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm bg-charcoal text-cream px-3 py-1 rounded-full font-bold">
              {bookmark.language}
            </span>
            <span
              className={`text-sm ${
                categoryColors[bookmark.category]
              } text-charcoal px-3 py-1 rounded-full font-bold border-2 border-charcoal`}
            >
              {bookmark.category}
            </span>
          </div>

          <p className="text-charcoal text-lg mb-6 font-medium leading-relaxed">
            {bookmark.description}
          </p>

          {/* Code Tabs */}
          <div className="mb-4">
            <div className="flex border-b-3 border-charcoal">
              <button
                onClick={() => setActiveTab("wrong")}
                className={`px-4 py-2 font-bold border-r-3 border-charcoal ${
                  activeTab === "wrong"
                    ? "bg-coral text-charcoal"
                    : "bg-charcoal/10 text-charcoal hover:bg-coral/30"
                }`}
              >
                ❌ Wrong Way
              </button>
              <button
                onClick={() => setActiveTab("correct")}
                className={`px-4 py-2 font-bold ${
                  activeTab === "correct"
                    ? "bg-sky text-charcoal"
                    : "bg-charcoal/10 text-charcoal hover:bg-sky/30"
                }`}
              >
                ✅ Correct Way
              </button>
            </div>
          </div>

          {/* Code Display */}
          <div className="bg-charcoal rounded-lg p-4 mb-6">
            <pre className="text-cream text-sm font-mono leading-relaxed overflow-x-auto">
              {bookmark.codeExample[activeTab]}
            </pre>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {bookmark.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-sm bg-amber text-charcoal px-3 py-1 rounded-full font-bold border-2 border-charcoal"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="bg-amber/20 border-2 border-charcoal rounded-lg p-4">
            <div className="flex justify-between items-center text-sm font-bold text-charcoal">
              <span>📅 Added: {bookmark.dateAdded}</span>
              <span>🔥 Used {bookmark.usageCount} times</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
