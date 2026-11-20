/**
 * pages.config.js - Page routing configuration
 *
 * Only PUBLIC, crawlable pages are registered here. These are the pages the
 * Base44 platform exposes in its auto-generated public page directory and
 * sitemap (the "Pages" list seen by crawlers).
 *
 * Internal / admin / app-user pages are intentionally NOT registered here.
 * They are wired as explicit <Route> elements in App.jsx so they remain
 * fully functional for logged-in users but are never exposed in the public
 * page registry. Layout.jsx also applies `noindex, nofollow` to them.
 *
 * Pages are loaded with React.lazy so each one ships in its own chunk.
 * THE ONLY EDITABLE VALUE: mainPage (which page loads at "/").
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const Home = lazy(() => import('./pages/Home'));
const AddVenue = lazy(() => import('./pages/AddVenue'));
const GreenwayGuide = lazy(() => import('./pages/GreenwayGuide'));
const GreenwayInfo = lazy(() => import('./pages/GreenwayInfo'));
const SuperBowlWatchParty = lazy(() => import('./pages/SuperBowlWatchParty'));
const VenueDetails = lazy(() => import('./pages/VenueDetails'));


export const PAGES = {
    "Home": Home,
    "AddVenue": AddVenue,
    "GreenwayGuide": GreenwayGuide,
    "GreenwayInfo": GreenwayInfo,
    "SuperBowlWatchParty": SuperBowlWatchParty,
    "VenueDetails": VenueDetails,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};