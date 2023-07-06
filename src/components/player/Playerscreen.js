import React, { useEffect } from 'react'
import './Playerscreen.css'

export default function Playerscreen() {

    const IVSPlayer = window.IVSPlayer;
    useEffect(() => {
        if (!IVSPlayer || !IVSPlayer.isPlayerSupported) {
            console.warn("The current browser does not support the IVS player.");
            return;
        }
        const PlayerState = IVSPlayer.PlayerState;
        const PlayerEventType = IVSPlayer.PlayerEventType;

        // Initialize player
        const player = IVSPlayer.create();
        console.log('IVS Player version:', player.getVersion());
        player.attachHTMLVideoElement(document.getElementById('video-player'));

        // Attach event listeners
        player.addEventListener(PlayerState.PLAYING, () => {
            console.log('Player State - PLAYING');
        });
        player.addEventListener(PlayerState.ENDED, () => {
            console.log('Player State - ENDED');
        });
        player.addEventListener(PlayerState.READY, () => {
            console.log('Player State - READY');
        });
        player.addEventListener(PlayerEventType.ERROR, (err) => {
            console.warn('Player Event - ERROR:', err);
        });
        player.addEventListener(PlayerEventType.TEXT_METADATA_CUE, (cue) => {
            const metadataText = cue.text;
            const position = player.getPosition().toFixed(2);
            console.log(
                `PlayerEvent - TEXT_METADATA_CUE: "${metadataText}". Observed ${position}s after playback started.`
            );
        });

        // Setup stream and play
        player.setAutoplay(true);
        player.load(
            process.env.REACT_APP_PLAYBACK_URL
        );
        player.setVolume(0.5);
    }, [])

    return (
        <>
            <div className='main_player_screen'>
                <video className='main_video' id="video-player" controls playsinline></video>
            </div>
        </>
    )
}
