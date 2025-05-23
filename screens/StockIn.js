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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebase";
import colors from "../styles/colors";
import { fetchStockIn, addStockIn } from "../services/stockService";

const StockIn = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [productCode, setProductCode] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [quantity, setQuantity] = useState("");
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    productCode: false,
    productDetails: false,
    quantity: false,
  });

  const isValidQuantity = () => /^\d+$/.test(quantity) && parseInt(quantity) > 0;
  const isFormValid = () =>
    productCode.trim() &&
    productDetails.trim() &&
    isValidQuantity();

  const getQuantityError = () => {
    if (!touched.quantity) return null;
    if (!quantity) return "Quantity is required";
    if (!isValidQuantity()) return "Must be a positive integer";
    return null;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchStockIn();
        setStockData(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddStock = async () => {
    setIsSubmitting(true);
    try {
      await addStockIn({
        date,
        productCode: productCode.trim(),
        productDetails: productDetails.trim(),
        quantity: parseInt(quantity),
      });
      const updatedData = await fetchStockIn();
      setStockData(updatedData);
      Alert.alert("Success", "Stock added successfully!");
      handleCloseModal();
    } catch (error) {
      Alert.alert("Error", "Failed to add stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setDate(new Date().toISOString().split("T")[0]);
    setProductCode("");
    setProductDetails("");
    setQuantity("");
    setTouched({
      productCode: false,
      productDetails: false,
      quantity: false,
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={stockData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.serialContainer}>
                <Text style={styles.serialNumber}>{item.serial}</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Date:</Text>
                  <Text style={styles.cardValue}>{item.date}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Product Code:</Text>
                  <Text style={styles.cardValue}>{item.productCode}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Details:</Text>
                  <Text style={styles.cardValue}>{item.productDetails}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Quantity:</Text>
                  <Text style={[styles.cardValue, styles.quantityValue]}>{item.quantity}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No stock entries found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add Stock Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Modal for Adding Stock */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Stock Entry</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                />
                {!date && <Text style={styles.errorText}>Date is required</Text>}
              </View>

              {/* Product Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Code</Text>
                <TextInput
                  style={styles.input}
                  value={productCode}
                  onChangeText={setProductCode}
                  placeholder="Enter product code"
                  onBlur={() => setTouched((p) => ({ ...p, productCode: true }))}
                />
                {touched.productCode && !productCode.trim() && (
                  <Text style={styles.errorText}>Product Code is required</Text>
                )}
              </View>

              {/* Product Details */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Details</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={productDetails}
                  onChangeText={setProductDetails}
                  placeholder="Enter product details"
                  multiline
                  numberOfLines={3}
                  onBlur={() => setTouched((p) => ({ ...p, productDetails: true }))}
                />
                {touched.productDetails && !productDetails.trim() && (
                  <Text style={styles.errorText}>Product Details are required</Text>
                )}
              </View>

              {/* Quantity */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Enter quantity"
                  keyboardType="numeric"
                  onBlur={() => setTouched((p) => ({ ...p, quantity: true }))}
                />
                {getQuantityError() && (
                  <Text style={styles.errorText}>{getQuantityError()}</Text>
                )}
              </View>

              {/* Add Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.addButton, (!isFormValid() || isSubmitting) && styles.disabledButton]}
                  onPress={handleAddStock}
                  disabled={!isFormValid() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Add Stock</Text>
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
  },
  listContent: {
    padding: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serialContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  serialNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  cardContent: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    width: 100,
  },
  cardValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
    flex: 1,
  },
  quantityValue: {
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
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
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 10,
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
    borderColor: colors.lightGray,
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
    color: colors.error,
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

export default StockIn;
