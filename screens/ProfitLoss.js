import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { db } from "../firebase"; // Ensure firebase.js is properly set up
import { collection, getDocs, doc, setDoc, query, where } from "firebase/firestore";
import styles from "../styles/profitLossStyles"; // Create styles file separately

const ProfitLoss = () => {
  const [purchaseCost, setPurchaseCost] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [soldCost, setSoldCost] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [monthlyProfits, setMonthlyProfits] = useState([]);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "short" }); // Example: "Mar"
  const currentYear = currentDate.getFullYear();
  const currentMonthYear = `${currentMonth} ${currentYear}`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch total purchase cost from purchaseSummary in Firebase
      const fetchPurchaseCost = async () => {
    try {
      const purchaseDoc = await getDoc(doc(db, "purchaseSummary", "totalCost"));
      if (purchaseDoc.exists()) {
        setPurchaseCost(purchaseDoc.data().total);
      }
    } catch (error) {
      console.error("Error fetching purchase cost:", error);
    }
  };


      // Fetch total expenses from Expenses screen
      const expensesSnap = await getDocs(collection(db, "expenses"));
      let totalExp = 0;
      expensesSnap.forEach((doc) => {
        totalExp += doc.data().amount || 0;
      });
      setTotalExpenses(totalExp);

      // Fetch total income and total investment from Income screen
      const incomeSnap = await getDocs(collection(db, "income"));
      let incomeTotal = 0;
      let investmentTotal = 0;
      incomeSnap.forEach((doc) => {
        if (doc.data().type === "income") {
          incomeTotal += doc.data().amount || 0;
        } else if (doc.data().type === "investment") {
          investmentTotal += doc.data().amount || 0;
        }
      });
      setTotalIncome(incomeTotal);
      setTotalInvestment(investmentTotal);

      // Calculate Sold Cost from Sales Screen (filtering delivered products)
      const salesSnap = await getDocs(collection(db, "sales"));
      let totalSoldCost = 0;
      const productAvgCostRef = collection(db, "purchaseSummary");
      const productAvgCostSnap = await getDocs(productAvgCostRef);

      let avgCostMap = {};
      productAvgCostSnap.forEach((doc) => {
        avgCostMap[doc.id] = doc.data().avgCost || 0; // Map product codes to avg cost
      });

      salesSnap.forEach((doc) => {
        const sale = doc.data();
        if (sale.status === "Delivered" && sale.products) {
          sale.products.forEach((product) => {
            const avgCost = avgCostMap[product.productCode.trim()] || 0;
            totalSoldCost += (product.quantity || 0) * avgCost;
          });
        }
      });

      setSoldCost(totalSoldCost);

      // Fetch monthly profit history
      const profitSnap = await getDocs(collection(db, "monthlyProfits"));
      let profits = [];
      profitSnap.forEach((doc) => {
        profits.push({ id: doc.id, ...doc.data() });
      });
      setMonthlyProfits(profits);

      // Calculate Current Month Profit
      const profit = incomeTotal - (totalExp + totalSoldCost);
      setMonthlyProfit(profit);

      // Auto-save profit at the end of the month
      autoSaveMonthlyProfit(currentMonthYear, profit);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const autoSaveMonthlyProfit = async (monthYear, profit) => {
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    if (currentDate.getDate() === lastDay) {
      try {
        await setDoc(doc(db, "monthlyProfits", monthYear), { amount: profit });
        Alert.alert("Monthly Profit Saved", `Saved profit for ${monthYear}: $${profit}`);
      } catch (error) {
        console.error("Error saving monthly profit: ", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Summary Section */}
      <View style={styles.summaryBox}>
        <Text style={[styles.label, styles.redText]}>Total Purchase Cost: ${purchaseCost}</Text>
        <Text style={[styles.label, styles.redText]}>Total Expenses: ${totalExpenses}</Text>
        <Text style={[styles.label, styles.greenText]}>Total Income: ${totalIncome}</Text>
        <Text style={[styles.label, styles.greenText]}>Total Investment: ${totalInvestment}</Text>
        <Text style={styles.label}>
          Remaining Stock Value: ${purchaseCost - soldCost}
        </Text>
      </View>

      {/* Monthly Profit Section */}
      <View style={styles.monthlyProfit}>
        <Text style={styles.monthlyTitle}>Profit this month</Text>
        <View style={styles.row}>
          <Text style={styles.monthText}>{currentMonthYear}</Text>
          <Text style={styles.profitAmount}>${monthlyProfit}</Text>
        </View>
        <TouchableOpacity
          style={styles.showAllButton}
          onPress={() => setShowAllMonths(!showAllMonths)}
        >
          <Text style={styles.showAllText}>{showAllMonths ? "Hide" : "Show All"}</Text>
        </TouchableOpacity>
      </View>

      {/* All Monthly Profits List */}
      {showAllMonths && (
        <FlatList
          data={monthlyProfits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={styles.monthlyProfitItem}>
              {item.id}: ${item.amount}
            </Text>
          )}
        />
      )}
    </View>
  );
};

export default ProfitLoss;

