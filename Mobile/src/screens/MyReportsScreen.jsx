import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import CartoonButton from '../components/CartoonButton';
import { colors, fonts, cartoonShadow } from '../constants/theme';
import { getMyReports } from '../services/api';
import { formatDate } from '../utils/dateUtils';

// List screen — dùng lại API GET /ChatReports/my vốn đã có sẵn ở backend
// (Authorize) nhưng chưa từng được mobile gọi tới. Khác AdminReportListScreen:
// đây là các report do CHÍNH user này gửi, chỉ xem, không có action ban/delete.
export default function MyReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);


  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        setLoading(true);
        try {
          const data = await getMyReports();
          if (mounted) setReports(data || []);
        } catch (error) {
          Alert.alert('Load reports failed', error.message || 'Please try again.');
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <Screen scroll={false}>
      <Text style={styles.title}>My Reports</Text>
      <Text style={styles.subtitle}>Reports you've submitted</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => String(item.reportId)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't reported anyone yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.reportCode}>Room #{item.roomId}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'Pending' ? styles.statusPending : styles.statusResolved,
                  ]}
                >
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.reasonText}>{item.reason}</Text>
              <Text style={styles.messageText} numberOfLines={2}>{item.violatingMessage}</Text>
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
          )}
        />
      )}

      <CartoonButton title="BACK" variant="secondary" onPress={() => navigation.goBack()} style={styles.backButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 40,
    color: colors.primary,
    fontSize: 30,
    fontFamily: fonts.black, fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.medium, fontWeight: '600',
    marginBottom: 18,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 12, flexGrow: 1 },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 40,
    fontFamily: fonts.medium, fontWeight: '500',
  },
  card: {
    ...cartoonShadow,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  reportCode: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '800', color: colors.text },
  statusBadge: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusResolved: { backgroundColor: '#DCFCE7' },
  statusText: { fontSize: 10, fontFamily: fonts.bold, fontWeight: '800', color: colors.text },
  reasonText: { fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: colors.primary, textTransform: 'capitalize', marginBottom: 4 },
  messageText: { fontSize: 13, color: colors.text, lineHeight: 19, marginBottom: 8 },
  dateText: { fontSize: 11, color: colors.muted, fontFamily: fonts.medium, fontWeight: '500' },
  backButton: { marginTop: 8 },
});
