// Inventory.js
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import styles from "../styles/inventoryStyles";

const InventoryScreen = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);

      // Fetch StockIn Data (Product Code & Quantity)
      const stockInSnapshot = await getDocs(collection(db, "stockIn"));
      let stockInData = {};
      stockInSnapshot.forEach((doc) => {
        const { productCode, quantity } = doc.data();
        stockInData[productCode] = (stockInData[productCode] || 0) + parseInt(quantity);
      });

      // Fetch Sales Data (Product Code, Quantity, and Status)
      const salesSnapshot = await getDocs(collection(db, "sales"));
      let stockOutData = {};
      let returnedStock = {};

      salesSnapshot.forEach((doc) => {
        const { products, status } = doc.data();
        products.forEach(({ productCode, quantity }) => {
          const qty = parseInt(quantity);
          stockOutData[productCode] = (stockOutData[productCode] || 0) + qty;

          // If sale is returned, subtract from StockOut
          if (status === "Returned") {
            returnedStock[productCode] = (returnedStock[productCode] || 0) + qty;
          }
        });
      });

      // Calculate Inventory Data
      let finalInventory = Object.keys(stockInData).map((productCode) => ({
        productCode,
        stockIn: stockInData[productCode] || 0,
        stockOut: (stockOutData[productCode] || 0) - (returnedStock[productCode] || 0),
        availableStock: (stockInData[productCode] || 0) - ((stockOutData[productCode] || 0) - (returnedStock[productCode] || 0)),
      }));

      setInventoryData(finalInventory);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="blue" />
        <Text>Loading Inventory...</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal>
      <View style={styles.tableContainer}>
  {/* Table Header */}
  <View style={styles.tableHeader}>
    <View style={styles.headerItem}>
      <Text style={styles.tableHeaderText}>Product Code</Text>
    </View>
    <View style={styles.headerItem}>
      <Text style={styles.tableHeaderText}>Stock In</Text>
    </View>
    <View style={styles.headerItem}>
      <Text style={styles.tableHeaderText}>Stock Out</Text>
    </View>
    <View style={styles.headerItem}>
      <Text style={styles.tableHeaderText}>Available Stock</Text>
    </View>
  </View>

 



        {/* Table Data */}
        <FlatList
          data={inventoryData}
          keyExtractor={(item) => item.productCode}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.productCode}</Text>
              <Text style={styles.tableCell}>{item.stockIn}</Text>
              <Text style={styles.tableCell}>{item.stockOut}</Text>
              <Text style={styles.tableCell}>{item.availableStock}</Text>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
};

export default InventoryScreen;

