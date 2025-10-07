import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated
} from 'react-native';
import uuid from 'react-native-uuid';
import api from '../services/api';
import styles from '../styles/chatScreenStyles';

export default function ChatScreen() {
  const [messages, setMessages]   = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const [typing, setTyping]       = useState(false);

  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [queuedNew, setQueuedNew]   = useState(0);
  const jumpAnim = useRef(new Animated.Value(0)).current;

  const user = { id: 'user-1' };
  const bot  = { id: 'bot-1', name: 'ClinicFlow AI' };

  const pushMessage = (m) => setMessages((prev) => [...prev, m]);

  const setJumpVisible = useCallback((visible) => {
    Animated.timing(jumpAnim, {
      toValue: visible ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [jumpAnim]);

  useEffect(() => {
    api.ping().catch(() => {});
    api.sendMessage('hi', null)
      .then((data) => {
        if (!data || !Array.isArray(data.response)) throw new Error('Invalid response from server');
        if (data.sessionId) setSessionId(data.sessionId);
        const now = Date.now();
        setMessages(
          data.response.map((t) => ({
            id: String(uuid.v4()), author: bot, text: t, createdAt: now,
          }))
        );
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
      })
      .catch(() =>
        pushMessage({
          id: 'boot-err', author: bot,
          text: '⚠️ Could not connect. Is the backend running?', createdAt: Date.now(),
        })
      );
  }, []);

  const appendBotMessages = (texts) => {
    const now = Date.now();
    setMessages((prev) => {
      const appended = texts.map((t) => ({
        id: String(uuid.v4()), author: bot, text: t, createdAt: now,
      }));
      if (!isAtBottom) setQueuedNew((c) => c + appended.length);
      return [...prev, ...appended];
    });

    if (isAtBottom) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } else {
      setJumpVisible(true);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    pushMessage({ id: String(uuid.v4()), author: user, text, createdAt: Date.now() });
    setInput('');
    setTyping(true);

    try {
      const data = await api.sendMessage(text, sessionId);
      if (!data || !Array.isArray(data.response)) throw new Error('Invalid response format');
      if (!sessionId && data.sessionId) setSessionId(data.sessionId);
      appendBotMessages(data.response);
    } catch (err) {
      appendBotMessages([`⚠️ ${err?.message || 'Request failed'}`]);
    } finally {
      setTyping(false);
      setSending(false);
    }
  };

  const onScroll = ({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const threshold = 32;
    const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - threshold;

    if (atBottom !== isAtBottom) {
      setIsAtBottom(atBottom);
      setJumpVisible(!atBottom);
      if (atBottom && queuedNew > 0) setQueuedNew(0);
    }
  };

  const jumpToLatest = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
    setIsAtBottom(true);
    setQueuedNew(0);
    setJumpVisible(false);
  };

  const Bubble = ({ item }) => {
    const isUser = item.author.id === user.id;
    return (
      <View style={[styles.bubbleRow, isUser ? styles.rowRight : styles.rowLeft]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textBot]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 100, android: 0 })}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator
        persistentScrollbar
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {messages.map((m) => (
          <Bubble key={m.id} item={m} />
        ))}
        {typing && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" />
            <Text style={{ marginLeft: 8, color: '#666' }}>ClinicFlow AI is typing…</Text>
          </View>
        )}
      </ScrollView>

      <Animated.View
        pointerEvents={isAtBottom ? 'none' : 'auto'}
        style={[
          styles.jumpWrap,
          {
            opacity: jumpAnim,
            transform: [{ translateY: jumpAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity style={styles.jumpBtn} onPress={jumpToLatest}>
          <Text style={styles.jumpText}>
            Jump to latest{queuedNew > 0 ? ` (${queuedNew})` : ''} ↓
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          editable={!sending}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, sending && { opacity: 0.5 }]}
          onPress={send}
          disabled={sending}
        >
          <Text style={styles.sendText}>{sending ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
