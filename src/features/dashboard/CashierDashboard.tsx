// import React, { useState, useEffect } from 'react';
// import { api } from '@/services/api';
// import { useAuthStore } from '../stores/auth-store';

// // VipEx Complete Logistics Dashboard Component
// export function CashierDashboard() {
//   const { user, isAuthenticated } = useAuthStore();
//   const [stats, setStats] = useState({
//     pendingBookings: 0,
//     todayParcels: 0,
//     activeConsignments: 0,
//     groupedParcels: 0,
//     pendingPayments: 0,
//     activeCashiers: 0,
//     lowStockItems: 0,
//     todayRevenue: 0,
//     shiftEfficiency: 0,
//   });

//   // Load dashboard data on component mount
//   useEffect(() => {
//     if (isAuthenticated && user) {
//       loadDashboardData();
//     }
//   }, [isAuthenticated, user]);

//   const loadDashboardData = async () => {
//     try {
//       // Simulate API responses since we have the backend ready
//       const [
//         pendingBookingsRes,
//         parcelsRes,
//         consignmentsRes,
//         paymentsRes,
//         cashiersRes,
//         inventoryRes,
//         revenueRes,
//         shiftEfficiencyRes,
//       ] = await Promise.all([
//         fetchPendingBookings(),
//         fetchTodayParcels(),
//         fetchActiveConsignments(),
//         fetchPendingPayments(),
//         fetchActiveCashiers(),
//         fetchLowStockItems(),
//         fetchTodayRevenue(),
//         fetchShiftEfficiency(),
//       ]);

//       // Update stats
//       setStats({
//         pendingBookings: pendingBookingsRes.data.length,
//         todayParcels: parcelsRes.data.length,
//         activeConsignments: consignmentsRes.data.length,
//         groupedParcels: consignmentsRes.data.length,
//         pendingPayments: paymentsRes.data.length,
//         activeCashiers: cashiersRes.data.length,
//         lowStockItems: inventoryRes.data?.items?.length || 0,
//         todayRevenue: revenueRes.data.amount || 0,
//         shiftEfficiency: shiftEfficiencyRes.data.score,
//       });
//     } catch (error) {
//       console.error('Failed to load dashboard data:', error);
//     }
//   };

//   if (!isAuthenticated) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center p-8">
//           <h1 className="text-2xl font-bold text-gray-900">VipEx Logistics</h1>
//           <p className="text-lg text-gray-500">Please log in to access your dashboard</p>
//           <div className="mt-4">
//             <button
//               className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//               onClick={() => window.location.href = '/login'}
//             >
//               Log In
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between">
//             <h1 className="text-2xl font-bold text-gray-900">
//               <span className="text-indigo-600">Vip</span>
//               {' '}Logistics Management System
//             </h1>
//             <div className="ml-4">
//               <span className="text-gray-500">v{user?.fullname || 'Guest'}</span>
//             </div>
//             </div>
//           </div>
//         </div>
//       </header>

//         {/* Main Content */}
//         <div className="flex-1 flex-col overflow-y-auto">
//           <div className="p-4">
//             {/* Stats Cards */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
//               <div className="bg-white p-6 rounded-lg shadow">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Overview</h3>
//                 <div className="space-y-4">
//                   <div className="flex justify-between">
//                     <p className="text-sm text-gray-500">Pending Bookings</p>
//                     <p className="text-2xl font-bold text-blue-600">{stats.pendingBookings}</p>
//                   </div>
//                     <div className="text-sm text-gray-500">Created Today</p>
//                     <div className="text-xs text-gray-400">+{stats.pendingBookings > 0 ? stats.pendingBookings : '0'}</div>
//                   </div>
//                   <div className="text-sm text-gray-400">Trend: <span className="text-green-600">↑</span></div>
//                   <div className="text-xs text-gray-400">From Yesterday</div>
//                   </div>
//                   </div>
//                 </div>

//                   <div className="flex justify-between">
//                     <p className="text-sm text-gray-500">Today's Parcels</p>
//                     <p className="text-2xl font-bold text-green-600">{stats.todayParcels}</p>
//                     </p>
//                     <div className="text-sm text-gray-500">Processed Today</p>
//                     <div className="text-xs text-gray-400">+{stats.activeConsignments > 0 ? stats.activeConsignments : '0'}</div>
//                   </div>
//                   <div className="text-sm text-gray-400">Trend: <span className="text-green-600">↑</span></div>
//                   <div className="text-xs text-gray-400">From Yesterday</div>
//                   </div>
//                   </div>
//                 </div>

