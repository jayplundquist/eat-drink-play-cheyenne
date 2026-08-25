import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, UtensilsCrossed, Beer, Music, Sparkles } from 'lucide-react';

const SECTIONS = [
  {
    icon: UtensilsCrossed,
    kicker: 'EAT',
    title: 'A City Built on Hospitality',
    paragraphs: [
      'A booming railroad town needed to feed a lot of people, quickly.',
      'Restaurants, hotel dining rooms, bakeries, cafés, boarding houses, and other food businesses became part of the young city\'s rhythm almost immediately.',
      'Food wasn\'t just fuel. It was where travelers stopped, workers gathered, deals were discussed, and newcomers found a little comfort on the frontier.',
      'That tradition never really disappeared.',
      'Today, Cheyenne\'s food scene ranges from longtime local favorites and food trucks to steakhouses, cafés, bakeries, international restaurants, and places still putting their own spin on the West.',
      'Different century. Same idea: pull up a chair.',
    ],
  },
  {
    icon: Beer,
    kicker: 'DRINK',
    title: 'The Original Social Network',
    paragraphs: [
      'In early Cheyenne, saloons and gathering places were more than somewhere to get a drink.',
      'They were places to meet people, hear news, make deals, celebrate, argue, tell stories, and become part of a rapidly growing community.',
      'They helped provide the social heartbeat of a city that seemed to have appeared from nowhere.',
      'Today the setting has changed, but the role hasn\'t entirely.',
      'Breweries, bars, coffee shops, taprooms, cocktail spots, and neighborhood hangouts are still places where Cheyenne comes together.',
      'The drinks may have changed. The gathering hasn\'t.',
    ],
  },
  {
    icon: Music,
    kicker: 'PLAY',
    title: 'Cheyenne Has Always Known How to Have a Good Time',
    paragraphs: [
      'The new railroad town didn\'t just work hard.',
      'It played hard too.',
      'Entertainment became part of Cheyenne\'s identity early on, with theaters, music, social halls, celebrations, sporting events, and a nightlife that drew people from around the region.',
      'That appetite for a good time grew with the city.',
      'Eventually, it helped produce traditions such as Cheyenne Frontier Days, while the modern city added live music, festivals, outdoor recreation, trails, public art, museums, local events, shopping, and countless other ways to get out and experience Cheyenne.',
      'Today, "Play" can mean almost anything.',
    ],
    list: [
      'Ride the Greenway.',
      'Hunt for the Big Boots.',
      'Catch a show.',
      'Explore downtown.',
      'Find a garage sale.',
      'Try somewhere you\'ve never been.',
      'Or just let Spin the Spur decide where the day takes you.',
    ],
  },
];

