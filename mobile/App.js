import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { checkServerHealth, processVoiceIntent } from './src/services/apiService';
import { getClipboardContext, setMockClipboardContext, getActiveAppContext } from './src/services/contextService';
import { executeAction } from './src/services/actionEngine';

export default function App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [speechInput, setSpeechInput] = useState('Make this shorter');
  const [clipboardText, setClipboardText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [actionLog, setActionLog] = useState(null);

  useEffect(() => {
    async function initData() {
      // Check Node.js backend health
      const health = await checkServerHealth();
      setServerOnline(health.online);

      // Load current clipboard context
      const clip = await getClipboardContext();
      setClipboardText(clip);
    }
    initData();
  }, []);

  const handleUpdateClipboard = (text) => {
    setClipboardText(text);
    setMockClipboardContext(text);
  };

  const handleProcessIntent = async (textToProcess = speechInput) => {
    if (!textToProcess.trim()) return;
    setLoading(true);
    setActionLog(null);

    const appContext = getActiveAppContext();
    const response = await processVoiceIntent(textToProcess, clipboardText, appContext);
    setLoading(false);

    if (response && response.result) {
      setAiResult(response.result);
    }
  };

  const handleExecuteAction = () => {
    if (!aiResult || !aiResult.actionPayload) return;
    const log = executeAction(aiResult.actionPayload, handleUpdateClipboard);
    setActionLog(log);
  };

  const speechPresets = [
    'Make this shorter',
    'Make it formal',
    'Tell Rahul I will reach in 15 minutes',
    'Remind me to send the slides at 5 PM',
    'Explain this error message',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ContextFlow</Text>
            <Text style={styles.subtitle}>Context-Aware Voice Assistant</Text>
          </View>
          <View style={[styles.badge, serverOnline ? styles.badgeOnline : styles.badgeOffline]}>
            <View style={[styles.dot, serverOnline ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.badgeText}>
              {serverOnline ? 'Node.js Online' : 'Offline / Standalone'}
            </Text>
          </View>
        </View>

        {/* Section 1: Context Monitor Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📋</Text>
            <Text style={styles.cardTitle}>Active Device Context</Text>
          </View>

          <Text style={styles.inputLabel}>Current Clipboard Content:</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            value={clipboardText}
            onChangeText={handleUpdateClipboard}
            placeholder="Clipboard content..."
            placeholderTextColor="#64748b"
          />

          <View style={styles.contextInfoRow}>
            <Text style={styles.contextInfoText}>📱 Active App: <Text style={styles.highlight}>WhatsApp / Messages</Text></Text>
          </View>
        </View>

        {/* Section 2: Voice Input & Controls */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🎙️</Text>
            <Text style={styles.cardTitle}>Voice Interaction</Text>
          </View>

          <View style={styles.micContainer}>
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={() => {
                setIsRecording(!isRecording);
                if (!isRecording) {
                  setSpeechInput('Make this shorter');
                }
              }}
            >
              <Text style={styles.micIcon}>{isRecording ? '⏹️' : '🎙️'}</Text>
            </TouchableOpacity>
            <Text style={styles.micStateText}>
              {isRecording ? 'Listening for speech...' : 'Tap microphone or use quick presets'}
            </Text>
          </View>

          <Text style={styles.inputLabel}>Speech Input Transcript:</Text>
          <TextInput
            style={styles.textInput}
            value={speechInput}
            onChangeText={setSpeechInput}
            placeholder="Type or speak prompt..."
            placeholderTextColor="#64748b"
          />

          <Text style={styles.presetHeader}>Quick Voice Presets:</Text>
          <View style={styles.presetContainer}>
            {speechPresets.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetChip}
                onPress={() => {
                  setSpeechInput(preset);
                  handleProcessIntent(preset);
                }}
              >
                <Text style={styles.presetText}>{preset}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleProcessIntent()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>⚡ Process Voice + Context</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 3: AI Intent Understanding & Execution */}
        {aiResult && (
          <View style={[styles.card, styles.resultCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🧠</Text>
              <Text style={styles.cardTitle}>Structured Intent Output</Text>
            </View>

            <View style={styles.intentRow}>
              <Text style={styles.intentLabel}>Detected Intent:</Text>
              <Text style={styles.intentValue}>{aiResult.intent}</Text>
            </View>

            <View style={styles.intentRow}>
              <Text style={styles.intentLabel}>Confidence Score:</Text>
              <Text style={styles.confidenceValue}>{(aiResult.confidence * 100).toFixed(0)}%</Text>
            </View>

            <Text style={styles.summaryText}>{aiResult.summary}</Text>

            <Text style={styles.codeLabel}>Structured JSON (Intent Router):</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>
                {JSON.stringify(aiResult, null, 2)}
              </Text>
            </View>

            {aiResult.actionPayload && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleExecuteAction}
              >
                <Text style={styles.actionButtonText}>
                  ▶️ Execute Intent Action ({aiResult.actionPayload.type})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Section 4: Action Log Notification */}
        {actionLog && (
          <View style={[styles.card, styles.actionSuccessCard]}>
            <Text style={styles.actionSuccessHeader}>✅ Action Executed Successfully</Text>
            <Text style={styles.actionSuccessMessage}>{actionLog.message}</Text>
            {actionLog.details && (
              <Text style={styles.actionSuccessDetails}>{actionLog.details}</Text>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  badgeOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: '#10b981',
  },
  dotOffline: {
    backgroundColor: '#f59e0b',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f8fafc',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultCard: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f172a',
  },
  actionSuccessCard: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  contextInfoRow: {
    marginTop: 10,
  },
  contextInfoText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  highlight: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  micContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  micButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  micButtonActive: {
    backgroundColor: '#ef4444',
  },
  micIcon: {
    fontSize: 28,
  },
  micStateText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  presetHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 8,
  },
  presetText: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  intentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  intentLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  intentValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#38bdf8',
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  summaryText: {
    fontSize: 13,
    color: '#e2e8f0',
    fontStyle: 'italic',
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  codeLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },
  codeBox: {
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  codeText: {
    color: '#38bdf8',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  actionButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionSuccessHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  actionSuccessMessage: {
    fontSize: 13,
    color: '#f8fafc',
    marginBottom: 4,
  },
  actionSuccessDetails: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
