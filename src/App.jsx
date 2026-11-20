import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ThemeProvider from '@/components/ThemeProvider';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PageLoader from '@/components/PageLoader';
// Every route loads its own chunk, so a screen's code is only downloaded when
// it is actually opened.
const VenueDetailsSlug = lazy(() => import('./pages/VenueDetailsSlug'));
const CategoryLanding = lazy(() => import('./pages/CategoryLanding'));
const OAuthConsent = lazy(() => import('./pages/OAuthConsent'));
// Internal / admin / app-user pages — kept out of pages.config so the platform's
// public page directory never lists them. Wired here as explicit routes.
const ActivityFeed = lazy(() => import('./pages/ActivityFeed'));
const Analytics = lazy(() => import('./pages/Analytics'));
const EditVenue = lazy(() => import('./pages/EditVenue'));
const Favorites = lazy(() => import('./pages/Favorites'));
const ManageBadges = lazy(() => import('./pages/ManageBadges'));
const ManageBoots = lazy(() => import('./pages/ManageBoots'));
const ManageClaimRequests = lazy(() => import('./pages/ManageClaimRequests'));
const MyChuckWagon = lazy(() => import('./pages/MyChuckWagon'));
const ChuckWagons = lazy(() => import('./pages/ChuckWagons'));
const ManageChuckWagonStops = lazy(() => import('./pages/ManageChuckWagonStops'));
const BackfillVenueCoords = lazy(() => import('./pages/BackfillVenueCoords'));
const ManageGameSettings = lazy(() => import('./pages/ManageGameSettings'));
const ManageReports = lazy(() => import('./pages/ManageReports'));
const ManageVenueOptions = lazy(() => import('./pages/ManageVenueOptions'));
const ManageVenues = lazy(() => import('./pages/ManageVenues'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const GarageSales = lazy(() => import('./pages/GarageSales'));
const GarageSaleDetail = lazy(() => import('./pages/GarageSaleDetail'));
const AddGarageSale = lazy(() => import('./pages/AddGarageSale'));
const MyGarageSales = lazy(() => import('./pages/MyGarageSales'));
const ManageGarageSales = lazy(() => import('./pages/ManageGarageSales'));
const ImportGarageSale = lazy(() => import('./pages/ImportGarageSale'));
const GarageSaleDrafts = lazy(() => import('./pages/GarageSaleDrafts'));
const About = lazy(() => import('./pages/About'));
const BootFinder = lazy(() => import('./pages/BootFinder'));
const BootHighScores = lazy(() => import('./pages/BootHighScores'));
const Connect = lazy(() => import('./pages/Connect'));
const ManageNotifications = lazy(() => import('./pages/ManageNotifications'));
const ManageFacebookPosts = lazy(() => import('./pages/ManageFacebookPosts'));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'));

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
    return <PageLoader />;
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
    <Suspense fallback={<PageLoader />}>
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

      {/* Chuck wagons — public map, vendor dashboard, admin review of submitted stops */}
      <Route path="/ChuckWagons" element={<LayoutWrapper currentPageName="ChuckWagons"><ChuckWagons /></LayoutWrapper>} />
      <Route path="/MyChuckWagon" element={<LayoutWrapper currentPageName="MyChuckWagon"><MyChuckWagon /></LayoutWrapper>} />
      <Route path="/ManageChuckWagonStops" element={<LayoutWrapper currentPageName="ManageChuckWagonStops"><ManageChuckWagonStops /></LayoutWrapper>} />
      <Route path="/BackfillVenueCoords" element={<LayoutWrapper currentPageName="BackfillVenueCoords"><BackfillVenueCoords /></LayoutWrapper>} />

      {/* Garage Sale Map — public browsing, no login required */}
      <Route path="/GarageSales" element={<LayoutWrapper currentPageName="GarageSales"><GarageSales /></LayoutWrapper>} />
      <Route path="/GarageSales/:slug" element={<LayoutWrapper currentPageName="GarageSaleDetail"><GarageSaleDetail /></LayoutWrapper>} />
      <Route path="/AddGarageSale" element={<LayoutWrapper currentPageName="AddGarageSale"><AddGarageSale /></LayoutWrapper>} />
      <Route path="/MyGarageSales" element={<LayoutWrapper currentPageName="MyGarageSales"><MyGarageSales /></LayoutWrapper>} />
      <Route path="/ManageGarageSales" element={<LayoutWrapper currentPageName="ManageGarageSales"><ManageGarageSales /></LayoutWrapper>} />
      <Route path="/ImportGarageSale" element={<LayoutWrapper currentPageName="ImportGarageSale"><ImportGarageSale /></LayoutWrapper>} />
      <Route path="/GarageSaleDrafts" element={<LayoutWrapper currentPageName="GarageSaleDrafts"><GarageSaleDrafts /></LayoutWrapper>} />

      {/* About / Magic City story page */}
      <Route path="/about" element={<LayoutWrapper currentPageName="About"><About /></LayoutWrapper>} />

      {/* Big Boot Finder — standalone map + checklist, separated from Profile */}
      <Route path="/BootFinder" element={<LayoutWrapper currentPageName="BootFinder"><BootFinder /></LayoutWrapper>} />
      <Route path="/BootHighScores" element={<LayoutWrapper currentPageName="BootHighScores"><BootHighScores /></LayoutWrapper>} />

      {/* Connect AI assistant — MCP setup instructions for end users */}
      <Route path="/connect" element={<LayoutWrapper currentPageName="Connect"><Connect /></LayoutWrapper>} />

      {/* Notification campaign admin — review/edit/approve weekly campaigns */}
      <Route path="/ManageNotifications" element={<LayoutWrapper currentPageName="ManageNotifications"><ManageNotifications /></LayoutWrapper>} />

      {/* Facebook post admin — review auto-composed posts, compose from prompts, publish manually */}
      <Route path="/ManageFacebookPosts" element={<LayoutWrapper currentPageName="ManageFacebookPosts"><ManageFacebookPosts /></LayoutWrapper>} />

      {/* Public unsubscribe page — linked from campaign emails, no login required */}
      <Route path="/unsubscribe" element={<Unsubscribe />} />

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
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeProvider>
        <Router>
          <NavigationTracker />
          {/* OAuth consent for the app's MCP server — mounted outside the auth
              guard so the page can handle the signed-out case and preserve ctx. */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/oauth/consent" element={<OAuthConsent />} />
            </Routes>
          </Suspense>
          <AuthenticatedApp />
        </Router>
        </ThemeProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App