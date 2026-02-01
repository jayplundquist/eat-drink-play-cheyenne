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
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e9c14c196b53cce1321b1/2dfe3eb41_tilly.png"
          alt="Tumbleweed"
          className="w-full h-full object-contain drop-shadow-lg"
          style={{ mixBlendMode: 'darken' }}
        />
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