import React, { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VenueRolodex({ venues = [] }) {
  const lastActiveIndex = useRef(-1);
  const stackRef = useRef(null);
  const viewportRef = useRef(null);
  const audioCtxRef = useRef(null);
  const navigate = useNavigate();

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTick = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, audioCtxRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.06);
    gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.06);
  };

  const updatePhysics = () => {
    requestAnimationFrame(() => {
      if (!viewportRef.current || !stackRef.current) return;
      
      const cards = stackRef.current.querySelectorAll('.venue-card');
      const viewCenter = viewportRef.current.scrollTop + (viewportRef.current.offsetHeight / 2);
      let currentActive = -1;
      let minDistance = Infinity;

      cards.forEach((card, i) => {
        const shadow = card.querySelector('.card-shadow');
        const cardCenter = card.offsetTop + (card.offsetHeight / 2);
        const dist = cardCenter - viewCenter;

        const angle = dist / 4.5;
        card.style.transform = `rotateX(${-angle}deg) translateZ(${Math.abs(angle) * -0.4}px)`;
        
        const opacity = 1 - Math.abs(dist) / 450;
        card.style.opacity = opacity < 0.1 ? 0 : opacity;
        
        if (shadow) {
          shadow.style.opacity = Math.min(Math.abs(dist) / 280, 0.7);
        }

        if (Math.abs(dist) < minDistance) {
          minDistance = Math.abs(dist);
          currentActive = i;
        }
      });

      if (currentActive !== lastActiveIndex.current) {
        playTick();
        if (navigator.vibrate) navigator.vibrate(10);
        lastActiveIndex.current = currentActive;
      }
    });
  };

  const handleCardClick = (venue, el) => {
    initAudio();
    const rect = el.getBoundingClientRect();
    const screenCenter = window.innerHeight / 2;
    
    if (Math.abs((rect.top + rect.height / 2) - screenCenter) < 80) {
      el.style.backgroundColor = "#f0f0f0";
      setTimeout(() => {
        navigate(`/VenueDetails?id=${venue.id}`);
      }, 150);
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    updatePhysics();
  }, [venues]);

  return (
    <div className="rolo-app-container" onClick={initAudio}>
      <style>{`
        .rolo-machine {
          width: 100%;
          max-width: 480px;
          margin: 20px auto;
          height: 680px;
          background: #111;
          border-radius: 40px;
          position: relative;
          box-shadow: 0 50px 100px rgba(0,0,0,0.7);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 8px solid #2a2a2a;
        }

        .machine-header {
          padding: 20px 0;
          background: linear-gradient(to bottom, #333, #111);
          z-index: 25;
          display: flex;
          justify-content: center;
          border-bottom: 2px solid #000;
          height: 40px; /* Reduced height since search is gone */
        }

        .spindle {
          position: absolute;
          width: 25px;
          height: 85%;
          background: linear-gradient(to right, #000, #444, #000);
          top: 10%;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 15px;
          z-index: 2;
          opacity: 0.8;
          pointer-events: none;
        }

        .rolodex-viewport {
          width: 100%;
          flex-grow: 1;
          overflow-y: scroll;
          perspective: 2000px;
          scroll-snap-type: y mandatory;
          scrollbar-width: none;
          z-index: 10;
          padding-top: 200px;
          padding-bottom: 250px;
        }

        .rolodex-viewport::-webkit-scrollbar { display: none; }

        .rolodex-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          transform-style: preserve-3d;
        }

        .venue-card {
          width: 340px;
          height: 180px;
          background: #fff;
          margin-bottom: -130px;
          border-radius: 12px;
          padding: 20px;
          box-sizing: border-box;
          box-shadow: 0 15px 35px rgba(0,0,0,0.5);
          border-top: 12px solid #d32f2f;
          scroll-snap-align: center;
          scroll-snap-stop: always;
          transform-origin: center center -280px;
          position: relative;
          cursor: pointer;
          backface-visibility: hidden;
          transition: background-color 0.2s, transform 0.1s ease-out;
        }

        .card-shadow {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: black;
          opacity: 0;
          border-radius: 12px;
          pointer-events: none;
        }

        .venue-card h3 { margin: 0; color: #111; font-size: 20px; font-weight: 800; }
        .venue-card p { font-size: 14px; color: #555; margin: 8px 0 0; line-height: 1.4; }
        .view-btn { margin-top: 15px; font-size: 11px; color: #d32f2f; font-weight: bold; }
      `}</style>

      <div className="rolo-machine">
        <div className="machine-header">
           {/* Header is now a decorative cap */}
        </div>
        
        <div className="spindle"></div>

        <div 
          className="rolodex-viewport" 
          ref={viewportRef}
          onScroll={updatePhysics}
        >
          <div className="rolodex-stack" ref={stackRef}>
            {venues.map((venue) => (
              <div 
                key={venue.id}
                className="venue-card" 
                onClick={(e) => handleCardClick(venue, e.currentTarget)}
              >
                <div className="card-shadow"></div>
                <h3>{venue.name}</h3>
                <p>{venue.description ? venue.description.substring(0, 75) + '...' : 'No description available.'}</p>
                <div className="view-btn">EXPLORE VENUE →</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}