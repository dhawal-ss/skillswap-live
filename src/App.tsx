import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DiscoveryBoard } from './components/DiscoveryBoard';
import { SessionRoom } from './components/SessionRoom';
import { FeedbackSheet } from './components/FeedbackSheet';
import { ClipFeed } from './components/ClipFeed';
import { ChannelHub } from './components/ChannelHub';
import { requestMatch } from './services/matchmaking';
import { clipService } from './services/clips';
import { trackEvent } from './services/analytics';
import {
  fetchClips,
  fetchClipComments,
  fetchCreators,
  fetchSessions,
} from './services/api';
import type {
  ClipComment,
  CreatorProfile,
  SessionCard,
  SkillClip,
  SkillTag,
  UserProfile,
  AuthUser,
} from './types';
import { UserProfilePanel } from './components/UserProfilePanel';
import { Logo } from './components/Logo';
import { MissionHero } from './components/MissionHero';
import { SignInDialog } from './components/SignInDialog';
import { PageTransition } from './components/PageTransition';
import { GuidedTour } from './components/GuidedTour';
import { filterSessions } from './lib/filtering';
import { SESSION_VIDEO_PLACEHOLDER, CLIP_VIDEO_PLACEHOLDER } from './lib/media';
import { orderedSkillTags, formatSkillTag } from './lib/tagLabels';

type TagAffinityMap = Partial<Record<SkillTag, number>>;

const phases = ['landing', 'onboarding', 'discovery', 'session', 'feedback'] as const;
type Phase = (typeof phases)[number];
const discoveryViews = ['sessions', 'clips', 'channels', 'profile'] as const;
type DiscoveryView = (typeof discoveryViews)[number];
const navViews: DiscoveryView[] = ['sessions', 'clips', 'channels'];
const categoryOptions: SkillTag[] = orderedSkillTags;

type FeedbackPayload = {
  rating: number;
  tags: string[];
  notes: string;
  session?: SessionCard | null;
};

type SessionDraft = {
  title: string;
  tag: SkillTag;
  startTime: string;
  duration: number;
  level: SessionCard['level'];
  status: SessionCard['status'];
  blurb: string;
};

type ClipDraft = {
  title: string;
  tag: SkillTag;
  previewUrl: string;
  duration: number;
  videoUrl?: string;
};

type ActivityEntry = {
  id: string;
  label: string;
  detail?: string;
  tag?: SkillTag;
  icon?: string;
  timestamp: string;
};