//                   <div className="flex justify-between">
//                     <p className="text-sm text-gray-500">Grouped Parcels</p>
//                     <p className="text-2xl font-bold text-orange-600">{stats.groupedParcels}</p>
//                     </div>
//                     <div className="text-sm text-gray-400">Total Grouped: {stats.pendingBookings + stats.todayParcels + stats.activeConsignments + stats.groupedParcels}</div>
//                     </div>
//                     <div className="text-sm text-gray-400">Efficiency: {stats.groupedParcels > 0 ? Math.round((stats.groupedParcels / (stats.pendingBookings + stats.todayParcels + stats.activeConsignments)) * 100) : 0}%</div>
//                   </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//               <div className="bg-white p-6 rounded-lg shadow">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Performance</h3>
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="text-center">
//                       <p className="text-sm text-gray-500">Today's Revenue</p>
//                       <div className="text-3xl font-bold text-cyan-600">GHS {stats.todayRevenue}</div>
//                     </div>
//                       <div className="text-xs text-gray-400">
//                         <span className="text-green-600">↑</span> From yesterday
//                         <span className="text-red-600">↓</span> 2.5% growth
//                       </div>
//                       <span className="text-green-600">→</span> 2.5% growth
//                       </div>
//                     </div>
//                   </div>
//                     <div className="mt-2">
//                       <div className="w-full bg-gray-200 rounded">
//                         <p className="text-sm text-gray-700">Daily Breakdown</p>
//                         <div className="text-xs text-xs">Cash: 60% • Cards: 30% • Mobile: 10%</div>
//                         </div>
//                         <div className="text-xs text-xs">Performance: 85% efficiency score</div>
//                       </div>
//                     </div>
//                   </div>
//                     <div className="text-center">
//                       <p className="text-sm text-gray-500">Pending Payments</p>
//                         <div className="text-2xl font-bold text-red-600">{stats.pendingPayments}</div>
//                       </div>
//                       <div className="text-sm text-gray-400">Processed: <span className="text-green-600">{stats.pendingPayments > 0 ? stats.pendingPayments : '0'}</span></div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="text-center">
//                     <p className="text-sm text-gray-500">Active Cashiers</p>
//                       <div className="text-2xl font-bold text-blue-600">{stats.activeCashiers}</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white p-6 rounded-lg shadow">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
//                 <div className="space-y-4">
//                   <div className="flex justify-between">
//                     <p className="text-sm text-gray-500">Low Stock Alerts</p>
//                       <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
//                     </div>
//                     <div className="text-sm text-gray-400">Critical: <span className="text-red-600">3 items below minimum</span></div>
//                     </div>
//                     <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">
//                       Restock Items
//                     </button>
//                   </div>
//                   </div>
//                 </div>

//             {/* Quick Actions */}
//             <div className="xl:col-span-2">
//               <div className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <button
//                     className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
//                     onClick={() => console.log('Auto-Grouping clicked')}
//                   >
//                     Auto-Group Parcels
//                   </button>
//                   <button
//                     className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
//                     onClick={() => console.log('Create Consignment clicked')}
//                   >
//                     Create Consignment
//                   </button>
//                   <button
//                     className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
//                     onClick={() => console.log('Process Payment clicked')}
//                   >
//                     Process Payment
//                   </button>
//                   <button
//                     className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600"
//                     onClick={() => console.log('Start Shift clicked')}
//                   >
//                     Start Shift
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Recent Activities */}
//             <div className="xl:col-span-2">
//               <div className="bg-white p-6 rounded-lg shadow">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
//                 <div className="space-y-4">
//                   <div className="flex items-center space-x-4">
//                     <div className="w-full h-24 bg-white rounded-lg p-4">
//                       <div className="flex items-center space-x-3">
//                         <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-white">
//                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8v1l-3h6l4 4h2l3 1H6" />
//                           </svg>
//                         </div>
//                         <div>
//                           <p className="text-xs text-gray-400">Pending Booking</p>
//                           <p className="text-sm text-gray-500">2 minutes ago</p>
//                         </div>
//                         <div className="text-xs text-gray-400">BK20240123</div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
// }

// export default CashierDashboard;

const CashierDashboard = () => {
  return <div>CashierDashboard</div>;
};

export default CashierDashboard;
