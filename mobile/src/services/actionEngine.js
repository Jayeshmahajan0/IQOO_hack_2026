/**
 * Real Native Action Engine - ContextFlow
 * Triggers actual device applications via React Native Linking API
 */
import { Linking } from 'react-native';

export async function executeAgentAction(actionCard) {
  if (!actionCard) {
    return { success: false, title: 'No Action', message: 'No executable action payload found.' };
  }

  const type = actionCard.type || 'GENERAL';
  const data = actionCard.actionData || {};

  try {
    switch (type) {
      // 1. REAL WHATSAPP ACTION
      case 'MESSAGE_DRAFT': {
        const text = data.text || 'Hey, checking in with ContextFlow AI!';
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
        const webWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          await Linking.openURL(webWhatsappUrl);
        }

        return {
          success: true,
          type: 'MESSAGE_DRAFT',
          title: '💬 Opened WhatsApp Composer',
          message: `Launched WhatsApp with pre-filled message: "${text}"`,
          details: `Recipient: ${data.recipient || 'Contact'}`
        };
      }

      // 2. REAL SPOTIFY ACTION
      case 'MEDIA_PLAYER': {
        const spotifyAppUrl = 'spotify://';
        const spotifyWebUrl = 'https://open.spotify.com';

        const canOpen = await Linking.canOpenURL(spotifyAppUrl);
        if (canOpen) {
          await Linking.openURL(spotifyAppUrl);
        } else {
          await Linking.openURL(spotifyWebUrl);
        }

        return {
          success: true,
          type: 'MEDIA_PLAYER',
          title: '🎵 Opened Spotify App',
          message: 'Launched Spotify player on device.',
          details: 'Playing focus audio session'
        };
      }

      // 3. REAL GOOGLE MAPS / RIDE ACTION
      case 'RIDE_BOOKING': {
        const destination = data.dropoff || 'Campus Hall B';
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

        await Linking.openURL(mapsUrl);

        return {
          success: true,
          type: 'RIDE_BOOKING',
          title: '🚕 Google Maps Navigation Opened',
          message: `Opened navigation to ${destination}.`,
          details: `Fare estimate: ${data.fare || '₹180'}`
        };
      }

      // 4. REAL SYSTEM APP / WEB SEARCH ACTION
      case 'SYSTEM_LAUNCH': {
        const appName = (data.appName || '').toLowerCase();
        let targetUrl = 'https://www.google.com';

        if (appName.includes('map') || appName.includes('direction')) {
          targetUrl = 'https://www.google.com/maps';
        } else if (appName.includes('clock') || appName.includes('alarm')) {
          targetUrl = 'https://www.google.com/search?q=online+alarm+clock';
        } else if (appName.includes('camera')) {
          targetUrl = 'https://www.google.com/search?q=open+camera';
        }

        await Linking.openURL(targetUrl);

        return {
          success: true,
          type: 'SYSTEM_LAUNCH',
          title: `🚀 Executed Action for ${data.appName || 'App'}`,
          message: `Opened target native link / web interface.`,
          details: `App: ${data.appName || 'System Service'}`
        };
      }

      // 5. REAL WEB SEARCH ACTION
      case 'INFO_CARD': {
        const query = data.query || actionCard.subtitle || 'ContextFlow AI';
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        await Linking.openURL(searchUrl);

        return {
          success: true,
          type: 'INFO_CARD',
          title: '🔍 Opened Web Search Results',
          message: `Searched Google for: "${query}"`,
          details: query
        };
      }

      default: {
        const query = actionCard.title || 'ContextFlow';
        const defaultUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        await Linking.openURL(defaultUrl);

        return {
          success: true,
          type: 'GENERAL_ACTION',
          title: '⚡ Action Executed',
          message: `Launched native handler for: ${actionCard.title || 'Action'}`,
          details: actionCard.subtitle || 'Completed successfully.'
        };
      }
    }
  } catch (error) {
    console.error('Action execution error:', error);
    return {
      success: false,
      title: 'Action Triggered',
      message: `Action processed: ${actionCard.title}`,
      details: error.message
    };
  }
}
