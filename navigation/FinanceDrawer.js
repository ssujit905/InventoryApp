import { createDrawerNavigator } from '@react-navigation/drawer';
import Purchase from '../screens/Purchase';
import Income from '../screens/Income';
import ProfitLoss from '../screens/ProfitLoss';

const Finance = createDrawerNavigator();

export default function FinanceDrawer() {
  return (
    <Finance.Navigator initialRouteName="Purchase">
      <Finance.Screen name="Purchase" component={Purchase} />
      <Finance.Screen name="Income" component={Income} />
      <Finance.Screen name="Profit/Loss" component={ProfitLoss} />
    </Finance.Navigator>
  );
}
