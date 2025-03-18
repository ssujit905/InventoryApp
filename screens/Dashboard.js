import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
} from "react-native";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";



import { db } from "../firebase";

import dashboardStyles from "../styles/dashboardStyles";
import colors from "../styles/colors";
import { FontAwesome } from "@expo/vector-icons";
import moment from "moment";

const Dashboard = () => {
  const [searchText, setSearchText] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [showAllSales, setShowAllSales] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [returnedSales, setReturnedSales] = useState(0);
  const [monthlySales, setMonthlySales] = useState({});
  const [previousMonths, setPreviousMonths] = useState([]);
  const [showPreviousMonths, setShowPreviousMonths] = useState(false);

  // 🔄 Fetch all sales from Firebase
  const fetchSalesData = async () => {
    try {
      const salesRef = collection(db, "sales");
      const querySnapshot = await getDocs(salesRef);
      let salesList = [];

      querySnapshot.forEach((doc) => {
        salesList.push({ id: doc.id, ...doc.data() });
      });

      setSalesData(salesList);

      // Calculate Delivered & Returned Sales
      const deliveredCount = salesList.filter((sale) => sale.status === "Delivered").length;
      const returnedCount = salesList.filter((sale) => sale.status === "Returned").length;
      setTotalSales(deliveredCount);
      setReturnedSales(returnedCount);

      // Get Current Month & Save Data Automatically
      const currentMonth = moment().format("MMM YYYY");
      setMonthlySales({ month: currentMonth, delivered: deliveredCount, returned: returnedCount });

      // Check if month data already exists
      const monthlySalesRef = collection(db, "monthly_sales");
      const monthlySnapshot = await getDocs(monthlySalesRef);
      const existingData = monthlySnapshot.docs.map((doc) => doc.data());

      if (!existingData.some((data) => data.month === currentMonth)) {
        await addDoc(monthlySalesRef, {
          month: currentMonth,
          delivered: deliveredCount,
          returned: returnedCount,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };

  // 🔍 Toggle Search Bar
  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    setSearchText("");
    setFilteredSales([]);
  };

  // 🔍 Live Search Filter (Suggests as user types)
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredSales([]);
    } else {
      const filtered = salesData.filter((sale) => {
        return (
          (sale.customerName &&
            sale.customerName.toLowerCase().includes(searchText.toLowerCase())) ||
          (sale.phone1 && sale.phone1.includes(searchText)) ||
          (sale.phone2 && sale.phone2.includes(searchText))
        );
      });
      setFilteredSales(filtered);
    }
  }, [searchText, salesData]);

  // 📅 Fetch Previous Monthly Sales Data
  const fetchPreviousMonthsData = async () => {
    try {
      const q = query(collection(db, "monthly_sales"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const monthsList = querySnapshot.docs.map((doc) => doc.data());
      setPreviousMonths(monthsList);
    } catch (error) {
      console.error("Error fetching monthly sales:", error);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  return (
    <ScrollView style={dashboardStyles.container}>
      {/* 🔹 Title */}
      <Text style={dashboardStyles.title}>InventoryApp</Text>

      {/* 🔍 Search Bar */}
      <View style={dashboardStyles.searchContainer}>
        <TouchableOpacity onPress={toggleSearch}>
          <FontAwesome name="search" size={20} color={colors.primary} />
        </TouchableOpacity>
        {isSearchVisible && (
          <TextInput
            style={dashboardStyles.searchInput}
            placeholder="Enter Name or Phone Number"
            value={searchText}
            onChangeText={setSearchText} // Live search
          />
        )}
      </View>

      {/* 🔍 Live Search Suggestions */}
      {filteredSales.length > 0 && (
        <View>
          {filteredSales.map((item) => (
            <View key={item.id} style={dashboardStyles.salesCard}>
              {item.image && (
                <Image source={{ uri: item.image }} style={dashboardStyles.salesImage} />
              )}
              <Text>Name: {item.customerName}</Text>
              <Text>Phone: {item.phone1}</Text>
              <Text>Address: {item.fullAddress}</Text>
              <Text>Status: {item.status}</Text>
        

      <Text>Product Code: {item.products?.map((p) => p.productCode).join(", ")}</Text>



              <Text>Quantity: {item.products?.map((p) => p.quantity).join(", ")}</Text>
            </View>
          ))}
        </View>
      )}




      {/* 📝 Inspirational Quote */}
      <View style={dashboardStyles.quoteCard}>
        <Text style={dashboardStyles.quoteText}>
          “The biggest risk is not taking any risk. In a world that’s changing quickly, the only
          strategy that is guaranteed to fail is not taking risks.”
        </Text>
        <Text style={dashboardStyles.signature}>Sujit Singh Creation</Text>
      </View>

      {/* 📊 Total Sales & Returned Sales */}
      <Text style={dashboardStyles.sectionTitle}>Total Sales</Text>
      <Text style={dashboardStyles.salesCount}>{totalSales}</Text>

      <Text style={dashboardStyles.sectionTitle}>Returned Sales</Text>
      <Text style={dashboardStyles.returnedCount}>{returnedSales}</Text>

      {/* 📅 Monthly Sales */}
      <Text style={dashboardStyles.sectionTitle}>Monthly Sales</Text>
      <Text style={dashboardStyles.monthText}>{monthlySales.month}</Text>
      <Text style={dashboardStyles.deliveredText}>Delivered: {monthlySales.delivered}</Text>
      <Text style={dashboardStyles.returnedText}>Returned: {monthlySales.returned}</Text>

      {/* 🔘 Show All Button */}
      <TouchableOpacity
        style={[dashboardStyles.button, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (!showPreviousMonths) fetchPreviousMonthsData();
          setShowPreviousMonths(!showPreviousMonths);
        }}
      >
        <Text style={dashboardStyles.buttonText}>
          {showPreviousMonths ? "Hide All Months" : "Show All Months"}
        </Text>
      </TouchableOpacity>

      {/* 📅 Previous Monthly Sales */}
      {showPreviousMonths &&
        previousMonths.map((monthData, index) => (
          <View key={index} style={dashboardStyles.monthCard}>
            <Text>{monthData.month}</Text>
            <Text>Delivered: {monthData.delivered}</Text>
            <Text>Returned: {monthData.returned}</Text>
          </View>
        ))}
    </ScrollView>
  );
};

export default Dashboard;
