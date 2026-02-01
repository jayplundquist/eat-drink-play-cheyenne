import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function IdleTumbleweed() {
  const [isIdle, setIsIdle] = useState(false);
  const [idleTimer, setIdleTimer] = useState(null);

  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      setIsIdle(false);
      
      // Set idle timeout to 10 seconds
      timeout = setTimeout(() => {
        setIsIdle(true);
      }, 10000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!isIdle) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm"
    >
      {/* Rolling Tumbleweed Character */}
      <motion.div
        animate={{
          x: ['-100vw', '100vw'],
          rotate: [0, 360 * 4],
        }}
        transition={{
          duration: 8,
          ease: 'linear',
          repeat: Infinity,
        }}
        className="relative w-40 h-40 flex items-center justify-center"
      >
        {/* Tumbleweed SVG */}
        <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Main tumbleweed body - interlocking circles */}
          <defs>
            <linearGradient id="tumbleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#d4a574', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#c19a6b', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8b6f47', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Tumbleweed strands */}
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const x1 = 100 + Math.cos(angle) * 50;
            const y1 = 100 + Math.sin(angle) * 50;
            const x2 = 100 + Math.cos(angle) * 70;
            const y2 = 100 + Math.sin(angle) * 70;
            
            return (
              <path
                key={`strand-${i}`}
                d={`M ${x1} ${y1} Q ${100 + Math.cos(angle) * 80} ${100 + Math.sin(angle) * 80} ${x2} ${y2}`}
                stroke="url(#tumbleGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* Main body circles */}
          <circle cx="100" cy="100" r="45" fill="url(#tumbleGradient)" opacity="0.9" />
          <circle cx="70" cy="70" r="35" fill="url(#tumbleGradient)" opacity="0.8" />
          <circle cx="130" cy="70" r="35" fill="url(#tumbleGradient)" opacity="0.8" />
          <circle cx="70" cy="130" r="35" fill="url(#tumbleGradient)" opacity="0.8" />
          <circle cx="130" cy="130" r="35" fill="url(#tumbleGradient)" opacity="0.8" />

          {/* Left Eye */}
          <circle cx="85" cy="95" r="8" fill="white" />
          <circle cx="85" cy="95" r="5" fill="black" />
          <motion.circle
            cx="87"
            cy="93"
            r="2"
            fill="white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
          />

          {/* Right Eye */}
          <circle cx="115" cy="95" r="8" fill="white" />
          <circle cx="115" cy="95" r="5" fill="black" />
          <motion.circle
            cx="117"
            cy="93"
            r="2"
            fill="white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
          />

          {/* Happy Mouth */}
          <path
            d="M 90 115 Q 100 125 110 115"
            stroke="black"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Rosy Cheeks */}
          <circle cx="65" cy="110" r="8" fill="rgba(220, 100, 100, 0.4)" />
          <circle cx="135" cy="110" r="8" fill="rgba(220, 100, 100, 0.4)" />
        </svg>
      </motion.div>

      {/* Floating dust particles */}
      <motion.div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              backgroundColor: `rgba(139, 111, 71, ${Math.random() * 0.6 + 0.2})`,
            }}
            initial={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
              opacity: 0,
            }}
            animate={{
              x: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
              y: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>

      {/* "You've been idle" message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center pointer-events-none"
      >
        <p className="text-amber-900 font-bold text-xl" style={{ fontFamily: 'Rye, serif' }}>
          You've been quiet, partner...
        </p>
        <p className="text-amber-700 text-sm mt-2">Move your mouse to continue</p>
      </motion.div>
    </motion.div>
  );
}