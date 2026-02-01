import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MapPin, 
  Calendar, 
  Heart, 
  Menu, 
  X, 
  User,
  LogOut,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const navItems = [
    { name: 'Home', icon: MapPin, label: 'Explore' },
    { name: 'Events', icon: Calendar, label: 'Events' },
    { name: 'Favorites', icon: Heart, label: 'Favorites' },
    { name: 'ManageVenues', icon: Plus, label: 'Manage' },
  ];

  const isHome = currentPageName === 'Home';

  return (
    <div className="min-h-screen bg-stone-50">
      <Toaster position="top-right" />
      <style>{`
        :root {
          --color-primary: #d97706;
          --color-primary-dark: #b45309;
        }
      `}</style>

      {/* Navigation */}
      <nav className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        isHome 
          ? "bg-transparent border-transparent absolute w-full" 
          : "bg-white/95 backdrop-blur-md border-stone-200"
      )}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to={createPageUrl('Home')} 
              className="flex items-center gap-2"
            >
              <div className={cn(
                "font-bold text-xl tracking-tight",
                isHome ? "text-white" : "text-stone-800"
              )}>
                <span className="text-amber-500">Cheyenne</span>
                <span className={isHome ? "text-white" : "text-stone-600"}> Guide</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ name, icon: Icon, label }) => (
                <Link key={name} to={createPageUrl(name)}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={cn(
                      "transition-colors",
                      currentPageName === name 
                        ? "bg-amber-100 text-amber-700" 
                        : isHome 
                          ? "text-white/80 hover:text-white hover:bg-white/10" 
                          : "text-stone-600 hover:text-amber-700 hover:bg-amber-50"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        isHome 
                          ? "text-white/80 hover:text-white hover:bg-white/10" 
                          : "text-stone-600 hover:text-stone-800"
                      )}
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{user.full_name || user.email?.split('@')[0]}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Favorites')} className="cursor-pointer">
                        <Heart className="w-4 h-4 mr-2" />
                        My Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Settings')} className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => base44.auth.logout()}
                      className="text-rose-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  size="sm"
                  className={cn(
                    isHome 
                      ? "bg-white/10 text-white border border-white/20 hover:bg-white/20" 
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  )}
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "md:hidden",
                  isHome ? "text-white hover:bg-white/10" : "text-stone-600"
                )}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-stone-200 py-4">
            <div className="max-w-6xl mx-auto px-4 space-y-2">
              {navItems.map(({ name, icon: Icon, label }) => (
                <Link 
                  key={name} 
                  to={createPageUrl(name)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "w-full justify-start",
                      currentPageName === name 
                        ? "bg-amber-100 text-amber-700" 
                        : "text-stone-600"
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className={isHome ? "-mt-16" : ""}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="font-bold text-xl text-white mb-2">
                <span className="text-amber-500">Cheyenne</span> Guide
              </div>
              <p className="text-sm">
                Discover the best of the Magic City
              </p>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Link to={createPageUrl('Home')} className="hover:text-amber-400 transition-colors">
                Explore
              </Link>
              <Link to={createPageUrl('Events')} className="hover:text-amber-400 transition-colors">
                Events
              </Link>
              <Link to={createPageUrl('Favorites')} className="hover:text-amber-400 transition-colors">
                Favorites
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-stone-800 text-center text-sm">
            <p>© {new Date().getFullYear()} Cheyenne Guide. Made with ❤️ in Wyoming</p>
          </div>
        </div>
      </footer>
    </div>
  );
}