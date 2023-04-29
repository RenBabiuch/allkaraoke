import { Box, Slider } from '@mui/material';
import YouTube from 'react-youtube';
import backgroundMusic from 'assets/Funk Cool Groove (No Copyright Music) By Anwar Amr.mp3';
import { SongMetadataEntity } from 'Scenes/Convert/Steps/SongMetadata';
import { useEffect, useRef, useState } from 'react';

interface Props {
    onChange: (data: SongMetadataEntity) => void;
    data: SongMetadataEntity;
    videoId: string;
}

export default function VolumeAdjustment({ data, onChange, videoId }: Props) {
    const player = useRef<YouTube | null>(null);
    const reference = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (data.volume === 0) {
            onChange({ ...data, volume: 0.5 });
        }
        player.current?.getInternalPlayer().setVolume(data.volume * 100);
    }, [data.volume]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const currentVolume = await player.current?.getInternalPlayer().getVolume();

            if (currentVolume !== data.volume * 100) {
                onChange({ ...data, volume: currentVolume / 100 });
            }
        }, 500);

        return () => {
            clearInterval(interval);
        };
    }, [data, onChange]);

    const [isPlayerPlaying, setIsPlayerPlaying] = useState(false);
    const [isReferencePlaying, setIsReferencePlaying] = useState(false);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <h3>Adjust volume</h3>
            <Box sx={{ display: 'flex', gap: 5 }}>
                <Box>
                    <h4>Song</h4>
                    <YouTube
                        videoId={videoId}
                        ref={player}
                        onPlay={() => {
                            setIsPlayerPlaying(true);

                            if (isReferencePlaying) {
                                reference.current?.pause();
                                setTimeout(() => setIsReferencePlaying(true), 200);
                            }
                        }}
                        onPause={() => {
                            setIsReferencePlaying(false);
                        }}
                    />
                </Box>
                <Box>
                    <h4>Reference sound</h4>
                    <p>Use the slider below to make the video volume roughly the same as this music.</p>
                    <br />
                    <audio
                        ref={reference}
                        controls
                        src={backgroundMusic}
                        loop
                        onPlay={(e) => {
                            e.currentTarget.volume = 0.5;
                            setIsReferencePlaying(true);
                            if (isPlayerPlaying) {
                                player.current?.getInternalPlayer()?.pauseVideo();
                                setTimeout(() => setIsPlayerPlaying(true), 200);
                            }
                        }}
                        onPause={() => {
                            setIsReferencePlaying(false);
                            if (isPlayerPlaying) {
                                player.current?.getInternalPlayer()?.playVideo();
                            }
                        }}
                    />
                </Box>
            </Box>
            <h4>Final Song Volume ({data.volume * 100})</h4>
            <Box>
                <Slider
                    data-test="volume"
                    min={0}
                    max={1}
                    step={0.01}
                    aria-label="Volume"
                    value={data.volume}
                    onChange={(e, value) => onChange({ ...data, volume: +value })}
                />
            </Box>
        </Box>
    );
}
