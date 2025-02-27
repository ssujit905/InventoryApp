import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import styles from "../styles/salesStyles";
import colors from "../styles/colors";

const getStatusStyle = (status) => {
  switch (status) {
    case "Delivered":
      return { backgroundColor: "#4CAF50" }; // Green for Delivered
    case "Returned":
      return { backgroundColor: "#D32F2F" }; // Red for Returned
    default:
      return { backgroundColor: "#FFC107" }; // Yellow for Processing & Sent
  }
};

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
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
      const salesData = querySnapshot.docs.map((doc, index) => ({
        id: doc.id,
        serial: querySnapshot.docs.length - index, // Serial number in descending order
        ...doc.data(),
      }));
      setSales(salesData);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  const handleAddProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { productCode: "", quantity: "" }],
    }));
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

  const handleSubmit = async () => {
    if (!formData.date || !formData.destinationBranch || !formData.customerName || !formData.fullAddress || !formData.phone1 || !formData.codAmount) {
      alert("All fields except Phone No. 2 are required.");
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

  return (
    <View style={styles.container}>
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
  <View style={styles.card}>
    {/* Serial Number */}
    <Text style={styles.serial}>{item.serial}</Text>

    {/* Sale Details */}
    <View style={styles.cardContent}>
      <Text>{item.date}</Text>
      <Text>{item.destinationBranch}</Text>
      <Text>{item.customerName}</Text>
    </View>

    {/* Status Display */}
    <View style={[styles.statusContainer, getStatusStyle(item.status)]}>
      <Text style={styles.statusText}>{item.status}</Text>
    </View>

    {/* Edit Button */}
 <TouchableOpacity onPress={() => { setFormData(item); setEditId(item.id); setModalVisible(true); }}>
              <MaterialIcons name="edit" size={24} color={colors.primary} />
            </TouchableOpacity>

  </View>
)}
      />

      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <AntDesign name="plus" size={24} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollContainer}>
            <Text style={styles.modalTitle}>Add Sales</Text>

            <TextInput style={styles.input} placeholder="Date" value={formData.date} onChangeText={(value) => handleInputChange("date", value)} />
            <TextInput style={styles.input} placeholder="Destination Branch" value={formData.destinationBranch} onChangeText={(value) => handleInputChange("destinationBranch", value)} />
            <TextInput style={styles.input} placeholder="Customer Name" value={formData.customerName} onChangeText={(value) => handleInputChange("customerName", value)} />
            <TextInput style={styles.input} placeholder="Full Address" value={formData.fullAddress} onChangeText={(value) => handleInputChange("fullAddress", value)} />
            <TextInput style={styles.input} placeholder="Phone No. 1" value={formData.phone1} keyboardType="numeric" maxLength={10} onChangeText={(value) => handleInputChange("phone1", value)} />
            <TextInput style={styles.input} placeholder="Phone No. 2 (Optional)" value={formData.phone2} keyboardType="numeric" maxLength={10} onChangeText={(value) => handleInputChange("phone2", value)} />

            {formData.products.map((product, index) => (
              <View key={index} style={styles.productRow}>
                <TextInput style={styles.productInput} placeholder="Product Code" value={product.productCode} onChangeText={(value) => handleInputChange("productCode", value, index)} />
                <TextInput style={styles.productInput} placeholder="Quantity" value={product.quantity} keyboardType="numeric" onChangeText={(value) => handleInputChange("quantity", value, index)} />
              </View>
            ))}

            <TouchableOpacity onPress={handleAddProduct} style={styles.addProductButton}>
              <AntDesign name="pluscircleo" size={24} color={colors.primary} />
              <Text style={styles.addProductText}>Add Product</Text>
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="C.O.D. Amount" value={formData.codAmount} keyboardType="numeric" onChangeText={(value) => handleInputChange("codAmount", value)} />

            <Picker selectedValue={formData.status} onValueChange={(value) => handleInputChange("status", value)} style={styles.picker}>
              <Picker.Item label="Parcel Processing" value="Parcel Processing" />
              <Picker.Item label="Parcel Sent" value="Parcel Sent" />
              <Picker.Item label="Delivered" value="Delivered" color="green" />
              <Picker.Item label="Returned" value="Returned" color="red" />
            </Picker>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={handleSubmit} style={styles.addButton}>
                <Text style={styles.buttonText}>{editId ? "Update" : "Add"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default Sales;

