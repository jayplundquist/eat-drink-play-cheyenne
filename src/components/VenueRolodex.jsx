import React, { useState, useEffect, useRef } from 'react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function VenueRolodex({ venues }) {
  const [lastActiveIndex, setLastActiveIndex] = useState(-1);
  const stackRef = useRef(null);
  const viewportRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }, []);

  const playTick = () => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtxRef.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.08);
  };

  const updatePhysics = () => {
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
      card.style.transform = `rotateX(${-angle}deg) translateZ(${Math.abs(angle) * -0.3}px)`;
      
      const opacity = 1 - Math.abs(dist) / 400;
      card.style.opacity = opacity < 0.1 ? 0 : opacity;
      
      if (shadow) {
        shadow.style.opacity = Math.min(Math.abs(dist) / 250, 0.7);
      }

      if (Math.abs(dist) < minDistance) {
        minDistance = Math.abs(dist);
        currentActive = i;
      }
    });

    if (currentActive !== lastActiveIndex) {
      playTick();
      if (navigator.vibrate) navigator.vibrate(12);
      setLastActiveIndex(currentActive);
    }
  };

  const navigate = useNavigate();

  const handleCardClick = (venue, el) => {
    const rect = el.getBoundingClientRect();
    const screenCenter = window.innerHeight / 2;
    if (Math.abs((rect.top + rect.height/2) - screenCenter) < 70) {
      el.style.backgroundColor = "#eee";
      setTimeout(() => {
        navigate(createPageUrl(`VenueDetails?id=${venue.id}`));
      }, 150);
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div>
      <style>{`
        .rolo-machine {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          height: 650px;
          background: #1a1a1a;
          border-radius: 40px;
          position: relative;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 6px solid #222;
        }

        .spindle {
          position: absolute;
          width: 30px;
          height: 90%;
          background: linear-gradient(to right, #000 0%, #444 50%, #000 100%);
          top: 5%;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 15px;
          z-index: 2;
          opacity: 0.9;
          pointer-events: none;
        }

        .rolodex-viewport {
          width: 100%;
          height: 500px;
          overflow-y: scroll;
          perspective: 2000px;
          scroll-snap-type: y mandatory;
          scrollbar-width: none;
          z-index: 10;
          padding-top: 220px;
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
          background: #ffffff;
          margin-bottom: -130px;
          border-radius: 10px;
          padding: 20px;
          box-sizing: border-box;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
          border-top: 12px solid #d32f2f;
          scroll-snap-align: center;
          scroll-snap-stop: always;
          transform-origin: center center -280px;
          position: relative;
          cursor: pointer;
          backface-visibility: hidden;
          transition: background-color 0.2s;
        }

        .card-shadow {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: black;
          opacity: 0;
          border-radius: 10px;
          pointer-events: none;
        }

        .venue-card h3 { margin: 5px 0; color: #111; font-size: 20px; font-weight: 800; }
        .venue-card p { font-size: 14px; color: #444; line-height: 1.4; margin: 0; }
        .view-btn { 
          margin-top: 20px; 
          font-size: 11px; 
          color: #d32f2f; 
          font-weight: bold; 
          letter-spacing: 1px;
        }
      `}</style>

      <div className="rolo-machine">
        <div className="spindle"></div>

        <div 
          className="rolodex-viewport" 
          ref={viewportRef}
          onScroll={updatePhysics}
        >
          <div className="rolodex-stack" ref={stackRef}>
            {venues.length === 0 ? (
              <p style={{color: '#666', marginTop: '50px'}}>No venues found.</p>
            ) : (
              venues.map((venue) => (
                <div 
                  key={venue.id}
                  className="venue-card" 
                  onClick={(e) => handleCardClick(venue, e.currentTarget)}
                >
                  <div className="card-shadow"></div>
                  <h3>{venue.name}</h3>
                  <p>{venue.description ? venue.description.substring(0, 80) + '...' : ''}</p>
                  <div className="view-btn">EXPLORE →</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}