import React, { useState, useEffect } from 'react';
import { registerRootComponent } from 'expo';
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
  Modal,
} from 'react-native';
import {
  checkServerHealth,
  processLifeAssistant,
  submitLearningFeedback,
  fetchLearningRules,
} from './src/services/apiService';
import { getFusedContext } from './src/services/contextService';
import { executeAgentAction } from './src/services/actionEngine';

export default function App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [ollamaInfo, setOllamaInfo] = useState({ status: 'checking', targetModel: 'llama3.2:1b' });
  const [promptText, setPromptText] = useState("I'm getting late for college");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Agent state
  const [agentResult, setAgentResult] = useState(null);
  const [actionLog, setActionLog] = useState(null);
  const [learningNotice, setLearningNotice] = useState(null);
  const [learnedRules, setLearnedRules] = useState([]);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Fused context state
  const contextData = getFusedContext();

  useEffect(() => {
    async function initServer() {
      const health = await checkServerHealth();
      setServerOnline(health.online);
      if (health.ollama) {
        setOllamaInfo(health.ollama);
      }

      const rulesRes = await fetchLearningRules();
      if (rulesRes.rules) {
        setLearnedRules(rulesRes.rules);
      }
    }
    initServer();
  }, []);

  const handleRunAgent = async (textToRun = promptText) => {
    if (!textToRun.trim()) return;
    setLoading(true);
    setActionLog(null);
    setLearningNotice(null);

    const response = await processLifeAssistant(textToRun, contextData);
    setLoading(false);

    if (response && response.result) {
      setAgentResult(response.result);
    }
  };

  const handleChooseAction = async (actionObj, choiceType) => {
    if (!actionObj) return;

    // 1. Execute action safely
    const log = executeAgentAction(actionObj);
    setActionLog(log);

    // 2. Trigger Verification -> Learning loop
    const feedback = await submitLearningFeedback(
      actionObj.id || choiceType,
      choiceType,
      'Metro delay 20 mins'
    );

    if (feedback && feedback.learnedRule) {
      setLearningNotice(feedback.learnedRule.rule || feedback.message);
      // Refresh learned rules list
      const updatedRules = await fetchLearningRules();
      if (updatedRules.rules) setLearnedRules(updatedRules.rules);
    }
  };

  const quickScenarios = [
    "I'm getting late for college",
    "Pre-draft status update to study group",
    "Check commute & traffic updates",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header with Server & Ollama llama3.2:1b status */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>ContextFlow</Text>
            <Text style={styles.appTagline}>Autonomous Life Assistant</Text>
          </View>
          <View style={styles.statusGroup}>
            <View style={[styles.badge, serverOnline ? styles.badgeOnline : styles.badgeOffline]}>
              <View style={[styles.dot, serverOnline ? styles.dotOnline : styles.dotOffline]} />
              <Text style={styles.badgeText}>{serverOnline ? 'Server: 127.0.0.1' : 'Offline'}</Text>
            </View>
            <View style={[styles.badge, styles.badgeOllama]}>
              <Text style={styles.badgeText}>🦙 {ollamaInfo.targetModel || 'llama3.2:1b'}</Text>
            </View>
          </View>
        </View>

        {/* Fused Context Drawer */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.rowAlign}>
              <Text style={styles.cardIcon}>🌐</Text>
              <Text style={styles.cardTitle}>Fused Multi-Modal Context</Text>
            </View>
            <TouchableOpacity onPress={() => setShowRulesModal(true)}>
              <Text style={styles.memoryLink}>🧠 Learning Memory ({learnedRules.length})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contextGrid}>
            <View style={styles.contextBox}>
              <Text style={styles.contextBoxLabel}>📍 Location</Text>
              <Text style={styles.contextBoxValue}>{contextData.location}</Text>
            </View>
            <View style={styles.contextBox}>
              <Text style={styles.contextBoxLabel}>📅 Calendar Event</Text>
              <Text style={styles.contextBoxValue}>
                {contextData.calendar.event} @ {contextData.calendar.startTime}
              </Text>
            </View>
          </View>

          <View style={styles.contextGrid}>
            <View style={styles.contextBox}>
              <Text style={styles.contextBoxLabel}>🚦 Traffic Alert</Text>
              <Text style={[styles.contextBoxValue, styles.warningText]}>
                {contextData.traffic.metroStatus}
              </Text>
            </View>
            <View style={styles.contextBox}>
              <Text style={styles.contextBoxLabel}>📋 Clipboard Context</Text>
              <Text style={styles.contextBoxValue} numberOfLines={1}>
                "{contextData.clipboard}"
              </Text>
            </View>
          </View>
        </View>

        {/* Prompt & Voice Action Bar */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🎙️</Text>
            <Text style={styles.cardTitle}>Voice & Text Trigger</Text>
          </View>

          <View style={styles.micContainer}>
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={() => {
                setIsRecording(!isRecording);
                if (!isRecording) {
                  setPromptText("I'm getting late for college");
                }
              }}
            >
              <Text style={styles.micIcon}>{isRecording ? '⏹️' : '🎙️'}</Text>
            </TouchableOpacity>
            <Text style={styles.micStateText}>
              {isRecording ? 'Listening for voice prompt...' : 'Tap mic or select hackathon scenario'}
            </Text>
          </View>

          <TextInput
            style={styles.textInput}
            value={promptText}
            onChangeText={setPromptText}
            placeholder="Tell ContextFlow what's happening..."
            placeholderTextColor="#64748b"
          />

          <View style={styles.presetContainer}>
            {quickScenarios.map((sc, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.presetChip}
                onPress={() => {
                  setPromptText(sc);
                  handleRunAgent(sc);
                }}
              >
                <Text style={styles.presetText}>{sc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleRunAgent()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>⚡ Run Autonomous Life Loop</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Intent & Action Card */}
        {agentResult && (
          <View style={[styles.card, styles.agentCard]}>
            <View style={styles.cardHeaderBetween}>
              <View style={styles.rowAlign}>
                <Text style={styles.cardIcon}>🤖</Text>
                <Text style={styles.cardTitle}>Agent Recommendation</Text>
              </View>
              <Text style={styles.intentTag}>{agentResult.intent}</Text>
            </View>

            {/* Reasoning text */}
            <Text style={styles.reasoningText}>{agentResult.reasoning}</Text>

            {/* Responsible Agent Notice */}
            <View style={styles.responsibleNoticeBox}>
              <Text style={styles.responsibleNoticeTitle}>🛡️ Responsible Agent Safeguard</Text>
              <Text style={styles.responsibleNoticeText}>
                {agentResult.responsibleAgentNote}
              </Text>
            </View>

            {/* Context used tags */}
            <View style={styles.contextTagsRow}>
              {agentResult.contextUsed && agentResult.contextUsed.map((ctx, i) => (
                <Text key={i} style={styles.contextTag}>• {ctx}</Text>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {agentResult.action && (
                <TouchableOpacity
                  style={styles.actionButtonPrimary}
                  onPress={() => handleChooseAction(agentResult.action, 'BOOK_CAB')}
                >
                  <Text style={styles.actionButtonPrimaryText}>{agentResult.action.title}</Text>
                  {agentResult.action.description && (
                    <Text style={styles.actionButtonSub}>{agentResult.action.description}</Text>
                  )}
                </TouchableOpacity>
              )}

              {agentResult.alternativeAction && (
                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  onPress={() => handleChooseAction(agentResult.alternativeAction, 'TAKE_METRO')}
                >
                  <Text style={styles.actionButtonSecondaryText}>{agentResult.alternativeAction.title}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Action Executed Banner */}
        {actionLog && (
          <View style={[styles.card, styles.actionSuccessCard]}>
            <Text style={styles.actionSuccessHeader}>✅ {actionLog.title || 'Action Confirmed'}</Text>
            <Text style={styles.actionSuccessMessage}>{actionLog.message}</Text>
            {actionLog.details && (
              <Text style={styles.actionSuccessDetails}>{actionLog.details}</Text>
            )}
          </View>
        )}

        {/* Verification & Learning Loop Toast */}
        {learningNotice && (
          <View style={[styles.card, styles.learningCard]}>
            <View style={styles.rowAlign}>
              <Text style={styles.cardIcon}>🧠</Text>
              <Text style={styles.learningHeader}>Verification → Learning Loop Updated</Text>
            </View>
            <Text style={styles.learningText}>
              Stored Rule: <Text style={styles.learningRuleHighlight}>"{learningNotice}"</Text>
            </Text>
            <Text style={styles.learningSubtext}>
              Next time this context occurs, ContextFlow will automatically apply your learned preference.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* Learning Memory Modal */}
      <Modal visible={showRulesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.cardHeaderBetween}>
              <Text style={styles.cardTitle}>🧠 Learned User Memory</Text>
              <TouchableOpacity onPress={() => setShowRulesModal(false)}>
                <Text style={styles.closeModalText}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {learnedRules.map((r, i) => (
                <View key={i} style={styles.ruleItem}>
                  <Text style={styles.ruleText}>• {r.rule}</Text>
                  {r.source && <Text style={styles.ruleSource}>{r.source}</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    marginBottom: 16,
    marginTop: 6,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusGroup: {
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  badgeOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  badgeOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  badgeOllama: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotOnline: { backgroundColor: '#10b981' },
  dotOffline: { backgroundColor: '#f59e0b' },
  badgeText: {
    fontSize: 10,
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
  agentCard: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f172a',
  },
  actionSuccessCard: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  learningCard: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  memoryLink: {
    fontSize: 12,
    color: '#a855f7',
    fontWeight: '600',
  },
  contextGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contextBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contextBoxLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  contextBoxValue: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '500',
  },
  warningText: {
    color: '#f59e0b',
  },
  micContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  micButtonActive: {
    backgroundColor: '#ef4444',
  },
  micIcon: {
    fontSize: 26,
  },
  micStateText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 6,
  },
  presetText: {
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: '700',
  },
  intentTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reasoningText: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 19,
    marginBottom: 12,
  },
  responsibleNoticeBox: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  responsibleNoticeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 2,
  },
  responsibleNoticeText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  contextTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  contextTag: {
    fontSize: 10,
    color: '#64748b',
    marginRight: 10,
  },
  actionButtonsContainer: {
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionButtonPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  actionButtonSecondary: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  actionSuccessHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  actionSuccessMessage: {
    fontSize: 13,
    color: '#f8fafc',
    marginBottom: 2,
  },
  actionSuccessDetails: {
    fontSize: 11,
    color: '#94a3b8',
  },
  learningHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c084fc',
  },
  learningText: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 4,
  },
  learningRuleHighlight: {
    color: '#a855f7',
    fontWeight: '700',
  },
  learningSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  closeModalText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  modalScroll: {
    marginTop: 10,
  },
  ruleItem: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '600',
  },
  ruleSource: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
});

registerRootComponent(App);
