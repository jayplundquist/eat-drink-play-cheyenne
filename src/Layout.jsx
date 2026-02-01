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
    { name: 'Favorites', icon: Heart, label: 'Favorites' },
    ...(user?.role === 'admin' ? [{ name: 'ManageVenues', icon: Plus, label: 'Manage' }] : []),
  ];

  const isHome = currentPageName === 'Home';

  return (
    <div className="min-h-screen bg-amber-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d97706' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")" }}>
      <Toaster position="top-right" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rye&family=Merriweather:wght@400;700&display=swap');

        :root {
          --color-primary: #92400e;
          --color-primary-dark: #78350f;
          --western-brown: #8b4513;
          --leather: #a0522d;
        }

        h1, h2, h3 {
          font-family: 'Rye', serif;
          letter-spacing: 0.02em;
        }

        body {
          font-family: 'Merriweather', serif;
        }
      `}</style>

      {/* Navigation */}
      <nav className={cn(
        "sticky top-0 z-50 border-b-4 transition-all duration-300",
        isHome 
          ? "bg-transparent border-transparent absolute w-full" 
          : "bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-md border-amber-900"
      )}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to={createPageUrl('Home')} 
              className="flex items-center gap-2"
            >
              <div className={cn(
                "font-bold text-2xl",
                isHome ? "text-white" : "text-amber-900"
              )} style={{ fontFamily: 'Rye, serif', textShadow: isHome ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none' }}>
                <span className={isHome ? "text-amber-300" : "text-amber-700"}>LIVE</span>
                <span className={isHome ? "text-white" : "text-amber-900"}> CHEYENNE</span>
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
                      "transition-colors border-2",
                      currentPageName === name 
                        ? "bg-amber-800 text-amber-50 border-amber-900" 
                        : isHome 
                          ? "text-white/90 hover:text-white hover:bg-white/10 border-transparent" 
                          : "text-amber-900 hover:text-amber-50 hover:bg-amber-800 border-amber-700"
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
                      <Link to={createPageUrl('Profile')} className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Favorites')} className="cursor-pointer">
                        <Heart className="w-4 h-4 mr-2" />
                        My Favorites
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
                    "border-2",
                    isHome 
                      ? "bg-white/10 text-white border-white/20 hover:bg-white/20" 
                      : "bg-amber-800 hover:bg-amber-900 text-white border-amber-900"
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
          <div className="md:hidden bg-gradient-to-r from-amber-50 to-orange-50 border-t-4 border-amber-900 py-4">
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
      <footer className="bg-gradient-to-b from-amber-950 to-stone-950 text-amber-200 py-12 border-t-4 border-amber-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="font-bold text-2xl text-amber-100 mb-2" style={{ fontFamily: 'Rye, serif' }}>
                <span className="text-amber-400">LIVE</span> CHEYENNE
              </div>
              <p className="text-sm text-amber-300">
                Discover the best of the Magic City
              </p>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Link to={createPageUrl('Home')} className="hover:text-amber-400 transition-colors">
                Explore
              </Link>
              <Link to={createPageUrl('Favorites')} className="hover:text-amber-400 transition-colors">
                Favorites
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t-2 border-amber-900 text-center text-sm">
            <p>© {new Date().getFullYear()} Cheyenne Guide. Made with ❤️ in Wyoming</p>
          </div>
        </div>
      </footer>
    </div>
  );
}