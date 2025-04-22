import { useState } from "react";
import { Link, useLocation } from "wouter";
import { NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, Menu, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { username, logout } = useAuth();
  const { themeConfig } = useTheme();

  const handleLogout = () => {
    logout();
  };

  const headerStyle = {
    backgroundColor: themeConfig.primaryColor,
  };

  return (
    <header className="text-white p-4 shadow-md fixed w-full z-50" style={headerStyle}>
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/">
          <div className="flex items-center">
            {themeConfig.logoUrl && (
              <img 
                src={themeConfig.logoUrl} 
                alt={themeConfig.appName} 
                className="h-8 w-auto mr-2"
              />
            )}
            <span className="text-2xl font-bold">{themeConfig.appName}</span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center">
          <nav>
            <ul className="flex">
              {NAV_ITEMS.map((item) => (
                <li key={item.path} className="ml-4">
                  <Link href={item.path}>
                    <span 
                      className={`text-white p-2 hover:bg-white/20 rounded transition-colors ${
                        location === item.path ? 'bg-white/20' : ''
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User info and logout */}
          <div className="flex items-center ml-8 border-l border-white/30 pl-6">
            <div className="flex items-center mr-4">
              <User className="w-5 h-5 mr-2" />
              <span className="font-medium">{username}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu Button */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-gray-800 text-white p-0 w-64">
            {/* User info in mobile menu */}
            <div className="p-4 border-b border-gray-700 flex items-center">
              <User className="w-5 h-5 mr-2" />
              <span className="font-medium">{username}</span>
            </div>
            
            <div className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <Link key={item.path} href={item.path}>
                  <span 
                    className={`py-4 px-6 border-b border-gray-700 text-lg hover:bg-gray-700 transition-colors block ${
                      location === item.path ? 'bg-gray-700' : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
              
              {/* Logout in mobile menu */}
              <button
                className="py-4 px-6 border-b border-gray-700 text-lg hover:bg-gray-700 transition-colors text-left flex items-center"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="w-5 h-5 mr-2" />
                <span>Sair</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
