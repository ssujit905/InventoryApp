import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  FlatList, 
  StyleSheet,
  ActivityIndicator,
  Alert
} from "react-native";
import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import colors from "../styles/colors";

const IncomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [entryType, setEntryType] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [details, setDetails] = useState("");
    const [amount, setAmount] = useState("");
    const [incomeEntries, setIncomeEntries] = useState([]);
    const [investmentEntries, setInvestmentEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({
        details: false,
        amount: false,
    });

    const isValidAmount = () => /^\d+(\.\d{1,2})?$/.test(amount) && parseFloat(amount) > 0;
    const isFormValid = () => date && details.trim() && isValidAmount();

    const getAmountError = () => {
        if (!touched.amount) return null;
        if (!amount) return "Amount is required";
        if (!isValidAmount()) return "Must be a positive number";
        return null;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const incomeQuery = query(collection(db, "income"), orderBy("date", "desc"));
                const investmentQuery = query(collection(db, "investment"), orderBy("date", "desc"));

                const [incomeSnapshot, investmentSnapshot] = await Promise.all([
                    getDocs(incomeQuery),
                    getDocs(investmentQuery)
                ]);

                setIncomeEntries(incomeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setInvestmentEntries(investmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching data:", error);
                Alert.alert("Error", "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAddEntry = async () => {
        setIsSubmitting(true);
        try {
            const entryData = { 
                date, 
                details: details.trim(), 
                amount: parseFloat(amount) 
            };

            if (entryType === "income") {
                await addDoc(collection(db, "income"), entryData);
                setIncomeEntries(prev => [{ id: Date.now().toString(), ...entryData }, ...prev]);
            } else {
                await addDoc(collection(db, "investment"), entryData);
                setInvestmentEntries(prev => [{ id: Date.now().toString(), ...entryData }, ...prev]);
            }
            
            setModalVisible(false);
            setDate(new Date().toISOString().split("T")[0]);
            setDetails("");
            setAmount("");
            setTouched({ details: false, amount: false });
            Alert.alert("Success", `Entry added successfully!`);
        } catch (error) {
            console.error("Error adding document:", error);
            Alert.alert("Error", "Failed to add entry");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setDate(new Date().toISOString().split("T")[0]);
        setDetails("");
        setAmount("");
        setTouched({ details: false, amount: false });
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
                <>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                                setEntryType("investment");
                                setModalVisible(true);
                            }}
                        >
                            <Text style={styles.buttonText}>+ Add Investment</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                                setEntryType("income");
                                setModalVisible(true);
                            }}
                        >
                            <Text style={styles.buttonText}>+ Add Income</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={investmentEntries}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={<Text style={styles.sectionTitle}>Investments</Text>}
                        renderItem={({ item }) => (
                            <View style={[styles.card, styles.investmentCard]}>
                                <Text style={styles.cardType}>INVESTMENT</Text>
                                <Text style={styles.cardDate}>{item.date}</Text>
                                <Text style={styles.cardDetails}>{item.details}</Text>
                                <Text style={styles.cardAmount}>${item.amount}</Text>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.noDataText}>No investments yet.</Text>}
                    />

                    <FlatList
                        data={incomeEntries}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={<Text style={styles.sectionTitle}>Incomes</Text>}
                        renderItem={({ item }) => (
                            <View style={[styles.card, styles.incomeCard]}>
                                <Text style={styles.cardType}>INCOME</Text>
                                <Text style={styles.cardDate}>{item.date}</Text>
                                <Text style={styles.cardDetails}>{item.details}</Text>
                                <Text style={styles.cardAmount}>${item.amount}</Text>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.noDataText}>No income records yet.</Text>}
                    />
                </>
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add {entryType === "income" ? "Income" : "Investment"}</Text>
                            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.white} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Date</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    value={date}
                                    onChangeText={setDate}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Details</Text>
                                <TextInput
                                    style={[styles.input, styles.multilineInput]}
                                    placeholder="Enter details"
                                    value={details}
                                    onChangeText={setDetails}
                                    multiline
                                    numberOfLines={3}
                                    onBlur={() => setTouched(p => ({ ...p, details: true }))}
                                />
                                {touched.details && !details.trim() && (
                                    <Text style={styles.errorText}>Details are required</Text>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Amount</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter amount"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                    onBlur={() => setTouched(p => ({ ...p, amount: true }))}
                                />
                                {getAmountError() && (
                                    <Text style={styles.errorText}>{getAmountError()}</Text>
                                )}
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.saveButton, (!isFormValid() || isSubmitting) && styles.disabledButton]}
                                    onPress={handleAddEntry}
                                    disabled={!isFormValid() || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color={colors.white} />
                                    ) : (
                                        <Text style={styles.buttonText}>Save</Text>
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
    container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
    buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
    addButton: { 
        backgroundColor: colors.primary, 
        padding: 12, 
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center'
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10, color: colors.text },
    card: { 
        backgroundColor: "#fff", 
        padding: 15, 
        marginVertical: 5, 
        borderRadius: 8,
        elevation: 2
    },
    investmentCard: { borderLeftWidth: 5, borderLeftColor: "#FF3D00" },
    incomeCard: { borderLeftWidth: 5, borderLeftColor: "#4CAF50" },
    cardType: { fontWeight: "bold", fontSize: 14, color: colors.text },
    cardDate: { color: colors.textSecondary, fontSize: 12 },
    cardDetails: { fontSize: 16, fontWeight: "600", color: colors.text, marginVertical: 4 },
    cardAmount: { fontSize: 18, fontWeight: "bold", color: colors.text },
    noDataText: { textAlign: "center", color: colors.textSecondary, fontStyle: "italic", marginTop: 5 },
    loader: { marginTop: 20 },
    
    // Modal styles to match Expenses
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
    },
    closeButton: {
        padding: 4,
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
        borderColor: '#e2e8f0',
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
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: 'center',
        minWidth: 200,
        alignSelf: 'center'
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default IncomeScreen;
