// navigation/CustomDrawerContent.js
import React, { useContext } from 'react';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserContext } from '../context/UserContext';
import colors from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';

const CustomDrawerContent = (props) => {
  const { setUser, setRole } = useContext(UserContext);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear the user context on logout
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.drawerBackground }}
    >
      <DrawerItemList {...props} />
      <DrawerItem
        label="Logout"
        labelStyle={{ color: colors.drawerText }}
        icon={({ color, size }) => (
          <Ionicons name="log-out-outline" size={size} color={color} />
        )}
        onPress={handleLogout}
      />
    </DrawerContentScrollView>
  );
};

export default CustomDrawerContent;

