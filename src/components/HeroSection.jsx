import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection({ searchQuery, onSearchChange, onSearch }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-orange-900 to-amber-900 text-white">
      {/* Western leather texture */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40z' fill-opacity='0.1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }} />
      </div>
      {/* Western rope border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-repeat-x opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='8' viewBox='0 0 40 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 4c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4' stroke='%23fbbf24' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 8px'
      }} />
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-32 sm:py-40">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" style={{ fontFamily: 'Rye, serif', textShadow: '3px 3px 6px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>
            Discover the<br />
            <span className="text-amber-300" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
              Magic City
            </span>
          </h1>
          
          <p className="text-amber-100 text-lg sm:text-xl max-w-2xl mx-auto mb-8" style={{ fontFamily: 'Merriweather, serif', textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
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
                className="w-full pl-12 pr-4 py-6 text-lg rounded-full bg-amber-50/95 backdrop-blur-sm border-2 border-amber-800 text-amber-950 placeholder:text-amber-700 focus:bg-amber-50 focus:border-amber-600 shadow-lg"
                style={{ fontFamily: 'Merriweather, serif' }}
              />
            </div>
          </form>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-amber-200">
            <span className="font-semibold">Popular:</span>
            <button 
              onClick={() => onSearchChange?.("brewery")}
              className="hover:text-amber-400 transition-colors px-3 py-1 rounded border border-amber-700 hover:border-amber-500 hover:bg-amber-900/30"
            >
              Breweries
            </button>
            <span>★</span>
            <button 
              onClick={() => onSearchChange?.("live music")}
              className="hover:text-amber-400 transition-colors px-3 py-1 rounded border border-amber-700 hover:border-amber-500 hover:bg-amber-900/30"
            >
              Live Music
            </button>
            <span>★</span>
            <button 
              onClick={() => onSearchChange?.("downtown")}
              className="hover:text-amber-400 transition-colors px-3 py-1 rounded border border-amber-700 hover:border-amber-500 hover:bg-amber-900/30"
            >
              Downtown
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative western border */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#fef3c7"/>
          <path d="M0 0v120h1440V0c-20 15-40 15-60 0s-40-15-60 0-40 15-60 0-40-15-60 0-40 15-60 0-40-15-60 0-40 15-60 0-40-15-60 0-40 15-60 0-40-15-60 0-40 15-60 0-40-15-60 0-40 15-60 0-40-15-60 0-40 15-60 0-40-15-60 0-40 15-60 0-40-15-60 0-40 15-60 0" fill="#d97706" opacity="0.2"/>
        </svg>
      </div>
    </div>
  );
}