import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from "react-native";
import { collection, getDocs, addDoc, query, orderBy, where } from "firebase/firestore";



import { db } from "../firebase";

import dashboardStyles from "../styles/dashboardStyles";
import colors from "../styles/colors";
import { FontAwesome } from "@expo/vector-icons";
import moment from "moment";
import { LineChart } from "react-native-chart-kit";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";




const Dashboard = () => {
  const [searchText, setSearchText] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [returnedSales, setReturnedSales] = useState(0);
  const [monthlySales, setMonthlySales] = useState({});
  const [previousMonths, setPreviousMonths] = useState([]);
  const [showPreviousMonths, setShowPreviousMonths] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const searchHeight = useRef(new Animated.Value(0)).current;

  // Fetch sales data
  const fetchSalesData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const salesRef = collection(db, "sales");
      const querySnapshot = await getDocs(salesRef);
      let salesList = [];
      const monthlyData = {};

      querySnapshot.forEach((doc) => {
        const saleData = doc.data();
        salesList.push({ id: doc.id, ...saleData });

        const saleDate = moment(saleData.date);
        const saleMonth = saleDate.format("MMM YYYY");

        if (!monthlyData[saleMonth]) {
          monthlyData[saleMonth] = { delivered: 0, returned: 0 };
        }

        if (saleData.status === "Delivered") monthlyData[saleMonth].delivered++;
        if (saleData.status === "Returned") monthlyData[saleMonth].returned++;
      });

      setSalesData(salesList);

      const currentMonth = moment().format("MMM YYYY");
      setMonthlySales({
        month: currentMonth,
        delivered: monthlyData[currentMonth]?.delivered || 0,
        returned: monthlyData[currentMonth]?.returned || 0,
      });

      setTotalSales(monthlyData[currentMonth]?.delivered || 0);
      setReturnedSales(monthlyData[currentMonth]?.returned || 0);

      const monthlySalesRef = collection(db, "monthly_sales");
      for (const [month, data] of Object.entries(monthlyData)) {
        const q = query(monthlySalesRef, where("month", "==", month));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await addDoc(monthlySalesRef, {
            month,
            delivered: data.delivered,
            returned: data.returned,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      setError("Failed to fetch sales data. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch previous months' data
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

  // Handle search
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

  // Toggle search bar with animation
  const toggleSearch = () => {
    Animated.timing(searchHeight, {
      toValue: isSearchVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsSearchVisible(!isSearchVisible);
    setSearchText("");
    setFilteredSales([]);
  };

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSalesData();
    setRefreshing(false);
  };

  // Export data as CSV
  const exportData = async () => {
    const csvData = salesData
      .map((sale) => `${sale.customerName},${sale.phone1},${sale.date},${sale.status}\n`)
      .join("");

    const fileUri = FileSystem.documentDirectory + "sales_report.csv";
    await FileSystem.writeAsStringAsync(fileUri, csvData);
    await Sharing.shareAsync(fileUri);
  };

  // Paginated results
  const paginatedResults = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Render sales card
  const renderSaleCard = ({ item }) => (
    <View key={item.id} style={dashboardStyles.salesCard}>
      {item.image && <Image source={{ uri: item.image }} style={dashboardStyles.salesImage} />}
      <Text>Date: {item.date}</Text>
      <Text>Name: {item.customerName}</Text>
      <Text>Phone: {item.phone1}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Product Code: {item.products?.map((p) => p.code).join(", ")}</Text>
    </View>
  );

  return (
    <ScrollView
      style={dashboardStyles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Title */}
      <Text style={dashboardStyles.title}>InventoryApp</Text>

      {/* Search Bar */}
      <View style={dashboardStyles.searchContainer}>
        <TouchableOpacity onPress={toggleSearch}>
          <FontAwesome name="search" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Animated.View
          style={{
            height: searchHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 50],
            }),
          }}
        >
          {isSearchVisible && (
            <TextInput
              style={dashboardStyles.searchInput}
              placeholder="Enter Name or Phone Number"
              value={searchText}
              onChangeText={setSearchText}
            />
          )}
        </Animated.View>
      </View>

      {/* Search Results */}
      {filteredSales.length > 0 && (
        <View>
          {paginatedResults.map(renderSaleCard)}
          <View style={dashboardStyles.paginationContainer}>
            <TouchableOpacity
              onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <Text style={dashboardStyles.paginationButton}>Previous</Text>
            </TouchableOpacity>
            <Text style={dashboardStyles.pageNumber}>Page {currentPage}</Text>
            <TouchableOpacity
              onPress={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage * itemsPerPage >= filteredSales.length}
            >
              <Text style={dashboardStyles.paginationButton}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quote Card */}
      <View style={dashboardStyles.quoteCard}>
        <Text style={dashboardStyles.quoteText}>
          “The biggest risk is not taking any risk. In a world that’s changing quickly, the only
          strategy that is guaranteed to fail is not taking risks.”
        </Text>
        <Text style={dashboardStyles.signature}>Sujit Singh Creation</Text>
      </View>

      {/* Sales Metrics */}
      <Text style={dashboardStyles.sectionTitle}>Total Sales</Text>
      <Text style={dashboardStyles.salesCount}>{totalSales}</Text>

      <Text style={dashboardStyles.sectionTitle}>Returned Sales</Text>
      <Text style={dashboardStyles.returnedCount}>{returnedSales}</Text>

      {/* Monthly Sales */}
      <Text style={dashboardStyles.sectionTitle}>Monthly Sales</Text>
      <Text style={dashboardStyles.monthText}>{monthlySales.month}</Text>
      <Text style={dashboardStyles.deliveredText}>Delivered: {monthlySales.delivered}</Text>
      <Text style={dashboardStyles.returnedText}>Returned: {monthlySales.returned}</Text>

      {/* Chart */}
      <LineChart
        data={{
          labels: previousMonths.map((m) => m.month),
          datasets: [
            {
              data: previousMonths.map((m) => m.delivered),
            },
          ],
        }}
        width={Dimensions.get("window").width - 40}
        height={220}
        yAxisSuffix=" sales"
        chartConfig={{
          backgroundColor: colors.primary,
          backgroundGradientFrom: colors.primary,
          backgroundGradientTo: colors.secondary,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        bezier
        style={dashboardStyles.chart}
      />

      {/* Export Button */}
      <TouchableOpacity onPress={exportData} style={dashboardStyles.exportButton}>
        <Text style={dashboardStyles.exportButtonText}>Export Data</Text>
      </TouchableOpacity>

      {/* Loading and Error States */}
      {isLoading && <ActivityIndicator size="large" color={colors.primary} />}
      {error && <Text style={dashboardStyles.errorText}>{error}</Text>}
    </ScrollView>
  );
};

export default Dashboard;
