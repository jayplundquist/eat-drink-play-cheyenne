import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Tag, Truck, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'explore', label: 'Explore', icon: MapPin, path: '/', prefixes: [] },
  {
    key: 'garage',
    label: 'Sales',
    icon: Tag,
    path: '/GarageSales',
    prefixes: ['/GarageSales', '/MyGarageSales', '/AddGarageSale', '/GarageSaleDrafts', '/ManageGarageSales', '/ImportGarageSale'],
  },
  {
    key: 'wagons',
    label: 'Wagons',
    icon: Truck,
    path: '/ChuckWagons',
    prefixes: ['/ChuckWagons', '/MyChuckWagon'],
  },
  {
    key: 'favorites',
    label: 'Favorites',
    icon: Heart,
    path: '/Favorites',
    prefixes: ['/Favorites', '/BootFinder', '/BootHighScores'],
  },
  {
    key: 'account',
    label: 'Account',
    icon: User,
    path: '/Profile',
    prefixes: ['/Profile', '/UserProfile', '/Settings'],
  },
];

// Each tab remembers where you last were, so switching tabs returns you there
// and tapping the tab you're already on pops back to its root.
const tabMemory = {};

function activeTabKey(pathname) {
  for (const tab of TABS) {
    if (tab.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return tab.key;
    }
  }
  return 'explore';
}

export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeKey = activeTabKey(location.pathname);

  useEffect(() => {
    tabMemory[activeKey] = `${location.pathname}${location.search}`;
  }, [activeKey, location.pathname, location.search]);

  const handleTabClick = (event, tab) => {
    if (tab.key === activeKey) {
      event.preventDefault();
      navigate(tab.path);
      return;
    }
    const remembered = tabMemory[tab.key];
    if (remembered && remembered !== tab.path) {
      event.preventDefault();
      navigate(remembered);
    }
  };

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-md border-t-2 border-border pb-safe"
    >
      <ul className="flex items-stretch px-1">
        {TABS.map((tab) => {
          const isActive = tab.key === activeKey;
          const Icon = tab.icon;
          return (
            <li key={tab.key} className="flex-1">
              <Link
                to={tab.path}
                onClick={(event) => handleTabClick(event, tab)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-h-[56px] min-w-[44px] px-1 py-2 rounded-lg text-xs font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground active:bg-secondary'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'scale-110')} aria-hidden="true" />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}