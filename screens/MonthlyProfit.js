import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Modal, TouchableWithoutFeedback
} from 'react-native';
import { collection, getDocs, setDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import colors from '../styles/colors';
import { format, parse } from 'date-fns';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';

const MonthlyProfit = () => {
  const [expenses, setExpenses] = useState(0);
  const [income, setIncome] = useState(0);
  const [productCosts, setProductCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [previousData, setPreviousData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const now = new Date();
  const monthName = format(now, 'MMMM yyyy');
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const docId = `${currentYear}-${currentMonth + 1}`;

  useEffect(() => {
    fetchData();
  }, []);

  const parseDate = (str) => {
    try {
      return parse(str, 'yyyy-MM-dd', new Date());
    } catch {
      return null;
    }
  };

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const start = new Date(currentYear, currentMonth, 1);
      const end = new Date(currentYear, currentMonth + 1, 0);

      let totalExpenses = 0;
      const expenseSnapshot = await getDocs(collection(db, 'expenses'));
      expenseSnapshot.forEach(doc => {
        const data = doc.data();
        const date = parseDate(data.date);
        if (date && date >= start && date <= end) {
          totalExpenses += Number(data.amount || 0);
        }
      });

      let totalIncome = 0;
      const incomeSnapshot = await getDocs(collection(db, 'income'));
      incomeSnapshot.forEach(doc => {
        const data = doc.data();
        const date = parseDate(data.date);
        if (date && date >= start && date <= end) {
          totalIncome += Number(data.amount || 0);
        }
      });

      const avgCostSnapshot = await getDocs(collection(db, 'averageCosts'));
      const avgCostMap = {};
      avgCostSnapshot.forEach(doc => {
        avgCostMap[doc.id] = Number(doc.data().avgCost || 0);
      });

      const productMap = {};
      const salesSnapshot = await getDocs(collection(db, 'sales'));
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        const status = data.status?.toLowerCase();
        const saleDate = parseDate(data.date);
        if (status === 'delivered' && saleDate?.getMonth() === currentMonth && saleDate?.getFullYear() === currentYear) {
          data.products?.forEach(p => {
            const code = p.productCode;
            const qty = Number(p.quantity);
            const cost = avgCostMap[code] || 0;
            if (!productMap[code]) {
              productMap[code] = { quantity: 0, avgCost: cost };
            }
            productMap[code].quantity += qty;
          });
        }
      });

      const productData = Object.keys(productMap).map(code => {
        const { quantity, avgCost } = productMap[code];
        return {
          productCode: code,
          quantity,
          avgCost,
          total: quantity * avgCost,
        };
      });

      const totalProductCost = productData.reduce((sum, item) => sum + item.total, 0);
      const profitLoss = totalIncome - (totalExpenses + totalProductCost);

      const isEmpty = totalIncome === 0 && totalExpenses === 0 && totalProductCost === 0;
      if (!isEmpty) {
        const docRef = doc(db, 'monthlyProfit', docId);
        const existingDoc = await getDoc(docRef);

        const currentData = {
          month: monthName,
          expenses: totalExpenses,
          income: totalIncome,
          profitLoss,
          totalProductCost,
          productData,
          timestamp: Timestamp.now(),
        };

        if (!existingDoc.exists()) {
          await setDoc(docRef, currentData);
        } else {
          const oldData = existingDoc.data();
          if (
            oldData.income !== totalIncome ||
            oldData.expenses !== totalExpenses ||
            oldData.totalProductCost !== totalProductCost ||
            oldData.profitLoss !== profitLoss
          ) {
            await setDoc(docRef, currentData);
          }
        }
      }

      setExpenses(totalExpenses);
      setIncome(totalIncome);
      setProductCosts(productData);
      if (!isRefresh) setLoading(false);
    } catch (error) {
      console.log("Error fetching data:", error);
      if (!isRefresh) setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true).finally(() => setRefreshing(false));
  };

  const togglePrevious = async () => {
    if (!showPrevious) {
      try {
        const snapshot = await getDocs(collection(db, 'monthlyProfit'));
        const data = [];
        snapshot.forEach(doc => data.push(doc.data()));
        const sortedData = data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
        setPreviousData(sortedData);
        if (sortedData.length > 0) {
          setSelectedMonth(sortedData[0]);
        }
        setShowPrevious(true);
      } catch {
        Alert.alert("Error", "Couldn't fetch previous data");
      }
    } else {
      setShowPrevious(false);
    }
  };

  const recalculateMonth = async () => {
    if (!selectedMonth) return;
    
    try {
      setRecalculating(true);
      const monthDate = parse(selectedMonth.month, 'MMMM yyyy', new Date());
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);

      let totalExpenses = 0;
      const expenseSnapshot = await getDocs(collection(db, 'expenses'));
      expenseSnapshot.forEach(doc => {
        const data = doc.data();
        const date = parseDate(data.date);
        if (date && date >= start && date <= end) {
          totalExpenses += Number(data.amount || 0);
        }
      });

      let totalIncome = 0;
      const incomeSnapshot = await getDocs(collection(db, 'income'));
      incomeSnapshot.forEach(doc => {
        const data = doc.data();
        const date = parseDate(data.date);
        if (date && date >= start && date <= end) {
          totalIncome += Number(data.amount || 0);
        }
      });

      const avgCostSnapshot = await getDocs(collection(db, 'averageCosts'));
      const avgCostMap = {};
      avgCostSnapshot.forEach(doc => {
        avgCostMap[doc.id] = Number(doc.data().avgCost || 0);
      });

      const productMap = {};
      const salesSnapshot = await getDocs(collection(db, 'sales'));
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        const status = data.status?.toLowerCase();
        const saleDate = parseDate(data.date);
        if (status === 'delivered' && saleDate?.getMonth() === month && saleDate?.getFullYear() === year) {
          data.products?.forEach(p => {
            const code = p.productCode;
            const qty = Number(p.quantity);
            const cost = avgCostMap[code] || 0;
            if (!productMap[code]) {
              productMap[code] = { quantity: 0, avgCost: cost };
            }
            productMap[code].quantity += qty;
          });
        }
      });

      const productData = Object.keys(productMap).map(code => {
        const { quantity, avgCost } = productMap[code];
        return {
          productCode: code,
          quantity,
          avgCost,
          total: quantity * avgCost,
        };
      });

      const totalProductCost = productData.reduce((sum, item) => sum + item.total, 0);
      const profitLoss = totalIncome - (totalExpenses + totalProductCost);

      const docRef = doc(db, 'monthlyProfit', `${year}-${month + 1}`);
      await setDoc(docRef, {
        month: selectedMonth.month,
        expenses: totalExpenses,
        income: totalIncome,
        profitLoss,
        totalProductCost,
        productData,
        timestamp: Timestamp.now(),
      });

      // Update the UI with recalculated data
      const updatedData = previousData.map(item => 
        item.month === selectedMonth.month ? {
          ...item,
          expenses: totalExpenses,
          income: totalIncome,
          profitLoss,
          totalProductCost,
          productData
        } : item
      );
      
      setPreviousData(updatedData);
      setSelectedMonth(updatedData.find(item => item.month === selectedMonth.month));
      Alert.alert("Success", "Month data recalculated successfully!");
    } catch (error) {
      console.log("Recalculation error:", error);
      Alert.alert("Error", "Failed to recalculate month data");
    } finally {
      setRecalculating(false);
    }
  };

  const totalProductCost = productCosts.reduce((sum, item) => sum + item.total, 0);
  const profitLoss = income - (expenses + totalProductCost);

  if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Financial Summary - {monthName}</Text>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Monthly Expenses:</Text>
          <Text style={[styles.cardValue, { color: 'red' }]}>₹{expenses.toFixed(2)}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Monthly Income:</Text>
          <Text style={[styles.cardValue, { color: 'green' }]}>₹{income.toFixed(2)}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Total Product Cost:</Text>
          <Text style={[styles.cardValue, { color: 'red' }]}>₹{totalProductCost.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.cardRow, { 
          borderTopWidth: 1, 
          borderTopColor: '#eee', 
          paddingTop: 10,
          marginTop: 5
        }]}>
          <Text style={[styles.cardLabel, { fontWeight: 'bold' }]}>Monthly Profit/Loss:</Text>
          <Text style={[styles.cardValue, { 
            color: profitLoss >= 0 ? 'green' : 'red',
            fontWeight: 'bold',
            fontSize: 18
          }]}>
            ₹{profitLoss.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { marginTop: 20 }]}>
        <Text style={styles.tableTitle}>Monthly Product Cost Breakdown</Text>
        
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Product Code</Text>
          <Text style={styles.headerText}>Qty</Text>
          <Text style={styles.headerText}>Unit Cost</Text>
          <Text style={styles.headerText}>Total Cost</Text>
        </View>

        {productCosts.map((item, index) => (
          <View 
            key={index} 
            style={[
              styles.tableRow,
              { backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }
            ]}
          >
            <Text style={styles.rowText}>{item.productCode}</Text>
            <Text style={styles.rowText}>{item.quantity}</Text>
            <Text style={styles.rowText}>₹{item.avgCost.toFixed(2)}</Text>
            <Text style={[styles.rowText, { color: 'red' }]}>₹{item.total.toFixed(2)}</Text>
          </View>
        ))}

        <View style={[styles.tableRow, { 
          backgroundColor: '#f0f0f0',
          borderTopWidth: 1,
          borderTopColor: '#ddd',
          marginTop: 5
        }]}>
          <Text style={[styles.rowText, { fontWeight: 'bold' }]}>Total</Text>
          <Text style={[styles.rowText, { fontWeight: 'bold' }]}>
            {productCosts.reduce((sum, item) => sum + item.quantity, 0)}
          </Text>
          <Text style={[styles.rowText, { fontWeight: 'bold' }]}>-</Text>
          <Text style={[styles.rowText, { fontWeight: 'bold', color: 'red' }]}>
            ₹{totalProductCost.toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={togglePrevious}
      >
        <Text style={styles.toggleButtonText}>
          {showPrevious ? "Hide Previous Months" : "Show Previous Months"}
        </Text>
      </TouchableOpacity>

      {showPrevious && (
        <View style={[styles.card, { marginTop: 10 }]}>
          <Text style={styles.tableTitle}>Previous Months Data</Text>
          
          <View style={styles.monthSelectorContainer}>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={previousData.map(item => ({ label: item.month, value: item }))}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select month"
              searchPlaceholder="Search..."
              value={selectedMonth}
              onChange={item => {
                setSelectedMonth(item.value);
              }}
              renderLeftIcon={() => (
                <AntDesign
                  style={styles.icon}
                  color={colors.primary}
                  name="calendar"
                  size={20}
                />
              )}
            />
            
            <TouchableOpacity 
              style={styles.recalculateButton}
              onPress={recalculateMonth}
              disabled={recalculating}
            >
              {recalculating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.recalculateButtonText}>Recalculate</Text>
              )}
            </TouchableOpacity>
          </View>

          {selectedMonth && (
            <View style={[
              styles.prevCard,
              { backgroundColor: '#f9f9f9' }
            ]}>
              <Text style={styles.prevMonth}>{selectedMonth.month}</Text>
              
              <View style={styles.prevRow}>
                <Text style={styles.prevLabel}>Expenses:</Text>
                <Text style={[styles.prevValue, { color: 'red' }]}>₹{selectedMonth.expenses.toFixed(2)}</Text>
              </View>
              
              <View style={styles.prevRow}>
                <Text style={styles.prevLabel}>Income:</Text>
                <Text style={[styles.prevValue, { color: 'green' }]}>₹{selectedMonth.income.toFixed(2)}</Text>
              </View>
              
              <View style={styles.prevRow}>
                <Text style={styles.prevLabel}>Product Cost:</Text>
                <Text style={[styles.prevValue, { color: 'red' }]}>₹{selectedMonth.totalProductCost.toFixed(2)}</Text>
              </View>
              
              <View style={styles.prevRow}>
                <Text style={[styles.prevLabel, { fontWeight: 'bold' }]}>Profit/Loss:</Text>
                <Text style={[
                  styles.prevValue, 
                  { 
                    color: selectedMonth.profitLoss >= 0 ? 'green' : 'red',
                    fontWeight: 'bold'
                  }
                ]}>
                  ₹{selectedMonth.profitLoss.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.primary,
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    color: '#333',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginBottom: 5,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  rowText: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  toggleButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  prevCard: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  prevMonth: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: colors.primary,
  },
  prevRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  prevLabel: {
    fontSize: 14,
    color: '#555',
  },
  prevValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  monthSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dropdown: {
    flex: 1,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginRight: 10,
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#333',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
  },
  icon: {
    marginRight: 5,
  },
  recalculateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recalculateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default MonthlyProfit;
