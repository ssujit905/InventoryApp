import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import colors from '../styles/colors';

const ProfitLossScreen = () => {
  const [expenses, setExpenses] = useState(0);
  const [purchasedAmount, setPurchasedAmount] = useState(0);
  const [income, setIncome] = useState(0);
  const [investment, setInvestment] = useState(0);
  const [productCosts, setProductCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchData = async () => {
    try {
      let totalExpenses = 0;
      const expensesSnapshot = await getDocs(collection(db, 'expenses'));
      expensesSnapshot.forEach(doc => {
        totalExpenses += Number(doc.data().amount || 0);
      });

      let totalIncome = 0;
      const incomeSnapshot = await getDocs(collection(db, 'income'));
      incomeSnapshot.forEach(doc => {
        totalIncome += Number(doc.data().amount || 0);
      });

      let totalInvestment = 0;
      const investmentSnapshot = await getDocs(collection(db, 'investment'));
      investmentSnapshot.forEach(doc => {
        totalInvestment += Number(doc.data().amount || 0);
      });

      let purchaseSummaryValue = 0;
      const purchaseSummarySnapshot = await getDocs(collection(db, 'purchaseSummary'));
      purchaseSummarySnapshot.forEach(doc => {
        purchaseSummaryValue += Number(doc.data().value || 0);
      });

      const salesSnapshot = await getDocs(collection(db, 'sales'));
      const avgCostsSnapshot = await getDocs(collection(db, 'averageCosts'));
      const avgCostMap = {};

      avgCostsSnapshot.forEach((doc) => {
        avgCostMap[doc.id] = doc.data().avgCost || 0;
      });

      const productCostMap = {};

      salesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status !== "delivered" && data.status !== "Delivered") return;

        data.products?.forEach((product) => {
          const code = product.productCode;
          const qty = parseInt(product.quantity);
          const unitCost = avgCostMap[code] || 0;

          if (!productCostMap[code]) {
            productCostMap[code] = { quantity: 0, unitCost };
          }

          productCostMap[code].quantity += qty;
        });
      });

      const productCostData = Object.keys(productCostMap).map((code) => {
        const { quantity, unitCost } = productCostMap[code];
        return {
          productCode: code,
          quantity,
          unitCost,
          totalCost: quantity * unitCost,
        };
      });

      setExpenses(totalExpenses);
      setIncome(totalIncome);
      setInvestment(totalInvestment);
      setPurchasedAmount(purchaseSummaryValue);
      setProductCosts(productCostData);
      setLoading(false);
    } catch (err) {
      console.log('Error fetching data:', err);
    }
  };

  const totalProductCost = productCosts.reduce((sum, item) => sum + item.totalCost, 0);
  const totalProfitLoss = income - (expenses + totalProductCost);
  const cashInHand = (income + investment) - (expenses + purchasedAmount);
  const remainingStockValue = purchasedAmount - totalProductCost;

  if (loading && !refreshing)
    return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Financial Summary</Text>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Total Expenses:</Text>
          <Text style={[styles.cardValue, { color: 'red' }]}>₹{expenses.toFixed(2)}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Total Purchased Amount:</Text>
          <Text style={[styles.cardValue, { color: 'red' }]}>₹{purchasedAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Total Income:</Text>
          <Text style={[styles.cardValue, { color: 'green' }]}>₹{income.toFixed(2)}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Total Investment:</Text>
          <Text style={[styles.cardValue, { color: 'green' }]}>₹{investment.toFixed(2)}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Cash in Hand:</Text>
          <Text style={[styles.cardValue, { color: cashInHand >= 0 ? 'green' : 'red' }]}>
            ₹{cashInHand.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Remaining Stock Value:</Text>
          <Text style={[styles.cardValue, { color: 'green' }]}>₹{remainingStockValue.toFixed(2)}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Total Product Cost:</Text>
          <Text style={[styles.cardValue, { color: 'red' }]}>₹{totalProductCost.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.cardRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }]}>
          <Text style={[styles.cardLabel, { fontWeight: 'bold' }]}>Total Profit/Loss:</Text>
          <Text style={[styles.cardValue, { 
            color: totalProfitLoss >= 0 ? 'green' : 'red',
            fontWeight: 'bold',
            fontSize: 18
          }]}>
            ₹{totalProfitLoss.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { marginTop: 20 }]}>
        <Text style={styles.tableTitle}>Product Cost Breakdown</Text>
        
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
            <Text style={styles.rowText}>₹{item.unitCost.toFixed(2)}</Text>
            <Text style={[styles.rowText, { color: 'red' }]}>₹{item.totalCost.toFixed(2)}</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
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
});

export default ProfitLossScreen;
