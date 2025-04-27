import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { AntDesign, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import styles from "../styles/salesStyles";
import colors from "../styles/colors";

const getStatusStyle = (status) => {
  switch (status) {
    case "Delivered":
      return { backgroundColor: "#4CAF50" };
    case "Returned":
      return { backgroundColor: "#D32F2F" };
    default:
      return { backgroundColor: "#FFC107" };
  }
};

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    destinationBranch: "",
    customerName: "",
    fullAddress: "",
    phone1: "",
    phone2: "",
    products: [{ productCode: "", quantity: "" }],
    codAmount: "",
    status: "Parcel Processing",
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "sales"));
      const salesData = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((item, index, array) => ({
          ...item,
          serial: array.length - index,
        }));

      setSales(salesData);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  const fetchUniqueProductCodes = async () => {
    try {
      setProductsLoading(true);
      const stockInSnapshot = await getDocs(collection(db, "stockIn"));
      
      const allProductCodes = stockInSnapshot.docs
        .map(doc => doc.data().productCode)
        .filter(Boolean);
      
      const uniqueProductCodes = [...new Set(allProductCodes)];
      
      setAvailableProducts(uniqueProductCodes.map(code => ({ productCode: code })));
      setProductsLoading(false);
    } catch (error) {
      console.error("Error fetching product codes:", error);
      setProductsLoading(false);
      Alert.alert("Error", "Failed to load products. Please try again.");
    }
  };

  const handleModalOpen = async () => {
    try {
      await fetchUniqueProductCodes();
      resetForm();
      setModalVisible(true);
    } catch (error) {
      console.error("Error opening modal:", error);
    }
  };

  const handleEditPress = async (item) => {
    try {
      await fetchUniqueProductCodes();
      setFormData(item);
      setEditId(item.id);
      setModalVisible(true);
    } catch (error) {
      console.error("Error editing sale:", error);
    }
  };

  const handleAddProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { productCode: "", quantity: "" }],
    }));
  };

  const handleRemoveProduct = (index) => {
    setFormData((prev) => {
      const updatedProducts = [...prev.products];
      updatedProducts.splice(index, 1);
      return { ...prev, products: updatedProducts };
    });
  };

  const handleInputChange = (name, value, index = null) => {
    if (index !== null) {
      const updatedProducts = [...formData.products];
      updatedProducts[index][name] = value;
      setFormData((prev) => ({ ...prev, products: updatedProducts }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validatePhoneNumber = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  const handleSubmit = async () => {
    if (
      !formData.date ||
      !formData.destinationBranch ||
      !formData.customerName ||
      !formData.fullAddress ||
      !formData.phone1 ||
      !formData.codAmount
    ) {
      Alert.alert("Error", "All fields except Phone No. 2 are required.");
      return;
    }

    if (!validatePhoneNumber(formData.phone1)) {
      Alert.alert("Error", "Phone No. 1 must be exactly 10 digits.");
      return;
    }

    if (formData.phone2 && !validatePhoneNumber(formData.phone2)) {
      Alert.alert("Error", "Phone No. 2 must be exactly 10 digits if provided.");
      return;
    }

    try {
      if (editId) {
        await updateDoc(doc(db, "sales", editId), formData);
      } else {
        await addDoc(collection(db, "sales"), formData);
      }
      fetchSales();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error("Error saving sales data:", error);
      Alert.alert("Error", "Failed to save sales data.");
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      destinationBranch: "",
      customerName: "",
      fullAddress: "",
      phone1: "",
      phone2: "",
      products: [{ productCode: "", quantity: "" }],
      codAmount: "",
      status: "Parcel Processing",
    });
    setEditId(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales().finally(() => setRefreshing(false));
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      // Get today's sales data
      const today = new Date().toISOString().split('T')[0];
      const q = query(collection(db, "sales"), where("date", "==", today));
      const querySnapshot = await getDocs(q);
      
      const todaySales = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        products: doc.data().products.map(p => `${p.productCode} (Qty: ${p.quantity})`).join(', ')
      }));

      if (todaySales.length === 0) {
        Alert.alert("Info", "No sales data found for today.");
        return;
      }

      // Prepare worksheet
      const ws = XLSX.utils.json_to_sheet(todaySales.map(sale => ({
        "Date": sale.date,
        "Customer Name": sale.customerName,
        "Phone 1": sale.phone1,
        "Phone 2": sale.phone2 || 'N/A',
        "Destination Branch": sale.destinationBranch,
        "Full Address": sale.fullAddress,
        "Products": sale.products,
        "COD Amount": sale.codAmount,
        "Status": sale.status
      })));

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Today's Sales");

      // Generate Excel file
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + `TodaySales_${new Date().getTime()}.xlsx`;
      
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Save to downloads folder (Android)
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissions.granted) {
          const downloadUri = permissions.directoryUri + `/TodaySales_${new Date().getTime()}.xlsx`;
          await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, `TodaySales_${new Date().getTime()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            .then(async (uri) => {
              await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
              Alert.alert("Success", "Excel file downloaded successfully!");
            })
            .catch(e => {
              console.error(e);
              Alert.alert("Error", "Failed to save file. Please try again.");
            });
        }
      } else {
        // For iOS, we'll just save to cache and allow user to view
        Alert.alert(
          "Success", 
          "Excel file generated successfully!",
          [
            {
              text: "OK",
              onPress: () => Sharing.shareAsync(uri)
            }
          ]
        );
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      Alert.alert("Error", "Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sales Orders</Text>
        <TouchableOpacity 
          onPress={exportToExcel}
          style={styles.exportButton}
          disabled={loading}
        >

          <FontAwesome name="file-excel-o" size={20} color={colors.white} />


          <Text style={styles.exportButtonText}>Export Today</Text>


        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      )}
      
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serial}>{item.serial}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardDate}>{item.date}</Text>
              <Text style={styles.cardBranch}>{item.destinationBranch}</Text>
              <Text style={styles.cardCustomer}>{item.customerName}</Text>
            </View>
            <View style={[styles.statusContainer, getStatusStyle(item.status)]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleEditPress(item)}
              style={styles.editButton}
            >
              <MaterialIcons name="edit" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleModalOpen}
      >
        <AntDesign name="plus" size={24} color={colors.white} />
      </TouchableOpacity>

      <Modal 
        visible={modalVisible} 
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editId ? "Edit Sale Order" : "Create New Sale Order"}
            </Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <AntDesign name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Order Information</Text>
              
              <View style={styles.inputRow}>
                <FontAwesome name="calendar" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Date (YYYY-MM-DD)"
                  placeholderTextColor={colors.placeholder}
                  value={formData.date}
                  onChangeText={(value) => handleInputChange("date", value)}
                />
              </View>

              <View style={styles.inputRow}>
                <FontAwesome name="building" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Destination Branch"
                  placeholderTextColor={colors.placeholder}
                  value={formData.destinationBranch}
                  onChangeText={(value) => handleInputChange("destinationBranch", value)}
                />
              </View>

              <Picker
                selectedValue={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                style={styles.picker}
                dropdownIconColor={colors.primary}
                mode="dropdown"
              >
                <Picker.Item label="Parcel Processing" value="Parcel Processing" />
                <Picker.Item label="Parcel Sent" value="Parcel Sent" />
                <Picker.Item label="Delivered" value="Delivered" />
                <Picker.Item label="Returned" value="Returned" />
              </Picker>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              
              <View style={styles.inputRow}>
                <FontAwesome name="user" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Customer Name"
                  placeholderTextColor={colors.placeholder}
                  value={formData.customerName}
                  onChangeText={(value) => handleInputChange("customerName", value)}
                />
              </View>

              <View style={styles.inputRow}>
                <FontAwesome name="map-marker" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Full Address"
                  placeholderTextColor={colors.placeholder}
                  value={formData.fullAddress}
                  multiline
                  numberOfLines={3}
                  onChangeText={(value) => handleInputChange("fullAddress", value)}
                />
              </View>

              <View style={styles.inputRow}>
                <FontAwesome name="phone" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone No. 1 (10 digits)"
                  placeholderTextColor={colors.placeholder}
                  value={formData.phone1}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onChangeText={(value) => handleInputChange("phone1", value)}
                />
              </View>

              <View style={styles.inputRow}>
                <FontAwesome name="phone" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone No. 2 (Optional)"
                  placeholderTextColor={colors.placeholder}
                  value={formData.phone2}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onChangeText={(value) => handleInputChange("phone2", value)}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Products</Text>
                <TouchableOpacity 
                  onPress={handleAddProduct} 
                  style={styles.addProductButton}
                >
                  <AntDesign name="pluscircle" size={20} color={colors.primary} />
                  <Text style={styles.addProductText}>Add Product</Text>
                </TouchableOpacity>
              </View>

              {productsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
              ) : (
                formData.products.map((product, index) => (
                  <View key={index} style={styles.productContainer}>
                    <View style={styles.productInputContainer}>
                      <View style={styles.productCodeContainer}>
                        <Picker
                          selectedValue={product.productCode}
                          onValueChange={(value) => handleInputChange("productCode", value, index)}
                          style={styles.productPicker}
                          dropdownIconColor={colors.primary}
                          mode="dropdown"
                        >
                          <Picker.Item label="Select Product" value="" />
                          {availableProducts.map((prod, i) => (
                            <Picker.Item 
                              key={i} 
                              label={prod.productCode} 
                              value={prod.productCode} 
                            />
                          ))}
                        </Picker>
                      </View>
                      
                      <TextInput
                        style={styles.quantityInput}
                        placeholder="Qty"
                        placeholderTextColor={colors.placeholder}
                        value={product.quantity}
                        keyboardType="numeric"
                        onChangeText={(value) => handleInputChange("quantity", value, index)}
                      />

                      {formData.products.length > 1 && (
                        <TouchableOpacity 
                          onPress={() => handleRemoveProduct(index)}
                          style={styles.removeButton}
                        >
                          <AntDesign name="closecircle" size={20} color="#D32F2F" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Payment</Text>
              
              <View style={styles.inputRow}>
                <FontAwesome name="money" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="COD Amount"
                  placeholderTextColor={colors.placeholder}
                  value={formData.codAmount}
                  keyboardType="numeric"
                  onChangeText={(value) => handleInputChange("codAmount", value)}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                onPress={handleSubmit} 
                style={[styles.button, styles.saveButton]}
              >
                <Text style={styles.buttonText}>
                  {editId ? "UPDATE ORDER" : "CREATE ORDER"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default Sales;
