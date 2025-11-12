import { useEffect, useMemo, useRef, useState } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DiscoveryBoard } from './components/DiscoveryBoard';
import { SessionRoom } from './components/SessionRoom';
import { FeedbackSheet } from './components/FeedbackSheet';
import { ClipFeed } from './components/ClipFeed';
import { ChannelHub } from './components/ChannelHub';
import { requestMatch } from './services/matchmaking';
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
} from './types';
import { UserProfilePanel } from './components/UserProfilePanel';

const phases = ['onboarding', 'discovery', 'session', 'feedback'] as const;
type Phase = (typeof phases)[number];
const discoveryViews = ['sessions', 'clips', 'channels', 'profile'] as const;
type DiscoveryView = (typeof discoveryViews)[number];
const navViews: DiscoveryView[] = ['sessions', 'clips', 'channels'];
const categoryOptions: SkillTag[] = [
  'languages',
  'cooking',
  'music',
  'diy',
  'productivity',
  'wellness',
  'technology',
];

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
            background: phase === item ? '#2563eb' : '#cbd5f5',
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('onboarding');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSession, setActiveSession] = useState<SessionCard | null>(null);
  const [feedback, setFeedback] = useState<FeedbackPayload | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [homeView, setHomeView] = useState<DiscoveryView>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SkillTag>('all');
  const [sessionsStore, setSessionsStore] = useState<SessionCard[]>([]);
  const [clipStore, setClipStore] = useState<SkillClip[]>([]);
  const [creatorStore, setCreatorStore] = useState<CreatorProfile[]>([]);
  const [commentStore, setCommentStore] = useState<ClipComment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [userSessions, setUserSessions] = useState<SessionCard[]>([]);
  const [userClips, setUserClips] = useState<SkillClip[]>([]);
  const seededRef = useRef(false);

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
    const normalized = searchQuery.toLowerCase();
    return personalizedSessions.filter((session) => {
      const matchesCategory = categoryFilter === 'all' || session.tag === categoryFilter;
      const matchesSearch =
        !normalized ||
        session.title.toLowerCase().includes(normalized) ||
        session.host.toLowerCase().includes(normalized) ||
        session.blurb.toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [personalizedSessions, categoryFilter, searchQuery]);


  if (!profile || phase === 'onboarding') {
    return (
      <main>
        <OnboardingFlow
          onComplete={(nextProfile) => {
            setProfile(nextProfile);
            setPhase('discovery');
          }}
        />
        <PhaseIndicator phase="onboarding" />
      </main>
    );
  }

  if (loadingData) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: '#475569',
          fontWeight: 500,
        }}
      >
        Preparing live skill feed…
      </main>
    );
  }

  const showDiscovery = phase === 'discovery';
  const showSession = phase === 'session' && activeSession;
  const showFeedback = phase === 'feedback' && activeSession;

  const handleSessionStart = async (session: SessionCard) => {
    setIsMatching(true);
    setStatusMessage('Bringing in your host…');
    const confirmed = await requestMatch(session);
    setActiveSession(confirmed);
    setPhase('session');
    setIsMatching(false);
    setStatusMessage(null);
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
      hostAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
      language: profile.learnTags[0] ?? 'English',
      startTime: draft.startTime || 'TBD',
      duration: draft.duration,
      level: draft.level,
      rating: 4.9,
      status: draft.status,
      blurb: draft.blurb || 'Live exchange hosted by you.',
    };
    setUserSessions((prev) => [session, ...prev]);
  };

  const handleCreateClip = (draft: ClipDraft) => {
    const clip: SkillClip = {
      id: `user-clip-${Date.now()}`,
      title: draft.title,
      creatorId: 'self',
      previewUrl: draft.previewUrl || `https://source.unsplash.com/random/800x600?${draft.tag}`,
      duration: draft.duration,
      likes: 0,
      comments: 0,
      saves: 0,
      tags: [draft.tag],
      ctaSessionId: userSessions[0]?.id,
    };
    setUserClips((prev) => [clip, ...prev]);
  };

  return (
    <main>
      <AppShell
        phase={phase}
        profile={profile}
        feedback={feedback}
        statusMessage={statusMessage}
        homeView={homeView}
        onReturnHome={() => {
          setPhase('discovery');
          setActiveSession(null);
          setHomeView('sessions');
          setSearchQuery('');
          setCategoryFilter('all');
        }}
        onSelectView={(view) => {
          setPhase('discovery');
          setHomeView(view);
        }}
        onProfileClick={() => {
          setPhase('discovery');
          setHomeView('profile');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categoryOptions}
        selectedCategory={categoryFilter}
        onSelectCategory={setCategoryFilter}
      >
        {showDiscovery && homeView === 'sessions' && (
          <DiscoveryBoard
            profile={profile}
            sessions={filteredSessions}
            isMatching={isMatching}
            featuredClips={clipStore.slice(0, 3)}
            onOpenClips={() => setHomeView('clips')}
            onJoin={(session) => handleSessionStart(session)}
            categoryFilter={categoryFilter}
            searchQuery={searchQuery}
          />
        )}

        {showDiscovery && homeView === 'clips' && (
          <ClipFeed
            clips={clipStore}
            creators={creatorStore}
            comments={commentStore}
            sessions={personalizedSessions}
            onJoinSession={(sessionId) => handleJoinById(sessionId)}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
          />
        )}

        {showDiscovery && homeView === 'channels' && (
          <ChannelHub
            creators={creatorStore}
            clips={clipStore}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
          />
        )}

        {showDiscovery && homeView === 'profile' && (
          <UserProfilePanel
            profile={profile}
            sessions={userSessions}
            clips={userClips}
            availableTags={categoryOptions}
            onProfileUpdate={handleProfileUpdate}
            onCreateSession={handleCreateSession}
            onCreateClip={handleCreateClip}
          />
        )}

        {showSession && activeSession && (
          <SessionRoom
            session={activeSession}
            onLeave={() => {
              setPhase('feedback');
            }}
          />
        )}

        {showFeedback && activeSession && (
          <FeedbackSheet
            session={activeSession}
            onSubmit={(payload) => {
              setFeedback({ ...payload, session: activeSession });
              setPhase('discovery');
              setActiveSession(null);
            }}
          />
        )}
      </AppShell>
      <PhaseIndicator phase={phase} />
    </main>
  );
}

