import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import { Play, Loader2, RotateCcw } from 'lucide-react';
import { playerStore } from '@/store/store';
import {
  fetchTracksByMood,
  getDefaultMood,
  getMoodByKey,
  MOOD_PRESETS,
  type MoodKey,
  type MoodPreset,
} from '@/shared/api/jamendo';
import { jamendoToTracks } from '@/shared/lib/jamendoMapper';
import { MoodIcon } from '@/shared/ui/MoodIcon';
import { mockTracks } from '@/shared/mock/media';
import type { Track } from '@/types/music.types';

const FEATURED_TRACK_COUNT = 8;

function getInitialMood(): MoodPreset {
  const storedKey = playerStore.selectedHomeMoodKey ?? playerStore.homeFeedMoodKey;
  if (storedKey) {
    const storedMood = getMoodByKey(storedKey as MoodKey);
    if (storedMood) {
      return storedMood;
    }
  }

  return getDefaultMood();
}

function isStaleMoodRequest(mood: MoodPreset) {
  const { selectedHomeMoodKey } = playerStore;
  return selectedHomeMoodKey !== null && selectedHomeMoodKey !== mood.key;
}

type HomeTrackCardProps = {
  track: Track;
  index: number;
  variant: 'featured' | 'compact';
  onPlay: (index: number) => void;
};

const HomeTrackCard = observer(function HomeTrackCard({
  track,
  index,
  variant,
  onPlay,
}: HomeTrackCardProps) {
  const isActive = playerStore.isHomeTrackActive(track.id);
  const playControl =
    isActive && playerStore.isPlaying ? (
      <span className="now-playing-indicator">
        <span />
        <span />
        <span />
      </span>
    ) : (
      <Play aria-hidden="true" />
    );

  return (
    <button
      type="button"
      className={`track-card track-card--${variant}${isActive ? ' track-card-active' : ''}`}
      onClick={() => onPlay(index)}
      aria-label={
        isActive && playerStore.isPlaying
          ? `Пауза ${track.title} — ${track.artist}`
          : `Воспроизвести ${track.title} — ${track.artist}`
      }
      aria-current={isActive ? 'true' : undefined}
    >
      {variant === 'compact' ? (
        <>
          <div className="track-card-cover">
            <img src={track.coverUrl} alt="" loading="lazy" />
            <span className="track-play-button" aria-hidden="true">
              {playControl}
            </span>
          </div>
          <strong>{track.title}</strong>
          <span className="track-card-artist">{track.artist}</span>
        </>
      ) : (
        <>
          <img src={track.coverUrl} alt="" loading="lazy" />
          <strong>{track.title}</strong>
          <span className="track-card-artist">{track.artist}</span>
          <span className="track-play-button" aria-hidden="true">
            {playControl}
          </span>
        </>
      )}
    </button>
  );
});

