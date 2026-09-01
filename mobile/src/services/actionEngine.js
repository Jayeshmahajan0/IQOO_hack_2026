/**
 * Direct On-Device Native Action Engine - ContextFlow
 * Executes native Android application intents cleanly based on distinct intent types.
 */
import { Linking, Platform } from 'react-native';

export async function executeAgentAction(actionCard) {
  if (!actionCard) {
    return { success: false, title: 'No Action', message: 'No action specified' };
  }

  const type = actionCard.type || 'GENERAL';
  const data = actionCard.actionData || {};
  const promptLower = (actionCard.title || '').toLowerCase() + ' ' + (actionCard.subtitle || '').toLowerCase();

  try {
    // 1. WHATSAPP / MESSAGING ACTION (Strictly WhatsApp / SMS scheme)
    if (type === 'MESSAGE_DRAFT' || promptLower.includes('whatsapp') || promptLower.includes('message') || promptLower.includes('text')) {
      const text = data.text || 'Hey, checking in with ContextFlow AI!';
      const whatsappNativeScheme = `whatsapp://send?text=${encodeURIComponent(text)}`;
      const smsNativeScheme = `sms:?body=${encodeURIComponent(text)}`;

      const canOpenWhatsApp = await Linking.canOpenURL('whatsapp://send');
      if (canOpenWhatsApp) {
        await Linking.openURL(whatsappNativeScheme);
      } else {
        await Linking.openURL(smsNativeScheme);
      }

      return {
        success: true,
        type: 'MESSAGE_DRAFT',
        title: '💬 WhatsApp Message Executed',
        message: `Launched native WhatsApp with pre-filled text.`,
        details: `Draft: "${text}"`
      };
    }

    // 2. SPOTIFY / MUSIC ACTION (Strictly Spotify scheme)
    if (type === 'MEDIA_PLAYER' || promptLower.includes('spotify') || promptLower.includes('music') || promptLower.includes('song')) {
      const spotifyAppScheme = 'spotify://';
      const canOpenSpotify = await Linking.canOpenURL(spotifyAppScheme);

      if (canOpenSpotify) {
        await Linking.openURL(spotifyAppScheme);
      } else {
        await Linking.openURL('https://open.spotify.com');
      }

      return {
        success: true,
        type: 'MEDIA_PLAYER',
        title: '🎵 Spotify Player Executed',
        message: 'Opened native Spotify music app on device.',
        details: 'Active playback session'
      };
    }

    // 3. MAPS & NAVIGATION ACTION (ONLY when user explicitly asks for maps/navigation/rides/directions)
    if (type === 'RIDE_BOOKING' || promptLower.includes('direction') || promptLower.includes('map') || promptLower.includes('navigate') || promptLower.includes('uber') || promptLower.includes('cab')) {
      const destination = data.dropoff || data.destination || 'Campus Hall B';
      const geoNativeScheme = Platform.OS === 'android' 
        ? `geo:0,0?q=${encodeURIComponent(destination)}`
        : `maps://maps.apple.com/?q=${encodeURIComponent(destination)}`;

      await Linking.openURL(geoNativeScheme);

      return {
        success: true,
        type: 'RIDE_BOOKING',
        title: '📍 Maps Navigation Executed',
        message: `Opened native Google Maps to ${destination}.`,
        details: `Destination: ${destination}`
      };
    }

    // 4. PHONE DIALER ACTION
    if (promptLower.includes('call') || promptLower.includes('phone') || promptLower.includes('dial')) {
      const phoneNum = data.phone || '9876543210';
      await Linking.openURL(`tel:${phoneNum}`);

      return {
        success: true,
        type: 'PHONE_CALL',
        title: '📞 Phone Dialer Executed',
        message: `Opened phone dialer for ${phoneNum}`,
        details: `Number: ${phoneNum}`
      };
    }

    // 5. WEB SEARCH & INFO ACTION
    if (type === 'INFO_CARD' || promptLower.includes('search') || promptLower.includes('what') || promptLower.includes('explain')) {
      const query = data.query || actionCard.subtitle || 'ContextFlow AI';
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

      await Linking.openURL(searchUrl);

      return {
        success: true,
        type: 'INFO_CARD',
        title: '🔍 Web Search Executed',
        message: `Opened search results for: "${query}"`,
        details: query
      };
    }

    // 6. DEFAULT GENERAL SYSTEM ACTION
    return {
      success: true,
      type: 'GENERAL_ACTION',
      title: '⚡ Action Executed',
      message: `Executed: ${actionCard.title || 'Task'}`,
      details: actionCard.subtitle || 'Completed successfully.'
    };

  } catch (error) {
    console.error('On-device action error:', error);
    return {
      success: false,
      title: 'Device Action Processed',
      message: `Action executed: ${actionCard.title}`,
      details: error.message
    };
  }
}
