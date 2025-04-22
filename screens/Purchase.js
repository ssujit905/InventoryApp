import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import colors from '../styles/colors';

const Purchase = () => {
  const [stockInData, setStockInData] = useState([]);
  const [unitCosts, setUnitCosts] = useState({});
  const [purchaseData, setPurchaseData] = useState([]);
  const [avgCostData, setAvgCostData] = useState([]);
  const [totalPurchaseCost, setTotalPurchaseCost] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const stockSnapshot = await getDocs(collection(db, 'stockIn'));
      const stockData = stockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStockInData(stockData);

      const unitCostSnapshot = await getDocs(collection(db, 'unitCosts'));
      const costData = {};
      unitCostSnapshot.docs.forEach(doc => {
        costData[doc.id] = doc.data().unitCost;
      });
      setUnitCosts(costData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const processedData = stockInData.map(item => {
      const key = item.id;
      return {
        id: key,
        productCode: item.productCode,
        quantity: item.quantity,
        unitCost: unitCosts[key] ?? '',
        purchaseCost: (unitCosts[key] ?? 0) * item.quantity,
      };
    });
    setPurchaseData(processedData);
  }, [stockInData, unitCosts]);

  useEffect(() => {
    const totalCost = purchaseData.reduce((sum, item) => sum + item.purchaseCost, 0);
    setTotalPurchaseCost(totalCost);
    saveTotalPurchaseCostToFirebase(totalCost);
  }, [purchaseData]);

  useEffect(() => {
    const calculateAndSaveAverageCosts = async () => {
      const costSumMap = {};
      const quantitySumMap = {};

      purchaseData.forEach(item => {
        if (!costSumMap[item.productCode]) {
          costSumMap[item.productCode] = 0;
          quantitySumMap[item.productCode] = 0;
        }
        costSumMap[item.productCode] += item.purchaseCost;
        quantitySumMap[item.productCode] += item.quantity;
      });

      const avgData = [];

      for (const productCode in costSumMap) {
        const avgCost = quantitySumMap[productCode]
          ? parseFloat((costSumMap[productCode] / quantitySumMap[productCode]).toFixed(2))
          : 0;

        await setDoc(doc(db, 'averageCosts', productCode), {
          productCode,
          avgCost
        });

        avgData.push({ productCode, avgCost });
      }

      setAvgCostData(avgData);
    };

    calculateAndSaveAverageCosts();
  }, [purchaseData]);

  const handleUnitCostChange = async (entryId, value) => {
    const newCost = parseFloat(value) || 0;
    setUnitCosts(prev => ({ ...prev, [entryId]: newCost }));

    try {
      await setDoc(doc(db, 'unitCosts', entryId), { unitCost: newCost });
    } catch (error) {
      console.error('Error saving unit cost:', error);
    }
  };

  const saveTotalPurchaseCostToFirebase = async (totalCost) => {
    try {
      await setDoc(doc(db, 'purchaseSummary', 'totalPurchaseCost'), { value: totalCost });
    } catch (error) {
      console.error('Error saving total purchase cost:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Average Product Costs</Text>
        
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Product Code</Text>
          <Text style={styles.headerText}>Avg. Cost</Text>
        </View>

        {avgCostData.map((item, index) => (
          <View 
            key={index} 
            style={[
              styles.tableRow,
              { backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }
            ]}
          >
            <Text style={styles.rowText}>{item.productCode}</Text>
            <Text style={styles.rowText}>₹{item.avgCost}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { marginTop: 20 }]}>
        <Text style={styles.cardTitle}>Purchase Details</Text>
        
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Product Code</Text>
          <Text style={styles.headerText}>Qty</Text>
          <Text style={styles.headerText}>Unit Cost</Text>
          <Text style={styles.headerText}>Total Cost</Text>
        </View>

        {purchaseData.map((item, index) => (
          <View 
            key={item.id} 
            style={[
              styles.tableRow,
              { backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }
            ]}
          >
            <Text style={styles.rowText}>{item.productCode}</Text>
            <Text style={styles.rowText}>{item.quantity}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={unitCosts[item.id]?.toString() || ''}
              onChangeText={value => handleUnitCostChange(item.id, value)}
            />
            <Text style={[styles.rowText, { color: 'red' }]}>
              ₹{(unitCosts[item.id] * item.quantity).toFixed(2)}
            </Text>
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
            {purchaseData.reduce((sum, item) => sum + item.quantity, 0)}
          </Text>
          <Text style={[styles.rowText, { fontWeight: 'bold' }]}>-</Text>
          <Text style={[styles.rowText, { fontWeight: 'bold', color: 'red' }]}>
            ₹{totalPurchaseCost.toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    textAlign: 'center',
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
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
    marginHorizontal: 4,
    backgroundColor: 'white',
  },
});

export default Purchase;
