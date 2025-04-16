import { useState } from "react";
import { Link, useLocation } from "wouter";
import { NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-[#4CAF50] text-white p-4 shadow-md fixed w-full z-50">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/">
          <a className="text-2xl font-bold">FinTrack</a>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:block">
          <ul className="flex">
            {NAV_ITEMS.map((item) => (
              <li key={item.path} className="ml-4">
                <Link href={item.path}>
                  <a 
                    className={`text-white p-2 hover:bg-white/20 rounded transition-colors ${
                      location === item.path ? 'bg-white/20' : ''
                    }`}
                  >
                    {item.name}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Mobile Menu Button */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-gray-800 text-white p-0 w-64">
            <div className="flex flex-col pt-10">
              {NAV_ITEMS.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a 
                    className={`py-4 px-6 border-b border-gray-700 text-lg hover:bg-gray-700 transition-colors ${
                      location === item.path ? 'bg-gray-700' : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
