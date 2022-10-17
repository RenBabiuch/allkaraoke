import styled from '@emotion/styled';
import { focused } from 'Elements/cssMixins';
import VideoPlayer, { VideoPlayerRef, VideoState } from 'Elements/VideoPlayer';
import { SingSetup, SongPreview } from 'interfaces';
import { ComponentProps, PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSongStats } from 'Stats/Song/hooks';
import useDebounce from '../../../hooks/useDebounce';
import useViewportSize from '../../../hooks/useViewportSize';
import styles from '../Singing/GameOverlay/Drawing/styles';
import {
    SongCard,
    SongCardBackground,
    SongCardContainer,
    SongCardStatsIndicator,
    SongListEntryDetails,
    SongListEntryDetailsArtist,
    SongListEntryDetailsTitle,
} from './SongCard';
import SongSettings from './SongSettings';

interface Props {
    songPreview: SongPreview;
    onPlay: (setup: SingSetup & { file: string; video: string }) => void;
    keyboardControl: boolean;
    onExitKeyboardControl: () => void;
    top: number;
    left: number;
    width: number;
    height: number;
    focusEffect: boolean;
}

const PREVIEW_LENGTH = 30;

export default function SongPreviewComponent({
    songPreview,
    top,
    left,
    width,
    height,
    keyboardControl,
    onExitKeyboardControl,
    onPlay,
    focusEffect,
}: Props) {
    const [showVideo, setShowVideo] = useState(false);
    const player = useRef<VideoPlayerRef | null>(null);
    const { width: windowWidth } = useViewportSize();

    const active = keyboardControl;

    // need to use layout effect otherwise newly selected song name is displayed briefly before the element is removed
    useLayoutEffect(() => {
        setShowVideo(false);
    }, [songPreview]);

    const start = songPreview.previewStart ?? (songPreview.videoGap ?? 0) + 60;
    const [videoId, previewStart, previewEnd, volume] = useDebounce(
        [songPreview.video, start, songPreview.previewEnd ?? start + PREVIEW_LENGTH, songPreview.volume],
        350,
    );

    useEffect(() => {
        player.current?.loadVideoById({
            videoId: videoId,
            startSeconds: previewStart,
            endSeconds: previewEnd,
        });
    }, [videoId, player, previewStart, previewEnd]);

    const finalWidth = active ? windowWidth! : width;
    const finalHeight = active ? (windowWidth! / 20) * 9 : height;

    useEffect(() => {
        player.current?.setSize(finalWidth, (finalWidth / 16) * 9);
    }, [finalWidth, keyboardControl]);

    return (
        <>
            {active && <Backdrop onClick={onExitKeyboardControl} />}
            {!active && showVideo && (
                <SongBPMIndicator width={finalWidth} height={finalHeight} left={left} top={top} song={songPreview} />
            )}
            <SongPreviewContainer
                top={top}
                left={left}
                width={finalWidth}
                height={finalHeight}
                active={active}
                data-test="song-preview"
                data-song={songPreview.file}>
                <Content
                    width={finalWidth}
                    active={active}
                    focus={focusEffect}
                    blurBackground={active && !showVideo}
                    isVideoPlaying={showVideo}>
                    {(showVideo || active) && (
                        <>
                            <SongInfo active={active}>
                                {!active && <SongCardStatsIndicator song={songPreview} />}
                                <SongListEntryDetailsArtist>{songPreview.artist}</SongListEntryDetailsArtist>
                                <SongListEntryDetailsTitle>{songPreview.title}</SongListEntryDetailsTitle>
                                {active && (
                                    <>
                                        {songPreview.author && (
                                            <SongAuthor>
                                                by&nbsp;
                                                {songPreview.authorUrl ? (
                                                    <a href={songPreview.authorUrl} target="_blank" rel="noreferrer">
                                                        {songPreview.author}
                                                    </a>
                                                ) : (
                                                    songPreview.author
                                                )}
                                            </SongAuthor>
                                        )}
                                        <SongListEntryStats song={songPreview} />
                                    </>
                                )}
                            </SongInfo>
                            {active && (
                                <SongSettings
                                    songPreview={songPreview}
                                    onPlay={onPlay}
                                    keyboardControl={keyboardControl}
                                    onExitKeyboardControl={onExitKeyboardControl}
                                />
                            )}
                        </>
                    )}
                </Content>
                {active && (
                    <>
                        <SongCardBackground
                            video={songPreview.video}
                            focused
                            style={{
                                backgroundImage: `url('https://i3.ytimg.com/vi/${songPreview.video}/hqdefault.jpg')`,
                            }}
                        />
                    </>
                )}
                <Video show={showVideo} active={keyboardControl} height={finalHeight} width={finalWidth}>
                    <VideoPlayer
                        width={0}
                        height={0}
                        disablekb
                        ref={player}
                        video={''}
                        volume={volume}
                        onStateChange={(state) => {
                            if (state === VideoState.ENDED) {
                                player.current?.seekTo(start);
                                player.current?.playVideo();
                            } else if (state === VideoState.PLAYING) {
                                setShowVideo(true);
                            }
                        }}
                    />
                </Video>
            </SongPreviewContainer>
        </>
    );
}

