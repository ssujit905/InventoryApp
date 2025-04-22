import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  StyleSheet 
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import colors from "../styles/colors";

const InventoryScreen = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);

      // Fetch data
      const [stockInSnapshot, salesSnapshot] = await Promise.all([
        getDocs(collection(db, "stockIn")),
        getDocs(collection(db, "sales"))
      ]);

      // Process stock in data
      const stockInData = {};
      stockInSnapshot.forEach(doc => {
        const { productCode, quantity } = doc.data();
        stockInData[productCode] = (stockInData[productCode] || 0) + parseInt(quantity);
      });

      // Process sales data
      const stockOutData = {};
      const returnedStock = {};
      salesSnapshot.forEach(doc => {
        const { products, status } = doc.data();
        products.forEach(({ productCode, quantity }) => {
          const qty = parseInt(quantity);
          stockOutData[productCode] = (stockOutData[productCode] || 0) + qty;
          if (status === "Returned") {
            returnedStock[productCode] = (returnedStock[productCode] || 0) + qty;
          }
        });
      });

      // Calculate inventory
      const finalInventory = Object.keys(stockInData).map(productCode => ({
        productCode,
        stockIn: stockInData[productCode] || 0,
        stockOut: (stockOutData[productCode] || 0) - (returnedStock[productCode] || 0),
        availableStock: stockInData[productCode] - ((stockOutData[productCode] || 0) - (returnedStock[productCode] || 0))
      }));

      setInventoryData(finalInventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventory(true);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading Inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Inventory Summary</Text>
        
        <View style={styles.tableHeader}>
          <Text style={styles.headerText}>Product Code</Text>
          <Text style={styles.headerText}>Stock In</Text>
          <Text style={styles.headerText}>Stock Out</Text>
          <Text style={styles.headerText}>Available</Text>
        </View>

        <FlatList
          data={inventoryData}
          keyExtractor={(item) => item.productCode}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item, index }) => (
            <View 
              style={[
                styles.tableRow,
                { backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }
              ]}
            >
              <Text style={styles.rowText}>{item.productCode}</Text>
              <Text style={styles.rowText}>{item.stockIn}</Text>
              <Text style={styles.rowText}>{item.stockOut}</Text>
              <Text style={[
                styles.rowText, 
                { color: item.availableStock <= 0 ? 'red' : colors.text }
              ]}>
                {item.availableStock}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No inventory data available</Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
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
    color: colors.text,
  },
  emptyRow: {
    padding: 15,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default InventoryScreen;
