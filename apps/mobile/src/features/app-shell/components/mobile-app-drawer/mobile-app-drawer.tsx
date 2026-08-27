import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { MobileDrawerContent } from '@mobile/components/navigation/mobile-drawer-content';
import { mobileRadius, mobileShadow } from '@mobile/theme/layout';
import HomeTabScreen from '../../../../../app/(app)/(tabs)/index';
import ChatTabScreen from '../../../../../app/(app)/(tabs)/chat';
import OperationsTabScreen from '../../../../../app/(app)/(tabs)/operations';
import ProfileTabScreen from '../../../../../app/(app)/(tabs)/profile';
import ParcelCreateScreen from '../../../../../app/(app)/parcel-create';
import SuperSearchScreen from '../../../../../app/(app)/super-search';
import QueueScreen from '../../../../../app/(app)/queue';
import ReceiveScanScreen from '../../../../../app/(app)/receive';
import RiderScreen from '../../../../../app/(app)/rider';
import RiderAssignedScreen from '../../../../../app/(app)/rider-assigned';
import RiderHistoryScreen from '../../../../../app/(app)/rider-history';
import ChangePasswordScreen from '../../../../../app/(app)/change-password';
import CashierSalesReportScreen from '../../../../../app/(app)/cashier-sales-report';
import SuperSearchRecordDetailsScreen from '../../../../../app/(app)/super-search/[parcelId]';
import ReceiveProcessParcelScreen from '../../../../../app/(app)/receive-process/[parcelId]';
import MobileCommunicationThreadPage from '../../../../../app/(app)/communication/thread/[threadId]';
import MobileVoiceChannelScreen from '../../../../../app/(app)/communication/voice/[channelId]';
import ReceiveConsignmentsScreen from '../../../../../app/(app)/receive-consignments';
import ReceiveConsignmentSessionScreen from '../../../../../app/(app)/receive-consignment/[consignmentId]';
import SelfServiceAgentScreen from '../../../../../app/(app)/self-service';
import CallCenterFollowUpScreen from '../../../../../app/(app)/call-center-follow-up';
import ReceiveDiscrepanciesScreen from '../../../../../app/(app)/receive-discrepancies';
import DeliveryChangeReviewScreen from '../../../../../app/(app)/delivery-change-reviews';
import MobileCustomerDirectoryScreen from '../../../../../app/(app)/customers';

const Drawer = createDrawerNavigator();
const Tabs = createBottomTabNavigator();

function AppTabs() {
  const { theme } = useAppearance();
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.bgElevated,
          borderTopWidth: 0,
          borderTopLeftRadius: mobileRadius.xl,
          borderTopRightRadius: mobileRadius.xl,
          height: 68 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          paddingHorizontal: 12,
          ...mobileShadow.floating,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSubtle,
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeTabScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ChatTab"
        component={ChatTabScreen}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="SearchTab"
        component={SuperSearchScreen}
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileTabScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={20} color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

const hidden = { display: 'none' as const };

export function MobileAppDrawer() {
  const { theme } = useAppearance();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <MobileDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgElevated },
        headerTintColor: theme.colors.text,
        headerTitle: '',
        headerShadowVisible: false,
        drawerStyle: { backgroundColor: theme.colors.bgElevated, width: 300 },
      }}
    >
      <Drawer.Screen
        name="AppTabs"
        component={AppTabs}
        options={{ title: 'Dashboard', headerShown: false }}
      />
      <Drawer.Screen
        name="Operations"
        component={OperationsTabScreen}
        options={{ title: 'Operations' }}
      />
      <Drawer.Screen
        name="ParcelCreate"
        component={ParcelCreateScreen}
        options={{ title: 'Create Parcel', headerShown: false }}
      />
      <Drawer.Screen
        name="SuperSearch"
        component={SuperSearchScreen}
        options={{ title: 'Super Search' }}
      />
      <Drawer.Screen name="Queue" component={QueueScreen} options={{ headerShown: false }} />
      <Drawer.Screen
        name="Receive"
        component={ReceiveScanScreen}
        options={{ title: 'Scan To Receive' }}
      />
      <Drawer.Screen name="Rider" component={RiderScreen} options={{ title: 'Rider Operations' }} />
      <Drawer.Screen
        name="RiderAssigned"
        component={RiderAssignedScreen}
        options={{ title: 'Assigned Deliveries', headerShown: false }}
      />
      <Drawer.Screen
        name="RiderHistory"
        component={RiderHistoryScreen}
        options={{ title: 'Delivery History' }}
      />
      <Drawer.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Drawer.Screen
        name="CashierSalesReport"
        component={CashierSalesReportScreen}
        options={{ title: 'Cashier Sales Report', headerShown: false, drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="SuperSearchRecord"
        component={SuperSearchRecordDetailsScreen}
        options={{ title: 'Parcel Details', headerShown: false, drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="ReceiveProcess"
        component={ReceiveProcessParcelScreen}
        options={{ title: 'Process Parcel', drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="ReceiveConsignments"
        component={ReceiveConsignmentsScreen}
        options={{ title: 'Receive Consignments', drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="ReceiveConsignment"
        component={ReceiveConsignmentSessionScreen}
        options={{ title: 'Receive Consignment', drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="SelfService"
        component={SelfServiceAgentScreen}
        options={{ title: 'Self-Service Bookings', drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="CallCenterFollowUp"
        component={CallCenterFollowUpScreen}
        options={{ title: 'Call Center Follow-up', drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="ReceiveDiscrepancies"
        component={ReceiveDiscrepanciesScreen}
        options={{ title: 'Receiving Discrepancies', drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="DeliveryChangeReviews"
        component={DeliveryChangeReviewScreen}
        options={{ title: 'Delivery Change Reviews', drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="Customers"
        component={MobileCustomerDirectoryScreen}
        options={{ title: 'Customers', drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="CommunicationThread"
        component={MobileCommunicationThreadPage}
        options={{ title: 'Chat Thread', headerShown: false, drawerItemStyle: hidden }}
      />
      <Drawer.Screen
        name="VoiceChannel"
        component={MobileVoiceChannelScreen}
        options={{ title: 'Voice Channel', headerShown: false, drawerItemStyle: hidden }}
      />
    </Drawer.Navigator>
  );
}
