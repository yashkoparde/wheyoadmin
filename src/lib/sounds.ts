import { Howl } from 'howler';

// Using a standard notification sound URL (public assets or placeholder)
// In a real app we'd have our own ogg/mp3. 
// For now, I'll use a placeholder that sounds like a tech beep.
export const playNotificationSound = () => {
  const sound = new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'],
    volume: 0.5
  });
  sound.play();
};
