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

      const rotation = dist / 7;
      card.style.transform = `rotateX(${-rotation}deg) translateZ(${Math.abs(rotation) * -1.8}px)`;
      
      if (shadow) {
        shadow.style.opacity = Math.min(Math.abs(dist) / 450, 0.7);
      }

      if (Math.abs(dist) < minDistance) {
        minDistance = Math.abs(dist);
        currentActive = i;
      }
    });

    if (currentActive !== lastActiveIndex) {
      playTick();
      if (navigator.vibrate) navigator.vibrate(10);
      setLastActiveIndex(currentActive);
    }
  };

  const navigate = useNavigate();

  const handleCardClick = (venue, el) => {
    const rect = el.getBoundingClientRect();
    const screenCenter = window.innerHeight / 2;
    if (Math.abs((rect.top + rect.height/2) - screenCenter) < 100) {
      el.style.backgroundColor = "#d32f2f";
      el.style.color = "white";
      setTimeout(() => {
        navigate(createPageUrl(`VenueDetails?id=${venue.id}`));
      }, 200);
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div>
      <style>{`
        .rolo-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 700px;
          overflow: hidden;
          font-family: sans-serif;
        }

        .rolodex-viewport {
          width: 100%;
          height: 500px;
          overflow-y: scroll;
          perspective: 1500px;
          scroll-snap-type: y mandatory;
          scrollbar-width: none;
          padding-top: 200px;
          padding-bottom: 200px;
          mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
        }

        .rolodex-viewport::-webkit-scrollbar { display: none; }

        .rolodex-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          transform-style: preserve-3d;
        }

        .venue-card {
          width: 320px;
          height: 180px;
          background: #ffffff;
          margin-bottom: -110px;
          border-radius: 12px;
          padding: 20px;
          box-sizing: border-box;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border-left: 8px solid #d32f2f;
          scroll-snap-align: center;
          scroll-snap-stop: always;
          transform-origin: center center -250px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }

        .card-shadow {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: black;
          opacity: 0;
          border-radius: 12px;
          pointer-events: none;
        }

        .venue-card h3 { margin: 0 0 5px 0; color: #1a1a1a; }
        .venue-card p { font-size: 14px; color: #555; margin: 0; }
        .view-hint { margin-top: 15px; font-size: 12px; color: #d32f2f; font-weight: bold; }
      `}</style>

      <div className="rolo-wrapper">
        <div 
          className="rolodex-viewport" 
          ref={viewportRef}
          onScroll={updatePhysics}
        >
          <div className="rolodex-stack" ref={stackRef}>
            {venues.length === 0 ? (
              <p>No venues found.</p>
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
                  <div className="view-hint">VIEW DETAILS →</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}