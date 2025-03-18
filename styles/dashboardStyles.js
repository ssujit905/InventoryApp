import { StyleSheet } from "react-native";
import colors from "./colors";

const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    marginRight: 10,
    padding: 5,
    fontSize: 16,
  },
  salesCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteCard: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
    borderWidth: 2,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    color: colors.black,
  },
  signature: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
    color: colors.black,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    color: colors.text,
  },
  monthText: {
    fontSize: 16,
    marginTop: 5,
    color: colors.text,
  },
  greenText: {
    color: "green",
    fontWeight: "bold",
  },
  redText: {
    color: "red",
    fontWeight: "bold",
  },
  showAllButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 15,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default dashboardStyles;
