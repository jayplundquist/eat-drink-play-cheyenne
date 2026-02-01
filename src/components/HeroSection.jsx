import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection({ searchQuery, onSearchChange, onSearch }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-medium tracking-wide uppercase text-sm">
              Cheyenne, Wyoming
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Discover the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Magic City
            </span>
          </h1>
          
          <p className="text-stone-300 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            Explore the best restaurants, bars, breweries, and entertainment 
            that Cheyenne has to offer
          </p>
          
          <form 
            onSubmit={(e) => { e.preventDefault(); onSearch?.(); }}
            className="max-w-xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                type="text"
                placeholder="Search venues, events, or activities..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-12 pr-4 py-6 text-lg rounded-full bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-stone-400 focus:bg-white/20 focus:border-amber-400"
              />
            </div>
          </form>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-stone-400">
            <span>Popular:</span>
            <button 
              onClick={() => onSearchChange?.("brewery")}
              className="hover:text-amber-400 transition-colors"
            >
              Breweries
            </button>
            <span>•</span>
            <button 
              onClick={() => onSearchChange?.("live music")}
              className="hover:text-amber-400 transition-colors"
            >
              Live Music
            </button>
            <span>•</span>
            <button 
              onClick={() => onSearchChange?.("downtown")}
              className="hover:text-amber-400 transition-colors"
            >
              Downtown
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#fafaf9"/>
        </svg>
      </div>
    </div>
  );
}