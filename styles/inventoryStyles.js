// inventoryStyles.js
import { StyleSheet } from "react-native";
import colors from "../styles/colors"; // Ensure you use your colors.js file

export default StyleSheet.create({


  tableContainer: {
    margin: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1E88E5",
    paddingVertical: 10,
    alignItems: "center",
  },
  headerItem: {
    flex: 1, // Ensures equal width for each column
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tableHeaderText: {
    fontWeight: "bold",
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#FFC107",
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#212121",
  },
});

