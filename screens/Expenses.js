import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  Alert, 
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import colors from '../styles/colors';

const Expenses = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    details: false,
    amount: false,
  });

  const isValidAmount = () => /^\d+(\.\d{1,2})?$/.test(amount) && parseFloat(amount) > 0;
  const isFormValid = () => date && details.trim() && isValidAmount();

  const getAmountError = () => {
    if (!touched.amount) return null;
    if (!amount) return "Amount is required";
    if (!isValidAmount()) return "Must be a positive number";
    return null;
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const expensesList = querySnapshot.docs.map((doc, index) => ({
        id: doc.id,
        serial: index + 1,
        ...doc.data(),
      }));
      setExpenses(expensesList);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Alert.alert("Error", "Failed to fetch expenses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const addExpense = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        date,
        details: details.trim(),
        amount: parseFloat(amount),
      });
      setModalVisible(false);
      setDate(new Date().toISOString().split('T')[0]);
      setDetails('');
      setAmount('');
      fetchExpenses();
      Alert.alert("Success", "Expense added successfully!");
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert("Error", "Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setDate(new Date().toISOString().split('T')[0]);
    setDetails('');
    setAmount('');
    setTouched({
      details: false,
      amount: false,
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchExpenses();
          }}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.serial}>{item.serial}</Text>
              <View style={styles.cardContent}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.details}>{item.details}</Text>
                <Text style={styles.amount}>$ {item.amount}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expenses found</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={30} color={colors.white} />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Details</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Enter expense details"
                  multiline
                  numberOfLines={3}
                  onBlur={() => setTouched((p) => ({ ...p, details: true }))}
                />
                {touched.details && !details.trim() && (
                  <Text style={styles.errorText}>Details are required</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  onBlur={() => setTouched((p) => ({ ...p, amount: true }))}
                />
                {getAmountError() && (
                  <Text style={styles.errorText}>{getAmountError()}</Text>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.addButton, (!isFormValid() || isSubmitting) && styles.disabledButton]}
                  onPress={addExpense}
                  disabled={!isFormValid() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Add Expense</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
  },
  row: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  card: {
    width: '48%',
backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    marginBottom: 10,
    flexDirection: 'row',
  },
  serial: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 8,
  },
  cardContent: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    color: colors.text,
  },
  details: {
    fontSize: 14,
    color: colors.text,
    marginVertical: 2,
  },
  amount: {
    fontSize: 14,
    color: 'red',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  loader: {
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    fontSize: 16,
    color: colors.text,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: 'center',
    minWidth: 200,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default Expenses;