function PhaseIndicator({ phase }: { phase: Phase }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        marginTop: 16,
      }}
    >
      {phases.map((item) => (
        <span
          key={item}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: phase === item ? 'var(--color-phase-active)' : 'var(--color-phase-muted)',
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSession, setActiveSession] = useState<SessionCard | null>(null);
  const [feedback, setFeedback] = useState<FeedbackPayload | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [homeView, setHomeView] = useState<DiscoveryView>('sessions');
  const [clipViewMode, setClipViewMode] = useState<'all' | 'saved'>('all');
  const [savedClipIds, setSavedClipIds] = useState<string[]>([]);
  const [focusedClipId, setFocusedClipId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SkillTag>('all');
  const [sessionsStore, setSessionsStore] = useState<SessionCard[]>([]);
  const [clipStore, setClipStore] = useState<SkillClip[]>([]);
  const [creatorStore, setCreatorStore] = useState<CreatorProfile[]>([]);
  const [commentStore, setCommentStore] = useState<ClipComment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [userSessions, setUserSessions] = useState<SessionCard[]>([]);
  const [userClips, setUserClips] = useState<SkillClip[]>([]);
  const [affinityMap, setAffinityMap] = useState<TagAffinityMap>({});
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const [showClipComposer, setShowClipComposer] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const seededRef = useRef(false);
  const tourTriggeredRef = useRef(false);
  const tourStorageKey = authUser ? `skillswap-tour-complete-${authUser.id}` : null;
  const savedClips = clipStore.filter((clip) => savedClipIds.includes(clip.id));
  const launchTour = useCallback(() => {
    tourTriggeredRef.current = true;
    setTourStep(0);
    setTourVisible(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    tourTriggeredRef.current = false;
  }, [authUser?.id]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const storedPreference = window.localStorage.getItem('skillswap-theme');
    if (storedPreference === 'light' || storedPreference === 'dark') {
      return storedPreference;
    }
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    return mediaQuery?.matches ? 'dark' : 'light';
  });
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollRef = useRef(0);
  const persistProfile = useCallback((user: AuthUser, nextProfile: UserProfile) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(`skillswap-profile-${user.id}`, JSON.stringify(nextProfile));
  }, []);

  const loadProfileForUser = useCallback(
    (user: AuthUser) => {
      if (typeof window === 'undefined') return false;
      const storedProfile = window.localStorage.getItem(`skillswap-profile-${user.id}`);
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile) as UserProfile;
          setProfile(parsed);
          setPhase('discovery');
          return true;
        } catch (error) {
          console.error('Failed to parse stored profile', error);
        }
      }
      setProfile(null);
      setPhase('onboarding');
      return false;
    },
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUser = window.localStorage.getItem('skillswap-auth-user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        setAuthUser(parsed);
        loadProfileForUser(parsed);
      } catch (error) {
        console.error('Failed to restore auth user', error);
      }
    }
  }, [loadProfileForUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (authUser) {
      window.localStorage.setItem('skillswap-auth-user', JSON.stringify(authUser));
      loadProfileForUser(authUser);
      const savedKey = `skillswap-saved-${authUser.id}`;
      const savedRaw = window.localStorage.getItem(savedKey);
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw) as string[];
          setSavedClipIds(parsed);
        } catch {
          setSavedClipIds([]);
        }
      } else {
        setSavedClipIds([]);
      }
    } else {
      window.localStorage.removeItem('skillswap-auth-user');
      setSavedClipIds([]);
      setClipViewMode('all');
    }
  }, [authUser, loadProfileForUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!authUser || !tourStorageKey) return;
    if (phase !== 'discovery') return;
    if (window.localStorage.getItem(tourStorageKey)) return;
    if (tourTriggeredRef.current) return;
    tourTriggeredRef.current = true;
    const timer = window.setTimeout(() => {
      launchTour();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [phase, authUser, tourStorageKey, launchTour]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('skillswap-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      const current = window.scrollY;
      const previous = lastScrollRef.current;
      lastScrollRef.current = current;

      if (current <= 0) {
        setNavHidden(false);
        return;
      }

      if (current > previous && current > 80) {
        setNavHidden(true);
      } else if (current < previous) {
        setNavHidden(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [sessions, creators, clips, comments] = await Promise.all([
          fetchSessions(),
          fetchCreators(),
          fetchClips(),
          fetchClipComments(),
        ]);
        setSessionsStore(sessions);
        setCreatorStore(creators);
        setClipStore(clips);
        setCommentStore(comments);
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!profile || seededRef.current) return;
    if (profile.teachTags.length === 0) return;
    setUserSessions(seedSessionsFromProfile(profile));
    setUserClips(seedClipsFromProfile(profile));
    seededRef.current = true;
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setAffinityMap(() => {
      const base: TagAffinityMap = {};
      profile.learnTags.forEach((tag) => {
        base[tag] = (base[tag] ?? 0) + 2;
      });
      profile.teachTags.forEach((tag) => {
        base[tag] = (base[tag] ?? 0) + 1;
      });
      return base;
    });
  }, [profile]);

  useEffect(() => {
    if (authUser && profile) {
      persistProfile(authUser, profile);
    }
  }, [authUser, profile, persistProfile]);

  const bumpAffinity = useCallback((tag: SkillTag, amount = 1) => {
    setAffinityMap((prev) => ({
      ...prev,
      [tag]: (prev[tag] ?? 0) + amount,
    }));
  }, []);

  const decreaseAffinity = useCallback((tag: SkillTag, amount = 1) => {
    setAffinityMap((prev) => ({
      ...prev,
      [tag]: Math.max((prev[tag] ?? 0) - amount, 0),
    }));
  }, []);

  const recordActivity = useCallback(
    (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
      const next: ActivityEntry = {
        ...entry,
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      setActivityLog((prev) => [next, ...prev].slice(0, 20));
    },
    [],
  );

  const personalizedSessions = useMemo(() => {
    if (!profile) return sessionsStore;
    return sessionsStore.map((session) => {
      if (profile.learnTags.includes(session.tag)) {
        return { ...session, rating: Math.min(5, session.rating + 0.1) };
      }
      return session;
    });
  }, [profile, sessionsStore]);

  const filteredSessions = useMemo(() => {
    const filtered = filterSessions(personalizedSessions, {
      searchQuery,
      categoryFilter,
    });
    return [...filtered].sort((a, b) => (affinityMap[b.tag] ?? 0) - (affinityMap[a.tag] ?? 0));
  }, [personalizedSessions, categoryFilter, searchQuery, affinityMap]);

  const highlightTag = useMemo<SkillTag | null>(() => {
    const entries = Object.entries(affinityMap) as [SkillTag, number][];
    if (!entries.length) return null;
    const [tag, score] =
      entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0] ?? [null, 0];
    if (!tag || !score) return null;
    return tag;
  }, [affinityMap]);

  const handleTuneTag = useCallback(
    (tag: SkillTag, intent: 'more' | 'less') => {
      if (intent === 'less') {
        decreaseAffinity(tag, 1.5);
        recordActivity({
          icon: '⚖️',
          label: `Show less ${tag}`,
          detail: 'Preference updated',
          tag,
        });
      } else {
        bumpAffinity(tag, 1.5);
        recordActivity({
          icon: '⭐',
          label: `Show more ${tag}`,
          detail: 'Preference updated',
          tag,
        });
      }
    },
    [bumpAffinity, decreaseAffinity, recordActivity],
  );

  const handleSelectCategory = useCallback(
    (value: 'all' | SkillTag) => {
      setCategoryFilter(value);
      if (value !== 'all') {
        bumpAffinity(value, 0.5);
        recordActivity({
          icon: '🔎',
          label: `Exploring ${value}`,
          detail: 'Tuning recommendations',
          tag: value,
        });
      }
    },
    [bumpAffinity, recordActivity],
  );

  const handleOnboardingComplete = useCallback(
    (nextProfile: UserProfile) => {
      setProfile(nextProfile);
      if (authUser) {
        persistProfile(authUser, nextProfile);
      }
      setPhase('discovery');
      recordActivity({
        icon: '✨',
        label: 'Onboarding complete',
        detail: `Ready to learn ${nextProfile.learnTags.join(', ')}`,
      });
    },
    [authUser, persistProfile, recordActivity],
  );

  const handleToggleSaveClip = useCallback(
    async (clipId: string, next: boolean) => {
      setSavedClipIds((prev) => {
        const set = new Set(prev);
        if (next) {
          set.add(clipId);
        } else {
          set.delete(clipId);
        }
        const result = Array.from(set);
        if (typeof window !== 'undefined' && authUser) {
          window.localStorage.setItem(`skillswap-saved-${authUser.id}`, JSON.stringify(result));
        }
        return result;
      });
      recordActivity({
        icon: next ? '📌' : '🗂️',
        label: next ? 'Saved a clip' : 'Removed saved clip',
        detail: next ? 'Pinned for later' : 'Unpinned from saved',
      });
      trackEvent(next ? 'clip.saved' : 'clip.unsaved', { clipId, count: savedClipIds.length });
      try {
        await clipService.toggleSave(clipId, next);
      } catch (error) {
        console.error('Failed to sync clip save', error);
      }
    },
    [authUser, recordActivity, savedClipIds.length],
  );

  const tourSteps = useMemo(
    () => [
      {
        title: 'Navigate everything',
        body: 'Use the top pills to jump between Sessions, Clips, and Channels.',
        targetSelector: '[data-tour-id="nav-pills"]',
      },
      {
        title: 'Discover creators',
        body: 'Check the “Creators to follow” rail for short clips from trending teachers.',
        targetSelector: '[data-tour-id="highlight-creators"]',
      },
      {
        title: 'Share your expertise',
        body: 'Open your profile to publish clips or schedule sessions for the community.',
        targetSelector: '[data-tour-id="profile-link"]',
      },
    ],
    [],
  );

  const closeTour = useCallback(() => {
    setTourVisible(false);
    tourTriggeredRef.current = true;
    if (typeof window !== 'undefined' && tourStorageKey) {
      window.localStorage.setItem(tourStorageKey, '1');
    }
  }, [tourStorageKey]);

  const handleTourNext = useCallback(() => {
    setTourStep((prev) => {
      if (prev >= tourSteps.length - 1) {
        closeTour();
        return prev;
      }
      return prev + 1;
    });
  }, [closeTour, tourSteps]);

  const showDiscovery = phase === 'discovery';
  const showSession = phase === 'session' && activeSession;
  const showFeedback = phase === 'feedback' && activeSession;
  const isLoadingContent = loadingData;

  const handleSessionStart = async (session: SessionCard) => {
    setIsMatching(true);
    setStatusMessage('Bringing in your host…');
    const confirmed = await requestMatch(session);
    setActiveSession(confirmed);
    setPhase('session');
    setIsMatching(false);
    setStatusMessage(null);
    bumpAffinity(session.tag, 1.5);
    recordActivity({
      icon: '🎥',
      label: `Joined ${session.title}`,
      detail: `Live ${session.tag} session`,
      tag: session.tag,
    });
  };

  const handleJoinById = async (sessionId: string) => {
    const session = personalizedSessions.find((item) => item.id === sessionId);
    if (session) {
      await handleSessionStart(session);
    }
  };

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const handleCreateSession = (draft: SessionDraft) => {
    if (!profile) return;
    const session: SessionCard = {
      id: `user-session-${Date.now()}`,
      title: draft.title,
      tag: draft.tag,
      host: profile.name,
      hostAvatar:
        profile.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
      language: profile.learnTags[0] ?? 'English',
      startTime: draft.startTime || 'TBD',
      duration: draft.duration,
      level: draft.level,
      rating: 4.9,
      status: draft.status,
      blurb: draft.blurb || 'Live exchange hosted by you.',
    };
    setUserSessions((prev) => [session, ...prev]);
    recordActivity({
      icon: '🗓',
      label: `Scheduled ${draft.title}`,
      detail: `Hosting a ${draft.tag} exchange`,
      tag: draft.tag,
    });
  };

  const handleCreateClip = async (draft: ClipDraft) => {
    const uploaded = await clipService.uploadDraft({
      title: draft.title,
      tag: draft.tag,
      previewUrl: draft.previewUrl,
      duration: draft.duration,
      videoUrl: draft.videoUrl,
    });
    const clip: SkillClip = {
      ...uploaded,
      ctaSessionId: userSessions[0]?.id,
    };
    setUserClips((prev) => [clip, ...prev]);
    recordActivity({
      icon: '🎬',
      label: `Published clip: ${draft.title}`,
      detail: `Shared a ${draft.tag} tip`,
      tag: draft.tag,
    });
    setShowClipComposer(false);
  };

  const handleSignOut = useCallback(() => {
    setAuthUser(null);
    setProfile(null);
    setPhase('landing');
    setActivityLog([]);
    setUserClips([]);
    setUserSessions([]);
    setSavedClipIds([]);
    setClipViewMode('all');
    seededRef.current = false;
    tourTriggeredRef.current = false;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('skillswap-auth-user');
    }
  }, []);

  const handleWatchClip = useCallback(
    (clipId: string) => {
      setPhase('discovery');
      setHomeView('clips');
      setClipViewMode('all');
      setFocusedClipId(clipId);
      setSearchQuery('');
      setCategoryFilter('all');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [],
  );

  if (phase === 'landing' && !authUser) {
    return (
      <main>
        <MissionHero
          onBegin={() => {
            setShowSignIn(true);
          }}
        />
        <SignInDialog
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          onSubmit={({ name, email, provider, age }) => {
            const user: AuthUser = {
              id: email,
              name,
              email,
              provider,
              age,
            };
            setAuthUser(user);
            setShowSignIn(false);
            const hasProfile = loadProfileForUser(user);
            setPhase(hasProfile ? 'discovery' : 'onboarding');
          }}
        />
      </main>
    );
  }

  if (!authUser) {
    return null;
  }

  if (!profile || phase === 'onboarding') {
    return (
      <main>
        <OnboardingFlow defaultName={authUser.name} onComplete={handleOnboardingComplete} />
        <PhaseIndicator phase="onboarding" />
      </main>
    );
  }

  let viewContent: ReactNode = null;

  if (showDiscovery) {
    if (homeView === 'sessions') {
      viewContent = (
        <DiscoveryBoard
          profile={profile}
          sessions={filteredSessions}
          isMatching={isMatching}
          featuredClips={clipStore.slice(0, 3)}
          onOpenClips={() => {
            setHomeView('clips');
            setClipViewMode('all');
          }}
          onJoin={(session) => handleSessionStart(session)}
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
          isLoading={isLoadingContent}
          creators={creatorStore}
          onTuneTag={handleTuneTag}
          onWatchClip={(clip) => handleWatchClip(clip.id)}
        />
      );
    } else if (homeView === 'clips') {
      viewContent = (
        <ClipFeed
          clips={clipStore}
          creators={creatorStore}
          comments={commentStore}
          sessions={personalizedSessions}
          onJoinSession={(sessionId) => handleJoinById(sessionId)}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          isLoading={isLoadingContent}
          affinity={affinityMap}
          highlightTag={highlightTag}
          onTuneTag={handleTuneTag}
          onCreateClip={handleCreateClip}
          showComposer={showClipComposer}
          onToggleComposer={() => setShowClipComposer((prev) => !prev)}
          availableTags={categoryOptions}
          savedClipIds={savedClipIds}
          savedOnly={clipViewMode === 'saved'}
          onToggleSave={(clipId, next) => handleToggleSaveClip(clipId, next)}
          focusClipId={focusedClipId}
          onFocusClipClear={() => setFocusedClipId(null)}
        />
      );
    } else if (homeView === 'channels') {
      viewContent = (
        <ChannelHub
          creators={creatorStore}
          clips={clipStore}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          isLoading={isLoadingContent}
        />
      );
    } else if (homeView === 'profile') {
      viewContent = (
        <UserProfilePanel
          profile={profile}
          sessions={userSessions}
          clips={userClips}
          savedClips={savedClips}
          savedClipIds={savedClipIds}
          availableTags={categoryOptions}
          onProfileUpdate={handleProfileUpdate}
          onCreateSession={handleCreateSession}
          onCreateClip={handleCreateClip}
          activityLog={activityLog}
        />
      );
    }
  } else if (showSession && activeSession) {
    viewContent = (
      <SessionRoom
        session={activeSession}
        onLeave={() => {
          setPhase('feedback');
        }}
      />
    );
  } else if (showFeedback && activeSession) {
    viewContent = (
      <FeedbackSheet
        session={activeSession}
        onSubmit={(payload) => {
          setFeedback({ ...payload, session: activeSession });
          setPhase('discovery');
          setActiveSession(null);
        }}
      />
    );
  }

  const transitionedContent = viewContent ? (
    <PageTransition keyProp={`${phase}-${homeView}-${showSession}-${showFeedback}`}>
      {viewContent}
    </PageTransition>
  ) : null;

  return (
    <main>
      <AppShell
        theme={theme}
        phase={phase}
        profile={profile}
        authUser={authUser!}
        feedback={feedback}
        statusMessage={statusMessage}
        homeView={homeView}
        onReturnHome={() => {
          setPhase('discovery');
          setActiveSession(null);
          setHomeView('sessions');
          setSearchQuery('');
          setCategoryFilter('all');
          setClipViewMode('all');
        }}
        onSelectView={(view) => {
          setPhase('discovery');
          setHomeView(view);
          setClipViewMode('all');
        }}
        onProfileClick={() => {
          setPhase('discovery');
          setHomeView('profile');
          setClipViewMode('all');
        }}
        onOpenSavedClips={() => {
          setPhase('discovery');
          setHomeView('clips');
          setSearchQuery('');
          setCategoryFilter('all');
          setClipViewMode('saved');
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categoryOptions}
        selectedCategory={categoryFilter}
        onSelectCategory={handleSelectCategory}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        isLoadingContent={isLoadingContent}
        navHidden={navHidden}
        onSignOut={handleSignOut}
      >
        {transitionedContent}
      </AppShell>
      {showDiscovery && homeView !== 'profile' && (
        <QuickActionFab
          label="Jump to Sessions"
          onClick={() => {
            setHomeView('sessions');
            setClipViewMode('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
      {tourVisible && (
        <GuidedTour
          steps={tourSteps}
          current={tourStep}
          onNext={handleTourNext}
          onSkip={closeTour}
        />
      )}
      <PhaseIndicator phase={phase} />
    </main>
  );
}

const userMenuItemStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  padding: '8px 12px',
  borderRadius: 12,
  cursor: 'pointer',
  color: 'var(--color-text-primary)',
  fontWeight: 500,
};

function AppShell({
  children,
  theme,
  phase,
  profile,
  authUser,
  feedback,
  statusMessage,
  homeView,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  onReturnHome,
  onProfileClick,
  onOpenSavedClips,
  onSelectView,
  onToggleTheme,
  isLoadingContent,
  navHidden,
  onSignOut,
}: {
  children: ReactNode;
  theme: 'light' | 'dark';
  phase: Phase;
  profile: UserProfile;
  authUser: AuthUser;
  feedback: FeedbackPayload | null;
  statusMessage: string | null;
  homeView: DiscoveryView;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: SkillTag[];
  selectedCategory: 'all' | SkillTag;
  onSelectCategory: (value: 'all' | SkillTag) => void;
  onReturnHome: () => void;
  onProfileClick: () => void;
  onOpenSavedClips: () => void;
  onSelectView: (view: DiscoveryView) => void;
  onToggleTheme: () => void;
  isLoadingContent: boolean;
  navHidden: boolean;
  onSignOut: () => void;
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (userMenuRef.current.contains(event.target as Node)) return;
      setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [homeView, phase]);

  return (
    <div>
      <nav
        className={`app-nav ${navHidden ? 'app-nav--hidden' : ''}`}
        style={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-nav-border)',
          background: 'var(--color-nav-glass)',
        }}
      >
        <div className="app-nav__left">
          <Logo tagline="Beta" />
        </div>
        <div className="app-nav__controls">
          {phase === 'discovery' && homeView !== 'profile' && (
            <input
              className="app-nav__search nav-focusable"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search hosts, clips, sessions"
              style={{
                borderRadius: 999,
                border: '1px solid var(--color-border-strong)',
                padding: '8px 16px',
                minWidth: 220,
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
          )}
          {phase === 'discovery' ? (
            <div
              data-tour-id="nav-pills"
              style={{
                display: 'flex',
                gap: 8,
                background: 'var(--color-pill-bg)',
                padding: 6,
                borderRadius: 999,
              }}
            >
              {navViews.map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => onSelectView(view)}
                  aria-label={`Show ${view} view`}
                  aria-pressed={homeView === view}
                  className="nav-focusable"
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '6px 18px',
                    background: homeView === view ? 'var(--color-brand)' : 'transparent',
                    color: homeView === view ? 'var(--color-contrast-on-accent)' : 'var(--color-brand)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={onReturnHome}
              style={{
                borderRadius: 999,
                border: '1px solid var(--color-text-primary)',
                background: 'var(--color-text-primary)',
                color: 'var(--color-contrast-on-accent)',
                padding: '8px 18px',
                cursor: 'pointer',
              }}
            >
              Back to Discover
            </button>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-pressed={theme === 'dark'}
            className="nav-focusable"
            style={{
              borderRadius: 999,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <span aria-hidden="true">{theme === 'dark' ? '🌙' : '☀️'}</span>
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="nav-focusable"
              data-tour-id="profile-link"
              data-testid="user-menu-trigger"
              aria-expanded={userMenuOpen}
              style={{
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                padding: '8px 16px',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <span>{authUser.name}</span>
              <span aria-hidden="true" style={{ fontSize: 12 }}>
                ▾
              </span>
            </button>
            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  minWidth: 180,
                  border: '1px solid var(--color-border)',
                  borderRadius: 16,
                  background: 'var(--color-surface)',
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)',
                  display: 'grid',
                  padding: 8,
                  zIndex: 99,
                }}
                data-testid="user-menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onProfileClick();
                  }}
                  style={userMenuItemStyle}
                >
                  View profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenSavedClips();
                  }}
                  style={userMenuItemStyle}
                >
                  Saved clips
                </button>
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '6px 0' }} />
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onSignOut();
                  }}
                  style={{ ...userMenuItemStyle, color: 'var(--color-danger)' }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {phase === 'discovery' && homeView !== 'profile' && (
        <CategoryRail
          categories={categories}
          selected={selectedCategory}
          onSelect={onSelectCategory}
        />
      )}

      {feedback && phase === 'discovery' && feedback.session && (
        <div
          style={{
            margin: '16px auto',
            padding: '16px 24px',
            borderRadius: 16,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            maxWidth: 760,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <p style={{ margin: '0 0 4px', color: 'var(--color-text-meta)', fontSize: 13 }}>Last session</p>
            <strong>{feedback.session.title}</strong>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
              You rated {feedback.rating}/5 {feedback.tags.length ? `· ${feedback.tags.join(', ')}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onReturnHome()}
            style={{
              border: 'none',
              background: 'var(--color-pill-bg)',
              padding: '8px 16px',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Browse more
          </button>
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            margin: '0 auto 16px',
            maxWidth: 480,
            padding: '12px 20px',
            borderRadius: 16,
            background: 'var(--color-chip-soft)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-chip-border)',
            textAlign: 'center',
          }}
        >
          {statusMessage}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}

function QuickActionFab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label={label}>
      {label}
    </button>
  );
}

export { AppShell };


function CategoryRail({
  categories,
  selected,
  onSelect,
}: {
  categories: SkillTag[];
  selected: 'all' | SkillTag;
  onSelect: (value: 'all' | SkillTag) => void;
}) {
  const labelFor = (value: 'all' | SkillTag) =>
    value === 'all' ? 'All topics' : formatSkillTag(value);
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 32px 0',
        overflowX: 'auto',
      }}
    >
      {['all', ...categories].map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category as 'all' | SkillTag)}
          style={{
            borderRadius: 999,
            border: '1px solid var(--color-border-strong)',
            padding: '8px 18px',
            background: selected === category ? 'var(--color-text-primary)' : 'var(--color-surface)',
            color: selected === category ? 'var(--color-contrast-on-accent)' : 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          {labelFor(category as 'all' | SkillTag)}
        </button>
      ))}
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function seedSessionsFromProfile(profile: UserProfile): SessionCard[] {
  return profile.teachTags.slice(0, 3).map((tag, index) => ({
    id: `self-session-${index}`,
    title: `${capitalize(tag)} micro exchange #${index + 1}`,
    tag,
    host: profile.name,
    hostAvatar:
      profile.avatarUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
    demoVideoUrl: SESSION_VIDEO_PLACEHOLDER,
    language: profile.learnTags[0] ?? 'English',
    startTime: index === 0 ? 'Tonight · 19:00' : 'Tomorrow · 09:00',
    duration: 10 + index * 5,
    level: index % 2 === 0 ? 'Beginner' : 'Intermediate',
    rating: 4.8,
    status: index === 0 ? 'soon' : 'later',
    blurb: `Live walkthrough on ${tag} for SkillSwap Live community.`,
  }));
}

function seedClipsFromProfile(profile: UserProfile): SkillClip[] {
  return profile.teachTags.slice(0, 3).map((tag, index) => ({
    id: `self-clip-${index}`,
    title: `${capitalize(tag)} tip ${index + 1}`,
    creatorId: 'self',
    previewUrl: `https://source.unsplash.com/random/800x600?${tag}`,
    videoUrl: CLIP_VIDEO_PLACEHOLDER,
    duration: 30 + index * 10,
    likes: 320 + index * 45,
    comments: 24 + index * 6,
    saves: 88 + index * 20,
    views: 4200 + index * 600,
    tags: [tag],
    ctaSessionId: `self-session-${index}`,
  }));
}
