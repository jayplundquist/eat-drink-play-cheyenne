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
        className="w-48 h-48 flex items-center justify-center"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
          {/* Bushy tumbleweed with random interwoven strands */}
          {/* Random strands crisscrossing */}
          <line x1="100" y1="30" x2="150" y2="80" stroke="#8b6914" strokeWidth="2" opacity="0.7"/>
          <line x1="150" y1="80" x2="170" y2="100" stroke="#8b6914" strokeWidth="2" opacity="0.7"/>
          <line x1="170" y1="100" x2="140" y2="160" stroke="#8b6914" strokeWidth="2" opacity="0.7"/>
          <line x1="140" y1="160" x2="100" y2="175" stroke="#8b6914" strokeWidth="2" opacity="0.7"/>
          <line x1="100" y1="175" x2="50" y2="160" stroke="#8b6914" strokeWidth="2" opacity="0.7"/>
          <line x1="50" y1="160" x2="30" y2="100" stroke="#8b6914" strokeWidth="2" opacity="0.7"/>
          <line x1="30" y1="100" x2="50" y2="80" stroke="#8b6914" strokeWidth="2" opacity="0.7"/>
          <line x1="50" y1="80" x2="100" y2="30" stroke="#8b6914" strokeWidth="2" opacity="0.7"/>

          {/* Secondary interwoven strands */}
          <line x1="120" y1="50" x2="80" y2="120" stroke="#9b7924" strokeWidth="1.5" opacity="0.6"/>
          <line x1="150" y1="130" x2="70" y2="140" stroke="#9b7924" strokeWidth="1.5" opacity="0.6"/>
          <line x1="90" y1="160" x2="140" y2="110" stroke="#9b7924" strokeWidth="1.5" opacity="0.6"/>
          <line x1="50" y1="110" x2="130" y2="70" stroke="#9b7924" strokeWidth="1.5" opacity="0.6"/>

          {/* Small crossing twigs */}
          <line x1="110" y1="70" x2="95" y2="95" stroke="#8b6914" strokeWidth="1" opacity="0.5"/>
          <line x1="130" y1="120" x2="115" y2="135" stroke="#8b6914" strokeWidth="1" opacity="0.5"/>
          <line x1="75" y1="135" x2="90" y2="115" stroke="#8b6914" strokeWidth="1" opacity="0.5"/>
          <line x1="65" y1="90" x2="85" y2="75" stroke="#8b6914" strokeWidth="1" opacity="0.5"/>
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