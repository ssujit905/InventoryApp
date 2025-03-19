import { StyleSheet } from "react-native";
import colors from "./colors";

const dashboardStyles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },

  // Title
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 20,
  },

  // Search container
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 10,
    marginLeft: 10,
    backgroundColor: colors.white,
  },

  // Sales card
  salesCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  salesImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },

  // Quote card
  quoteCard: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 15,
    marginVertical: 20,
  },
  quoteText: {
    fontStyle: "italic",
    color: colors.white,
    fontSize: 16,
    marginBottom: 10,
  },
  signature: {
    textAlign: "right",
    color: colors.white,
    fontSize: 12,
  },

  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginTop: 20,
    marginBottom: 10,
  },

  // Sales counts
  salesCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  returnedCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.error,
  },

  // Monthly sales
  monthText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10,
  },
  deliveredText: {
    color: colors.success,
    fontSize: 16,
  },
  returnedText: {
    color: colors.error,
    fontSize: 16,
  },

  // Chart
  chart: {
    marginVertical: 20,
    borderRadius: 8,
    overflow: "hidden",
  },

  // Pagination
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  paginationButton: {
    color: colors.primary,
    fontSize: 16,
    marginHorizontal: 10,
  },
  pageNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },

  // Export button
  exportButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginVertical: 20,
  },
  exportButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  // Error text
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
});

export default dashboardStyles;
