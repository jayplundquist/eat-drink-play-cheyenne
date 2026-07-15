import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import VenueDetailsSlug from './pages/VenueDetailsSlug';
import CategoryLanding from './pages/CategoryLanding';
// Internal / admin / app-user pages — kept out of pages.config so the platform's
// public page directory never lists them. Wired here as explicit routes.
import ActivityFeed from './pages/ActivityFeed';
import Analytics from './pages/Analytics';
import EditVenue from './pages/EditVenue';
import Favorites from './pages/Favorites';
import ManageBadges from './pages/ManageBadges';
import ManageBoots from './pages/ManageBoots';
import ManageClaimRequests from './pages/ManageClaimRequests';
import ManageGameSettings from './pages/ManageGameSettings';
import ManageReports from './pages/ManageReports';
import ManageVenueOptions from './pages/ManageVenueOptions';
import ManageVenues from './pages/ManageVenues';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';
import VisitedMap from './pages/VisitedMap';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      {/* Internal / admin / app-user pages — functional but not in the public page registry */}
      <Route path="/ActivityFeed" element={<LayoutWrapper currentPageName="ActivityFeed"><ActivityFeed /></LayoutWrapper>} />
      <Route path="/Analytics" element={<LayoutWrapper currentPageName="Analytics"><Analytics /></LayoutWrapper>} />
      <Route path="/EditVenue" element={<LayoutWrapper currentPageName="EditVenue"><EditVenue /></LayoutWrapper>} />
      <Route path="/Favorites" element={<LayoutWrapper currentPageName="Favorites"><Favorites /></LayoutWrapper>} />
      <Route path="/ManageBadges" element={<LayoutWrapper currentPageName="ManageBadges"><ManageBadges /></LayoutWrapper>} />
      <Route path="/ManageBoots" element={<LayoutWrapper currentPageName="ManageBoots"><ManageBoots /></LayoutWrapper>} />
      <Route path="/ManageClaimRequests" element={<LayoutWrapper currentPageName="ManageClaimRequests"><ManageClaimRequests /></LayoutWrapper>} />
      <Route path="/ManageGameSettings" element={<LayoutWrapper currentPageName="ManageGameSettings"><ManageGameSettings /></LayoutWrapper>} />
      <Route path="/ManageReports" element={<LayoutWrapper currentPageName="ManageReports"><ManageReports /></LayoutWrapper>} />
      <Route path="/ManageVenueOptions" element={<LayoutWrapper currentPageName="ManageVenueOptions"><ManageVenueOptions /></LayoutWrapper>} />
      <Route path="/ManageVenues" element={<LayoutWrapper currentPageName="ManageVenues"><ManageVenues /></LayoutWrapper>} />
      <Route path="/Profile" element={<LayoutWrapper currentPageName="Profile"><Profile /></LayoutWrapper>} />
      <Route path="/Settings" element={<LayoutWrapper currentPageName="Settings"><Settings /></LayoutWrapper>} />
      <Route path="/UserProfile" element={<LayoutWrapper currentPageName="UserProfile"><UserProfile /></LayoutWrapper>} />
      <Route path="/VisitedMap" element={<LayoutWrapper currentPageName="VisitedMap"><VisitedMap /></LayoutWrapper>} />

      {/* High-intent category landing pages for SEO */}
      <Route path="/breakfast" element={<LayoutWrapper currentPageName="CategoryLanding"><CategoryLanding pageKey="breakfast" /></LayoutWrapper>} />
      <Route path="/bars" element={<LayoutWrapper currentPageName="CategoryLanding"><CategoryLanding pageKey="bars" /></LayoutWrapper>} />
      <Route path="/breweries" element={<LayoutWrapper currentPageName="CategoryLanding"><CategoryLanding pageKey="breweries" /></LayoutWrapper>} />
      <Route path="/things-to-do-tonight" element={<LayoutWrapper currentPageName="CategoryLanding"><CategoryLanding pageKey="things-to-do-tonight" /></LayoutWrapper>} />
      <Route path="/greenway-walks" element={<LayoutWrapper currentPageName="CategoryLanding"><CategoryLanding pageKey="greenway-walks" /></LayoutWrapper>} />

      {/* SEO slug-based venue pages: /<category>/<slug> */}
      <Route path="/:category/:slug" element={
        <LayoutWrapper currentPageName="VenueDetails">
          <VenueDetailsSlug />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App