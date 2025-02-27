import { StyleSheet } from "react-native";
import colors from "./colors"; // Import your color theme

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
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: "center",
  },
  serial: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    height: 45,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productInput: {
    flex: 1,
    height: 45,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    marginRight: 5,
    backgroundColor: colors.white,
  },

statusContainer: {
  minWidth: 100,
  paddingVertical: 5,
  paddingHorizontal: 10,
  borderRadius: 5,
  alignItems: "center",
  justifyContent: "center",
  marginHorizontal: 5,
},
statusText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "bold",
},


  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  addProductText: {
    marginLeft: 5,
    color: colors.primary,
    fontSize: 16,
  },
  picker: {
    height: 45,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default styles;

