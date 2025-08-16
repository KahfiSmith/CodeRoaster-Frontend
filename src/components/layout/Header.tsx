import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <div className="text-center mt-10">
      <div className="p-8 rounded-lg bg-soft-coral/80 border-3 border-coral dark:border-cream dark:bg-coal-400">
        <h1 className="text-4xl text-coral dark:text-cream mb-3 flex items-center gap-3 font-bold justify-center">
          <Coffee className="w-10 h-10 fill-coral/70 dark:fill-cream/80" />
          Code Roaster
          <Coffee className="w-10 h-10 fill-coral/70 dark:fill-cream/80" />
        </h1>
        <p className="text-coral dark:text-cream text-lg font-bold mb-2 ">
          Code issue adalah caraku mengekspresikan bahwa kodingan lo sangat
          ampasss.
        </p>
        <div className="text-coral dark:text-cream text-sm font-bold tracking-wide">
          Kopi panas, review gw lebih panas.
        </div>
      </div>

      <div className="mt-8 flex justify-center space-x-6 mb-8">
        <Link to="/">
          <Button className="bg-sky hover:bg-sky/80 text-charcoal font-medium py-1.5 px-3 rounded-md border-2 border-charcoal transition-all duration-200 shadow-[3px_3px_0px_0px_#27292b] hover:shadow-[1px_1px_0px_0px_#27292b] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-sm">
            <img src="icons/house.svg" alt="" className="w-6 h-6" />
            <span>Code Reviewer</span>
          </Button>
        </Link>
        {/* <Link to="/bookmarks">
          <Button className="bg-amber hover:bg-amber/70 text-charcoal font-medium py-1.5 px-3 rounded-md border-2 border-charcoal transition-all duration-200 shadow-[3px_3px_0px_0px_#27292b] hover:shadow-[1px_1px_0px_0px_#27292b] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-sm">
            <img src="icons/bookmark.svg" alt="" className="w-6 h-6" />
            <span>Bookmark</span>
          </Button>
        </Link> */}
        <Link to="/history">
          <Button className="bg-coral hover:bg-coral/80 text-charcoal font-medium py-1.5 px-3 rounded-md border-2 border-charcoal transition-all duration-200 shadow-[3px_3px_0px_0px_#27292b] hover:shadow-[1px_1px_0px_0px_#27292b] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] text-sm">
            <img src="icons/history.svg" alt="" className="w-6 h-6" />
            <span>History</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
