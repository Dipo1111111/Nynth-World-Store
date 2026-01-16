import React, { useEffect, useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { fetchOrders, fetchProducts, getProductStats } from "../api/firebaseFunctions";
import { Bar, Line } from "react-chartjs-2";
import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    recentOrders: []
  });
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const orders = await fetchOrders();
      const products = await fetchProducts();

      // Calculate Total Sales
      const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);

      setStats({
        totalSales,
        totalOrders: orders.length,
        totalProducts: products.length,
        recentOrders: orders.sort((a, b) => {
          const aTime = a.created_at?.seconds || 0;
          const bTime = b.created_at?.seconds || 0;
          return bTime - aTime;
        }).slice(0, 5)
      });

      // Prepare Chart Data (Last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dateStr: d.toDateString()
        };
      }).reverse();

      // Aggregate real daily sales
      const dailySales = last7Days.map(day => {
        const dayTotal = orders
          .filter(order => {
            if (!order.created_at) return false;
            const orderDate = new Date(order.created_at.seconds * 1000).toDateString();
            return orderDate === day.dateStr;
          })
          .reduce((sum, order) => sum + (order.total || 0), 0);
        return dayTotal;
      });

      setChartData({
        labels: last7Days.map(d => d.label),
        datasets: [{
          label: "Daily Sales (₦)",
          data: dailySales,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 4,
        }]
      });
    };

    loadData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, subtext }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold font-space">{value}</h3>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-gray-400">
          <Icon size={24} />
        </div>
      </div>
      {subtext && <p className="text-sm text-green-600 flex items-center gap-1">
        <TrendingUp size={14} /> {subtext}
      </p>}
    </div>
  );

  return (
    <AdminLayout title="Overview">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₦${stats.totalSales.toLocaleString()}`}
          icon={DollarSign}
          subtext="+12.5% from last month"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
        />
        <StatCard
          title="Active Products"
          value={stats.totalProducts}
          icon={Package}
        />
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-lg mb-6">Revenue Analytics</h3>
          <div className="h-64">
            {chartData && <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                  x: { grid: { display: false } }
                }
              }}
            />}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-lg mb-6">Recent Orders</h3>
          <div className="space-y-6">
            {stats.recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm">{order.customer?.firstName} {order.customer?.lastName}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at?.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">₦{order.total?.toLocaleString()}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {order.order_status}
                  </span>
                </div>
              </div>
            ))}
            {stats.recentOrders.length === 0 && (
              <p className="text-gray-500 text-sm">No recent orders</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Package({ size }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22v-9" />
    </svg>
  )
}
