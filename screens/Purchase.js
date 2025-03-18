import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet } from 'react-native';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import colors from '../styles/colors';
import { ScrollView } from 'react-native';


const Purchase = () => {
  const [stockInData, setStockInData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [unitCosts, setUnitCosts] = useState({});
  const [totalPurchaseCost, setTotalPurchaseCost] = useState(0);
  const [avgCostData, setAvgCostData] = useState([]);

  // Fetch Stock In Data & Unit Costs from Firebase
  useEffect(() => {
    const fetchStockInData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'stockIn'));
        const stockData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStockInData(stockData);

        // Fetch saved unit costs
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

    fetchStockInData();
  }, []);

  // Process purchase data
  useEffect(() => {
    if (stockInData.length > 0) {
      let processedData = stockInData.map(item => ({
        productCode: item.productCode,
        quantity: item.quantity,
        unitCost: unitCosts[item.productCode] || '',
        purchaseCost: (unitCosts[item.productCode] || 0) * item.quantity,
      }));
      setPurchaseData(processedData);
    }
  }, [stockInData, unitCosts]);

  // Calculate Total Purchase Cost
  useEffect(() => {
    const totalCost = purchaseData.reduce((sum, item) => sum + item.purchaseCost, 0);
    setTotalPurchaseCost(totalCost);

    // Save Total Purchase Cost to Firebase
    if (totalCost > 0) {
      saveTotalPurchaseCostToFirebase(totalCost);
    }
  }, [purchaseData]);

  // Calculate Average Product Cost
  useEffect(() => {
    const avgCostMap = {};
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

    for (let productCode in costSumMap) {
      avgCostMap[productCode] = costSumMap[productCode] / quantitySumMap[productCode];
    }

    const avgData = Object.entries(avgCostMap).map(([productCode, avgCost]) => ({ productCode, avgCost }));
    setAvgCostData(avgData);
  }, [purchaseData]);

  // Handle Unit Cost Input & Save to Firebase
  const handleUnitCostChange = async (productCode, value) => {
    const newCost = parseFloat(value) || 0;
    setUnitCosts(prev => ({ ...prev, [productCode]: newCost }));

    // Save to Firebase
    try {
      await setDoc(doc(db, 'unitCosts', productCode), { unitCost: newCost });
    } catch (error) {
      console.error('Error saving unit cost:', error);
    }
  };

  // Save Total Purchase Cost to Firebase
  const saveTotalPurchaseCostToFirebase = async (totalCost) => {
    try {
      await setDoc(doc(db, 'purchaseSummary', 'totalPurchaseCost'), { value: totalCost });
    } catch (error) {
      console.error('Error saving total purchase cost:', error);
    }
  };

 
return (
  <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
    {/* Average Product Cost Table */}
    <Text style={styles.tableTitle}>Average Product Cost</Text>
    <View style={styles.table}>
      <View style={styles.tableRow}>
        <Text style={styles.tableHeader}>Product Code</Text>
        <Text style={styles.tableHeader}>Avg. Cost ($)</Text>
      </View>
      {avgCostData.length > 0 ? (
        avgCostData.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.productCode}</Text>
            <Text style={styles.tableCell}>{item.avgCost.toFixed(2)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No Data Available</Text>
      )}
    </View>

    {/* Total Purchase Value Table with Horizontal Scroll */}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.totalPurchaseContainer}>
          <Text style={styles.totalPurchaseText}>
            Total Purchase Cost: $ {totalPurchaseCost.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.tableTitle}>Total Purchase Value</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
  <Text style={styles.tableHeader}>Product{"\n"}Code</Text>
  <Text style={styles.tableHeader}>Quantity</Text>
  <Text style={styles.tableHeader}>Unit{"\n"}Cost ($)</Text>
  <Text style={styles.tableHeader}>Purchase{"\n"}Cost ($)</Text>
</View>

          {purchaseData.length > 0 ? (
            purchaseData.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.productCode}</Text>
                <Text style={styles.tableCell}>{item.quantity}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={unitCosts[item.productCode]?.toString() || ''}
                  onChangeText={value => handleUnitCostChange(item.productCode, value)}
                />
                <Text style={styles.tableCell}>
                  {(unitCosts[item.productCode] * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No Data Available</Text>
          )}
        </View>
      </View>
    </ScrollView>
  </ScrollView>
);


};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: colors.primary,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.secondary,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: colors.secondary,
  },
  tableHeader: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 5,
    paddingHorizontal: 5,
  },
  totalPurchaseContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  totalPurchaseText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
  },
  noDataText: {
    textAlign: 'center',
    padding: 10,
    fontSize: 16,
    color: colors.text,
  },
});

export default Purchase;

