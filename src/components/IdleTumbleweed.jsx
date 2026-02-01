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
      {/* Tumbleweed */}
      <motion.div
        animate={{
          x: ['-100vw', '100vw'],
          rotate: [0, 360 * 3],
        }}
        transition={{
          duration: 6,
          ease: 'linear',
          repeat: Infinity,
        }}
        className="text-8xl"
      >
        🌵
      </motion.div>

      {/* Floating dust particles */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-amber-600 rounded-full opacity-60"
            initial={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
              opacity: 0,
            }}
            animate={{
              x: [`${Math.random() * 100}vw`, `${Math.random() * 100}vw`],
              y: [`${Math.random() * 100}vh`, `${Math.random() * 100}vh`],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>

      {/* Tumble sound wave lines */}
      <motion.svg
        className="absolute w-32 h-32 pointer-events-none"
        viewBox="0 0 100 100"
      >
        {[...Array(3)].map((_, i) => (
          <motion.circle
            key={i}
            cx="50"
            cy="50"
            r="20"
            fill="none"
            stroke="rgba(217, 119, 6, 0.6)"
            strokeWidth="1"
            animate={{
              r: [15, 40],
              opacity: [1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
            }}
          />
        ))}
      </motion.svg>

      {/* "You've been idle" message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center"
      >
        <p className="text-amber-900 font-bold text-lg" style={{ fontFamily: 'Rye, serif' }}>
          You've been quiet, partner...
        </p>
        <p className="text-amber-700 text-sm mt-1">Move your mouse to continue</p>
      </motion.div>
    </motion.div>
  );
}