/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ActivityFeed from './pages/ActivityFeed';
import AddVenue from './pages/AddVenue';
import Analytics from './pages/Analytics';
import EditVenue from './pages/EditVenue';
import Favorites from './pages/Favorites';
import ManageBadges from './pages/ManageBadges';
import ManageBoots from './pages/ManageBoots';
import ManageClaimRequests from './pages/ManageClaimRequests';
import ManageGameSettings from './pages/ManageGameSettings';
import ManageVenueOptions from './pages/ManageVenueOptions';
import ManageVenues from './pages/ManageVenues';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';
import VenueDetails from './pages/VenueDetails';
import VisitedMap from './pages/VisitedMap';
import Home from './pages/Home';
import ManageReports from './pages/ManageReports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActivityFeed": ActivityFeed,
    "AddVenue": AddVenue,
    "Analytics": Analytics,
    "EditVenue": EditVenue,
    "Favorites": Favorites,
    "ManageBadges": ManageBadges,
    "ManageBoots": ManageBoots,
    "ManageClaimRequests": ManageClaimRequests,
    "ManageGameSettings": ManageGameSettings,
    "ManageVenueOptions": ManageVenueOptions,
    "ManageVenues": ManageVenues,
    "Profile": Profile,
    "Settings": Settings,
    "UserProfile": UserProfile,
    "VenueDetails": VenueDetails,
    "VisitedMap": VisitedMap,
    "Home": Home,
    "ManageReports": ManageReports,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};