export default function About() {
  useEffect(() => {
    document.title = 'Why Cheyenne Is the Magic City — Eat, Drink, Play Cheyenne';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Born fast in 1867 along the Union Pacific, Cheyenne earned its nickname — the Magic City of the Plains. Discover the story behind Eat, Drink, Play Cheyenne.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Hero header */}
      <div className="relative overflow-hidden text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("https://assets.simpleviewinc.com/simpleview/image/upload/c_fill,f_jpg,h_536,q_65,w_1440/v1/clients/cheyenne/Downtown_Historic_Photo_2045b6a9-c35a-4340-a113-f9545329e3ef.png")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/65 to-black/75" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-40 pb-20 sm:pt-48 sm:pb-24">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-amber-200 hover:text-amber-100 transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to exploring
          </Link>
          <p className="text-amber-300 text-sm sm:text-base uppercase tracking-[0.25em] mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
            Why Cheyenne Is the
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white"
            style={{ fontFamily: 'Rye, serif', textShadow: '3px 3px 6px rgba(0,0,0,0.5)', letterSpacing: '0.04em' }}
          >
            Magic City
          </h1>
          <p className="text-amber-100 text-lg sm:text-xl mt-6" style={{ fontFamily: 'Merriweather, serif', textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
            Born Fast. Built to Gather. Still Ready to Play.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-[15px] sm:text-base">
        {/* Intro */}
        <section className="prose-custom">
          <p className="text-xl text-amber-900 font-semibold mb-6" style={{ fontFamily: 'Merriweather, serif' }}>
            Cheyenne didn&rsquo;t slowly grow into a city.
          </p>
          <p className="text-xl text-amber-900 font-semibold mb-8" style={{ fontFamily: 'Merriweather, serif' }}>
            It arrived.
          </p>
          <p className="text-stone-700 leading-relaxed mb-4">
            In 1867, as the Union Pacific Railroad pushed west across the plains, Cheyenne sprang up almost overnight. Workers, soldiers, merchants, gamblers, cowboys, travelers, and fortune-seekers poured into the new town.
          </p>
          <p className="text-stone-700 leading-relaxed mb-4">
            Buildings went up. Businesses opened. Streets filled.
          </p>
          <p className="text-stone-700 leading-relaxed mb-4">
            Cheyenne grew so quickly that it earned a nickname that has stuck for more than 150 years:
          </p>
          <p className="text-2xl text-amber-800 font-bold text-center my-8" style={{ fontFamily: 'Rye, serif' }}>
            The Magic City of the Plains
          </p>
          <p className="text-stone-700 leading-relaxed mb-4">
            And from the very beginning, much of that magic revolved around three things:
          </p>
          <p className="text-stone-700 leading-relaxed mb-4">
            Eating. Drinking. Playing.
          </p>
          <p className="text-stone-700 leading-relaxed">
            That is where Eat Drink Play Cheyenne comes from.
          </p>
        </section>

        {/* EAT / DRINK / PLAY sections */}
        <div className="mt-16 space-y-16">
          {SECTIONS.map(({ icon: Icon, kicker, title, paragraphs, list }) => (
            <section key={kicker} className="border-t-2 border-amber-200 pt-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-800 text-amber-50 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-[0.25em] text-amber-700 uppercase">{kicker}</p>
                  <h2 className="text-2xl sm:text-3xl text-amber-900 leading-tight" style={{ fontFamily: 'Rye, serif' }}>
                    {title}
                  </h2>
                </div>
              </div>
              <div className="space-y-4 pl-0 sm:pl-15">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-stone-700 leading-relaxed">{p}</p>
                ))}
                {list && (
                  <ul className="mt-6 space-y-2">
                    {list.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-700">
                        <span className="text-amber-700 mt-1 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* The magic is still here */}
        <section className="mt-20 border-t-4 border-amber-800 pt-12">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-7 h-7 text-amber-600" />
            <h2 className="text-3xl sm:text-4xl text-amber-900" style={{ fontFamily: 'Rye, serif' }}>
              The Magic Is Still Here
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-stone-700 leading-relaxed">Cheyenne isn&rsquo;t the same city it was in 1867.</p>
            <p className="text-stone-700 leading-relaxed">It shouldn&rsquo;t be.</p>
            <p className="text-stone-700 leading-relaxed">But the energy behind the nickname still feels familiar.</p>
            <p className="text-stone-700 leading-relaxed">People are still arriving.</p>
            <p className="text-stone-700 leading-relaxed">People are still opening businesses.</p>
            <p className="text-stone-700 leading-relaxed">People are still gathering around food and drinks.</p>
            <p className="text-stone-700 leading-relaxed">People are still looking for something fun to do.</p>
            <p className="text-stone-700 leading-relaxed">And sometimes the best parts of Cheyenne are the places you didn&rsquo;t know were there.</p>
          </div>

          <div className="mt-12 p-8 rounded-lg bg-gradient-to-br from-amber-900 to-stone-900 text-center">
            <p className="text-2xl sm:text-3xl text-amber-100 mb-3" style={{ fontFamily: 'Rye, serif' }}>
              Eat. Drink. Play. Explore Cheyenne.
            </p>
            <p className="text-amber-300 text-lg" style={{ fontFamily: 'Merriweather, serif' }}>
              The Magic City is still here.
            </p>
            <p className="text-amber-300 text-lg" style={{ fontFamily: 'Merriweather, serif' }}>
              You just have to know where to look.
            </p>
            <Link
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
            >
              Start Exploring
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}