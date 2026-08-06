import { createDrawerNavigator } from '@react-navigation/drawer';

const DrawerNavigator = createDrawerNavigator();

export const Drawer = Object.assign(DrawerNavigator.Navigator, { Screen: DrawerNavigator.Screen });
