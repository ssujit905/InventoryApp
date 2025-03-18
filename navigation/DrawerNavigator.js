// navigation/DrawerNavigator.js
import React, { useContext } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Dashboard from '../screens/Dashboard';
import StockIn from '../screens/StockIn';
import Expenses from '../screens/Expenses';
import Sales from '../screens/Sales';
import Inventory from '../screens/Inventory';

import FinanceDrawer from './FinanceDrawer';
import UserRoles from '../screens/UserRoles';
import CustomDrawerContent from './CustomDrawerContent';
import { UserContext } from '../context/UserContext';
import colors from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';


const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const { role } = useContext(UserContext);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        drawerStyle: { backgroundColor: colors.drawerBackground },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.drawerText,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="StockIn"
        component={StockIn}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Expenses"
        component={Expenses}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Sales"
        component={Sales}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="pricetag" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Inventory"
        component={Inventory}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />

      {/* Only admin users can see Finance and User Roles */}
      {role === 'admin' && (
        <>
          <Drawer.Screen
            name="Finance"

            component={FinanceDrawer}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="stats-chart" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="User Roles"
            component={UserRoles}
            options={{
              drawerIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
              ),
            }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