function AppShell({
  children,
  phase,
  profile,
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
  onSelectView,
}: {
  children: React.ReactNode;
  phase: Phase;
  profile: UserProfile;
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
  onSelectView: (view: DiscoveryView) => void;
}) {
  return (
    <div>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.4)',
          background: 'rgba(248, 250, 252, 0.85)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#312e81',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            SL
          </div>
          <div>
            <strong>SkillSwap Live</strong>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Beta playground</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {phase === 'discovery' && homeView !== 'profile' && (
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search hosts, clips, sessions"
              style={{
                borderRadius: 999,
                border: '1px solid #cbd5f5',
                padding: '8px 16px',
                minWidth: 220,
              }}
            />
          )}
          {phase === 'discovery' ? (
            <div
              style={{
                display: 'flex',
                gap: 8,
                background: '#e0e7ff',
                padding: 6,
                borderRadius: 999,
              }}
            >
              {navViews.map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => onSelectView(view)}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '6px 18px',
                    background: homeView === view ? '#312e81' : 'transparent',
                    color: homeView === view ? '#fff' : '#312e81',
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
                border: '1px solid #0f172a',
                background: '#0f172a',
                color: '#fff',
                padding: '8px 18px',
                cursor: 'pointer',
              }}
            >
              Back to Discover
            </button>
          )}
          <button
            type="button"
            onClick={onProfileClick}
            style={{
              border: 'none',
              background: 'transparent',
              color: homeView === 'profile' ? '#312e81' : '#475569',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: homeView === 'profile' ? 'underline' : 'none',
            }}
          >
            {profile.name}
          </button>
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
            border: '1px solid #e2e8f0',
            background: '#fff',
            maxWidth: 760,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: 13 }}>Last session</p>
            <strong>{feedback.session.title}</strong>
            <p style={{ margin: 0, color: '#475569' }}>
              You rated {feedback.rating}/5 {feedback.tags.length ? `· ${feedback.tags.join(', ')}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onReturnHome()}
            style={{
              border: 'none',
              background: '#e0e7ff',
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
            background: '#dbeafe',
            color: '#0f172a',
            border: '1px solid #bfdbfe',
            textAlign: 'center',
          }}
        >
          {statusMessage}
        </div>
      )}

      {children}
    </div>
  );
}

function CategoryRail({
  categories,
  selected,
  onSelect,
}: {
  categories: SkillTag[];
  selected: 'all' | SkillTag;
  onSelect: (value: 'all' | SkillTag) => void;
}) {
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
            border: '1px solid #cbd5f5',
            padding: '8px 18px',
            background: selected === category ? '#0f172a' : '#fff',
            color: selected === category ? '#fff' : '#0f172a',
            cursor: 'pointer',
            textTransform: 'capitalize',
          }}
        >
          {category}
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
    hostAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
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
    duration: 30 + index * 10,
    likes: 320 + index * 45,
    comments: 24 + index * 6,
    saves: 88 + index * 20,
    tags: [tag],
    ctaSessionId: `self-session-${index}`,
  }));
}