export const HomePage = observer(function HomePage() {
  const [selectedMood, setSelectedMood] = useState<MoodPreset>(getInitialMood);
  const [loading, setLoading] = useState(() => playerStore.homeFeedTracks.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const loadTracks = useCallback(async (mood: MoodPreset, force = false) => {
    if (
      !force &&
      playerStore.homeFeedMoodKey === mood.key &&
      playerStore.homeFeedTracks.length > 0
    ) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      const tracks = await fetchTracksByMood(mood, 24);

      if (isStaleMoodRequest(mood)) {
        return;
      }

      if (tracks.length > 0) {
        playerStore.setHomeFeed(jamendoToTracks(tracks), mood.key, force);
        return;
      }

      playerStore.setHomeFeed(mockTracks, mood.key, true);
      setUsingFallback(true);
      setError('Онлайн-подборка пуста. Показали демо-треки.');
    } catch {
      if (isStaleMoodRequest(mood)) {
        return;
      }

      playerStore.setHomeFeed(mockTracks, mood.key, true);
      setUsingFallback(true);
      setError('Не удалось загрузить треки. Показали демо-подборку.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!playerStore.selectedHomeMoodKey) {
      playerStore.setSelectedHomeMoodKey(selectedMood.key);
    }

    void loadTracks(selectedMood, reloadToken > 0);
  }, [selectedMood, reloadToken, loadTracks]);

  const handleMoodSelect = (mood: MoodPreset) => {
    playerStore.setSelectedHomeMoodKey(mood.key);
    setSelectedMood(mood);
  };

  const handlePlay = (index: number) => {
    playerStore.playFromHomeFeed(index);
  };

  const handleRetry = () => {
    setReloadToken((token) => token + 1);
  };

  const tracks = playerStore.homeFeedTracks;
  const featuredTracks = tracks.slice(0, FEATURED_TRACK_COUNT);
  const catalogTracks =
    tracks.length > FEATURED_TRACK_COUNT ? tracks.slice(FEATURED_TRACK_COUNT) : [];
  const showCatalog = catalogTracks.length > 0;

  return (
    <section className="home-page" aria-labelledby="home-mood-heading">
      <fieldset className="mood-selector">
        <legend id="home-mood-heading" className="section-subtitle">
          Как ты сейчас?
        </legend>
        <div className="mood-chips" role="group" aria-label="Выбор настроения">
          {MOOD_PRESETS.map((mood) => (
            <button
              key={mood.key}
              type="button"
              className={`mood-chip ${selectedMood.key === mood.key ? 'active' : ''}`}
              onClick={() => handleMoodSelect(mood)}
              aria-pressed={selectedMood.key === mood.key}
            >
              <MoodIcon moodKey={mood.key} active={selectedMood.key === mood.key} />
              <span className="mood-chip-label">{mood.label}</span>
            </button>
          ))}
        </div>
        <p className="mood-description">{selectedMood.description}</p>
      </fieldset>

      {loading && (
        <div className="loading-state" role="status" aria-live="polite">
          <Loader2 className="loading-spinner" aria-hidden="true" />
          <p>Загружаем музыку для настроения «{selectedMood.label}»…</p>
        </div>
      )}

      {error && !loading && (
        <div
          className={`error-state${usingFallback ? ' error-state-info' : ''}`}
          role={usingFallback ? 'status' : 'alert'}
        >
          <p>{error}</p>
          <button type="button" className="error-retry-btn" onClick={handleRetry}>
            <RotateCcw aria-hidden="true" />
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <div className="home-track-feed">
          <section className="track-section" aria-labelledby="home-featured-heading">
            <div className="track-section-header">
              <h2 id="home-featured-heading" className="track-section-title">
                {showCatalog ? 'Сейчас в эфире' : 'Подборка для тебя'}
              </h2>
              <p className="track-section-subtitle">
                {showCatalog
                  ? `Топ-треки для настроения «${selectedMood.label}»`
                  : selectedMood.description}
              </p>
            </div>
            <div className="track-row track-row--bleed" aria-label="Избранные треки">
              {featuredTracks.map((track, index) => (
                <HomeTrackCard
                  key={track.id}
                  track={track}
                  index={index}
                  variant="featured"
                  onPlay={handlePlay}
                />
              ))}
            </div>
          </section>

          {showCatalog && (
            <section className="track-section" aria-labelledby="home-catalog-heading">
              <div className="track-section-header">
                <h2 id="home-catalog-heading" className="track-section-title">
                  Вся подборка
                </h2>
                <p className="track-section-subtitle">
                  Ещё {catalogTracks.length} треков — листай сетку или включай любой
                </p>
              </div>
              <div className="track-catalog" aria-label="Все треки подборки">
                {catalogTracks.map((track, offset) => (
                  <HomeTrackCard
                    key={track.id}
                    track={track}
                    index={FEATURED_TRACK_COUNT + offset}
                    variant="compact"
                    onPlay={handlePlay}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
});
