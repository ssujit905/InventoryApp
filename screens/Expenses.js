import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { MaterialIcons } from '@expo/vector-icons';
import styles from '../styles/expensesStyles';
import colors from '../styles/colors';

const Expenses = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!date || !details || !amount) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        date,
        details,
        amount: parseFloat(amount),
      });
      console.log('Expense added with ID:', docRef.id);
      setModalVisible(false);
      setDate(new Date().toISOString().split('T')[0]);
      setDetails('');
      setAmount('');
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchExpenses}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serial}>{item.serial}</Text>
            <View>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.details}>{item.details}</Text>
              <Text style={styles.amount}>$ {item.amount}</Text>
            </View>
          </View>
        )}
      />

      {/* Floating Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={30} color={colors.white} />
      </TouchableOpacity>

      {/* Modal Form */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>

            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            <TextInput
              style={styles.input}
              value={details}
              onChangeText={setDetails}
              placeholder="Expense Details"
            />

            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount"
              keyboardType="numeric"
            />

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={addExpense}>
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Expenses;

