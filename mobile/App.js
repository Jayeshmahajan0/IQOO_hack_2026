import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  checkServerHealth,
  processLifeAssistant,
  submitLearningFeedback,
  fetchLearningRules,
  getServerUrl,
  setServerUrl,
} from './src/services/apiService';
import { getFusedContext } from './src/services/contextService';
import { executeAgentAction } from './src/services/actionEngine';

export default function App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState('checking');
  const [serverIpInput, setServerIpInput] = useState(getServerUrl());
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Chat & Conversation Feed State
  const [messages, setMessages] = useState([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: "Hello! I'm ContextFlow, your autonomous AI assistant. Tell me what you'd like to do, book, or set up today.",
      timestamp: 'Just now',
      actionCard: null,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  // Active context & memory state
  const contextData = getFusedContext();
  const [learnedRules, setLearnedRules] = useState([]);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  const scrollViewRef = useRef(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async (targetUrl = getServerUrl()) => {
    const health = await checkServerHealth(targetUrl);
    setServerOnline(health.online);
    if (health.ollama) {
      setOllamaStatus(health.ollama.status === 'online' ? 'llama3.2:1b Online' : 'Local AI Active');
    }
    const rulesRes = await fetchLearningRules(targetUrl);
    if (rulesRes && rulesRes.rules) {
      setLearnedRules(rulesRes.rules);
    }
  };

  const handleSaveSettings = () => {
    setServerUrl(serverIpInput);
    setShowSettingsModal(false);
    initApp(serverIpInput);
  };

  const handleSendMessage = async (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text) return;

    // 1. Add User message to chat feed
    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // 2. Query AI Agent
    const res = await processLifeAssistant(text, contextData);
    setLoading(false);

    if (res && res.result) {
      const assistantMsg = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: res.result.speechReply || 'Processed your request.',
        intent: res.result.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCard: res.result.actionCard,
        contextUsed: res.result.contextUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const handleExecuteAction = async (msgId, actionCard) => {
    if (!actionCard) return;

    // Execute client action
    const execution = executeAgentAction(actionCard);

    // Update message state with confirmation badge
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              executed: true,
              executionDetails: execution,
            }
          : m
      )
    );

    // Submit learning feedback
    const feedback = await submitLearningFeedback(actionCard.type, actionCard.title);
    if (feedback && feedback.learnedRule) {
      setToastNotice(feedback.learnedRule.rule || 'Preference saved to AI memory!');
      setTimeout(() => setToastNotice(null), 4000);

      const rulesRes = await fetchLearningRules();
      if (rulesRes && rulesRes.rules) setLearnedRules(rulesRes.rules);
    }
  };

  const quickActionDock = [
    { label: '🚕 Book Ride', prompt: 'I need a ride, book cab' },
    { label: '🎵 Play Music', prompt: 'Play focus music on Spotify' },
    { label: '📅 My Schedule', prompt: 'What is on my schedule today?' },
    { label: '💬 Text Contact', prompt: 'Draft a message to Rahul' },
    { label: '⏰ Set Alarm', prompt: 'Set an alarm for 7 AM' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandTitle}>ContextFlow</Text>
          <Text style={styles.brandSub}>Actionable AI Assistant</Text>
        </View>

        <View style={styles.topRightControls}>
          {/* Status Badge */}
          <TouchableOpacity
            style={[styles.statusBadge, serverOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}
            onPress={() => setShowSettingsModal(true)}
          >
            <View style={[styles.statusDot, serverOnline ? styles.dotGreen : styles.dotAmber]} />
            <Text style={styles.statusText}>
              {serverOnline ? 'Connected' : 'Offline'}
            </Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSettingsModal(true)}>
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Minimalist Context Bar */}
      <View style={styles.contextBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contextBarScroll}>
          <TouchableOpacity style={styles.contextChip} onPress={() => setShowMemoryModal(true)}>
            <Text style={styles.contextChipText}>🧠 Memory: {learnedRules.length} Rules</Text>
          </TouchableOpacity>
          <View style={styles.contextChip}>
            <Text style={styles.contextChipText}>📍 {contextData.location.slice(0, 18)}...</Text>
          </View>
          <View style={styles.contextChip}>
            <Text style={styles.contextChipText}>📅 Next: {contextData.calendar.event}</Text>
          </View>
          <View style={styles.contextChip}>
            <Text style={styles.contextChipText}>🤖 {ollamaStatus}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Floating Learning Toast Notice */}
      {toastNotice && (
        <View style={styles.toastCard}>
          <Text style={styles.toastTitle}>✨ Preference Learned</Text>
          <Text style={styles.toastText}>{toastNotice}</Text>
        </View>
      )}

      {/* Chat Feed */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.sender === 'user' ? styles.userRow : styles.assistantRow,
              ]}
            >
              {/* Avatar Icon */}
              {msg.sender === 'assistant' && (
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>⚡</Text>
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  msg.sender === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {/* Speech Reply */}
                <Text style={styles.bubbleText}>{msg.text}</Text>
                <Text style={styles.timestampText}>{msg.timestamp}</Text>

                {/* Executable Action Card */}
                {msg.actionCard && (
                  <View style={styles.actionCardContainer}>
                    <View style={styles.actionCardHeader}>
                      <Text style={styles.actionCardTitle}>{msg.actionCard.title}</Text>
                      {msg.actionCard.price && (
                        <Text style={styles.actionCardPrice}>{msg.actionCard.price}</Text>
                      )}
                    </View>

                    {msg.actionCard.subtitle && (
                      <Text style={styles.actionCardSubtitle}>{msg.actionCard.subtitle}</Text>
                    )}

                    {!msg.executed ? (
                      <TouchableOpacity
                        style={styles.executeButton}
                        onPress={() => handleExecuteAction(msg.id, msg.actionCard)}
                      >
                        <Text style={styles.executeButtonText}>
                          ▶ {msg.actionCard.buttonText || 'Execute Action'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.executedBanner}>
                        <Text style={styles.executedBannerText}>
                          ✓ {msg.executionDetails?.title || 'Action Completed'}
                        </Text>
                        <Text style={styles.executedSubtext}>
                          {msg.executionDetails?.message}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))}

          {loading && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View style={styles.aiAvatar}>
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
              <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
                <Text style={styles.loadingText}>ContextFlow is reasoning...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Action Dock */}
        <View style={styles.quickDock}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dockScroll}>
            {quickActionDock.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.dockChip}
                onPress={() => handleSendMessage(item.prompt)}
              >
                <Text style={styles.dockChipText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Input Controls */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
            onPress={() => {
              setIsRecording(!isRecording);
              if (!isRecording) {
                handleSendMessage("I'm getting late for college, book cab");
              }
            }}
          >
            <Text style={styles.micBtnIcon}>{isRecording ? '⏹' : '🎙️'}</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask AI to book, run, message, or talk..."
            placeholderTextColor="#64748b"
            onSubmitEditing={() => handleSendMessage()}
          />

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => handleSendMessage()}
            disabled={loading}
          >
            <Text style={styles.sendBtnIcon}>➔</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Settings / IP Config Modal */}
      <Modal visible={showSettingsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⚙️ Backend Server Host IP</Text>
            <Text style={styles.modalDescription}>
              Enter your PC's local Wi-Fi IP address so your phone can communicate with the Node server over Wi-Fi:
            </Text>

            <Text style={styles.inputLabel}>Server Host URL:</Text>
            <TextInput
              style={styles.modalInput}
              value={serverIpInput}
              onChangeText={setServerIpInput}
              placeholder="e.g. http://10.142.79.70:5000"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={handleSaveSettings}
              >
                <Text style={styles.modalBtnSaveText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Learning Memory Modal */}
      <Modal visible={showMemoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>🧠 Learned AI Memory</Text>
              <TouchableOpacity onPress={() => setShowMemoryModal(false)}>
                <Text style={styles.closeText}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.rulesList}>
              {learnedRules.map((rule, idx) => (
                <View key={idx} style={styles.ruleCard}>
                  <Text style={styles.ruleText}>• {rule.rule}</Text>
                  {rule.source && <Text style={styles.ruleSub}>{rule.source}</Text>}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBadgeOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#f59e0b',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotGreen: { backgroundColor: '#10b981' },
  dotAmber: { backgroundColor: '#f59e0b' },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f8fafc',
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#1e293b',
    borderRadius: 10,
  },
  iconBtnText: {
    fontSize: 14,
  },
  contextBar: {
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  contextBarScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  contextChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contextChipText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  toastCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.95)',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 4,
  },
  toastTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  toastText: {
    color: '#e0e7ff',
    fontSize: 11,
    marginTop: 2,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  aiAvatarText: {
    fontSize: 16,
    color: '#ffffff',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 14,
  },
  userBubble: {
    backgroundColor: '#4f46e5',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#131b2e',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  loadingBubble: {
    paddingVertical: 10,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  bubbleText: {
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 20,
  },
  timestampText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  actionCardContainer: {
    marginTop: 12,
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
  },
  actionCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  actionCardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  executeButton: {
    marginTop: 10,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  executeButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  executedBanner: {
    marginTop: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  executedBannerText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 12,
  },
  executedSubtext: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  quickDock: {
    paddingVertical: 6,
    backgroundColor: '#090d16',
  },
  dockScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dockChip: {
    backgroundColor: '#131b2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dockChipText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: {
    backgroundColor: '#ef4444',
  },
  micBtnIcon: {
    fontSize: 20,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#131b2e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#131b2e',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  modalBtnCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalBtnSave: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  modalBtnSaveText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  rulesList: {
    maxHeight: 280,
  },
  ruleCard: {
    backgroundColor: '#131b2e',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  ruleText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '500',
  },
  ruleSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
});

registerRootComponent(App);
