import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FloatingAction } from "react-native-floating-action";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import colors from "../styles/colors";

const StockIn = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [productCode, setProductCode] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [quantity, setQuantity] = useState("");
  const [stockData, setStockData] = useState([]);

  // Fetch stock data from Firebase
  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    const q = query(collection(db, "stockIn"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc, index) => ({
      id: doc.id,
      serial: index + 1,
      ...doc.data(),
    }));
    setStockData(data);
  };

  const handleAddStock = async () => {
    if (!date || !productCode || !productDetails || !quantity) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    try {
      await addDoc(collection(db, "stockIn"), {
        date,
        productCode,
        productDetails,
        quantity: Number(quantity),
      });
      fetchStockData();
      handleCloseModal();
    } catch (error) {
      console.error("Error adding stock: ", error);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setDate(new Date().toISOString().split("T")[0]);
    setProductCode("");
    setProductDetails("");
    setQuantity("");
  };

  return (
    <View style={styles.container}>
      {/* List of Stock Items */}
      <FlatList
        data={stockData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serialNumber}>{item.serial}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardText}>Date: {item.date}</Text>
              <Text style={styles.cardText}>Product Code: {item.productCode}</Text>
              <Text style={styles.cardText}>Details: {item.productDetails}</Text>
              <Text style={styles.cardText}>Quantity: {item.quantity}</Text>
            </View>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <FloatingAction
        actions={[
          {
            text: "Add Stock",
            icon: <Ionicons name="add" size={24} color={colors.white} />,
            name: "add_stock",
            position: 1,
            color: colors.primary,
          },
        ]}
        onPressItem={() => setModalVisible(true)}
      />

      {/* Modal Form for Adding Stock */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Stock</Text>

            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="Date (YYYY-MM-DD)"
            />
            {!date && <Text style={styles.errorText}>Date is required</Text>}

            <TextInput
              style={styles.input}
              value={productCode}
              onChangeText={setProductCode}
              placeholder="Product Code"
            />
            {!productCode && <Text style={styles.errorText}>Product Code is required</Text>}

            <TextInput
              style={styles.input}
              value={productDetails}
              onChangeText={setProductDetails}
              placeholder="Product Details"
              multiline
            />
            {!productDetails && <Text style={styles.errorText}>Product Details are required</Text>}

            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Quantity"
              keyboardType="numeric"
            />
            {!quantity && <Text style={styles.errorText}>Quantity is required</Text>}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={handleAddStock}>
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
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
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
  },
  serialNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    fontSize: 16,
    color: colors.text,
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
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: colors.background,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginRight: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginLeft: 5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default StockIn;