const BaseSongPreviewContainer = styled.div<{ width: number; height: number; active: boolean }>`
    width: ${(props) => props.width}px;
    height: ${(props) => props.height}px;
    position: absolute;
    z-index: 3;
    overflow: hidden;
    padding: 0;

    ${(props) => (props.active ? 'position: fixed;' : 'transform: scale(1.2);')}
    ${(props) => !props.active && 'pointer-events: none;'}
    ${(props) => !props.active && 'border-radius: 5px;'}
`;

interface SongPreviewContainerProps
    extends PropsWithChildren<{
        top: number;
        left: number;
        active: boolean;
        width: number;
        height: number;
    }> {}

const SongPreviewContainer = (props: SongPreviewContainerProps) => (
    <BaseSongPreviewContainer
        style={{
            top: props.active ? `calc(50vh - ${props.height}px / 2)` : props.top,
            left: props.active ? 0 : props.left,
        }}
        {...props}
    />
);

const Backdrop = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.8);
    width: 100vw;
    height: 100vh;
    z-index: 2;
`;

const Video = styled(SongCard)<{ show: boolean; active: boolean; height: number }>`
    div {
        opacity: ${({ show }) => (show ? 1 : 0)};
        transition: ${({ show, active }) => (show || active ? 1000 : 0)}ms;
    }
    ${(props) => !props.active && 'background-image: none !important;'}
    ${(props) => !props.active && 'border-radius: 5px;'}
    ${(props) => props.active && `margin-top: calc(-1 * (100vw / 16 * 9) / 2 + ${props.height / 2}px);`}
`;

const Content = styled(SongCardContainer)<{
    active: boolean;
    blurBackground: boolean;
    isVideoPlaying: boolean;
    focus: boolean;
}>`
    position: absolute;
    z-index: 100;
    width: 100%;
    height: 100%;
    padding: ${(props) => (props.active ? '0.25em' : '0.5em')};
    ${(props) => props.blurBackground && 'backdrop-filter: blur(10px);'}

    ${(props) => props.focus && !props.active && props.isVideoPlaying && focused}
    ${(props) => props.focus && !props.active && props.isVideoPlaying && 'border: 1px solid black;'}
    border-radius: 5px;
`;

const SongInfo = styled.div<{ active: boolean }>`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    flex-direction: column;

    ${(props) =>
        props.active &&
        `
        align-items: flex-start;
        justify-content: flex-start;
        font-size: .5em;
    `}
`;

const SongAuthor = styled(SongListEntryDetailsTitle)`
    font-size: 0.5em;
    margin-top: 0.5em;

    a {
        text-decoration: none;
        -webkit-text-stroke: 1px black;
        color: ${styles.colors.text.active};
    }
`;

export const SongListEntryStats = ({ song }: { song: SongPreview }) => {
    const stats = useSongStats(song);

    return (
        <SongEntryStat>
            {stats?.plays ? `Played ${stats.plays} time${stats.plays > 1 ? 's' : ''}` : 'Never played yet'}
        </SongEntryStat>
    );
};

const SongEntryStat = styled(SongListEntryDetails)`
    margin-top: 0.5em;
    color: white;
    font-size: 0.5em;
`;

const BaseSongBPMIndicator = styled.div<{ width: number; height: number }>`
    background: white;
    width: ${(props) => props.width}px;
    height: ${(props) => props.height}px;
    z-index: 2;
    top: 0;
    left: 0;
    position: absolute;
    animation: bpm 1s infinite;
    border-radius: 5px;

    @keyframes bpm {
        0% {
            transform: scale(1.15);
            opacity: 1;
        }
        100% {
            transform: scale(1.5);
            opacity: 0;
        }
    }
`;

const SongBPMIndicator = (
    props: {
        top: number;
        left: number;
        song: SongPreview;
    } & ComponentProps<typeof BaseSongBPMIndicator>,
) => {
    const realBpm = props.song.realBpm ?? (props.song.bpm > 300 ? props.song.bpm / 4 : props.song.bpm / 2);
    return (
        <BaseSongBPMIndicator
            width={props.width}
            height={props.height}
            style={{
                left: props.left,
                top: props.top,
                animationDuration: `${60 / realBpm}s`,
            }}
        />
    );
};
