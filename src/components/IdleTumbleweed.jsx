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
          {/* Main tumbleweed body */}
          <circle cx="100" cy="100" r="60" fill="#8b6914" opacity="0.8"/>
          <circle cx="100" cy="100" r="50" fill="#a0791a" opacity="0.6"/>

          {/* Spokes/branches */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const x1 = 100 + Math.cos(angle) * 50;
            const y1 = 100 + Math.sin(angle) * 50;
            const x2 = 100 + Math.cos(angle) * 70;
            const y2 = 100 + Math.sin(angle) * 70;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8b6914" strokeWidth="3" opacity="0.7"/>
            );
          })}

          {/* Eyes */}
          <circle cx="85" cy="95" r="6" fill="#fff"/>
          <circle cx="115" cy="95" r="6" fill="#fff"/>
          <circle cx="86" cy="96" r="3" fill="#000"/>
          <circle cx="116" cy="96" r="3" fill="#000"/>

          {/* Smile */}
          <path d="M 90 110 Q 100 115 110 110" stroke="#8b6914" strokeWidth="2" fill="none" strokeLinecap="round"/>

          {/* Leaves/dust detail */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const x = 100 + Math.cos(angle) * 75;
            const y = 100 + Math.sin(angle) * 75;
            return (
              <ellipse key={i} cx={x} cy={y} rx="4" ry="8" fill="#8b6914" opacity="0.5" transform={`rotate(${i * 45} ${x} ${y})`}/>
            );
          })}
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