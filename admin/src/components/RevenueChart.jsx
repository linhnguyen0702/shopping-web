import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { formatVND } from "../helpers/currencyHelper";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RevenueChart = ({ monthlyData = [], type = "line" }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (monthlyData && monthlyData.length > 0) {
      // Sort data by year and month
      const sortedData = [...monthlyData].sort((a, b) => {
        const aDate = new Date(a._id.year, a._id.month - 1);
        const bDate = new Date(b._id.year, b._id.month - 1);
        return aDate - bDate;
      });

      // Prepare labels and data
      const labels = sortedData.map((item) => {
        const monthNames = [
          "Tháng 1",
          "Tháng 2",
          "Tháng 3",
          "Tháng 4",
          "Tháng 5",
          "Tháng 6",
          "Tháng 7",
          "Tháng 8",
          "Tháng 9",
          "Tháng 10",
          "Tháng 11",
          "Tháng 12",
        ];
        return `${monthNames[item._id.month - 1]} ${item._id.year}`;
      });

      const revenueData = sortedData.map((item) => item.revenue || 0);

      setChartData({
        labels,
        datasets: [
          {
            label: "Doanh thu (VND)",
            data: revenueData,
            borderColor: "rgb(59, 130, 246)",
            backgroundColor:
              type === "bar"
                ? "rgba(59, 130, 246, 0.5)"
                : "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            fill: type === "line",
            tension: 0.4,
          },
        ],
      });
    }
  }, [monthlyData, type]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Biểu đồ doanh thu theo tháng",
        font: {
          size: 16,
          weight: "bold",
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Doanh thu: ${formatVND(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Thời gian",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Doanh thu (VND)",
        },
        ticks: {
          callback: function (value) {
            return formatVND(value);
          },
        },
      },
    },
  };

  if (!chartData || monthlyData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-500">Chưa có dữ liệu doanh thu</p>
          <p className="text-sm text-gray-400 mt-1">
            Dữ liệu sẽ hiển thị khi có đơn hàng
          </p>
        </div>
      </div>
    );
  }

  const ChartComponent = type === "bar" ? Bar : Line;

  return (
    <div className="h-64">
      <ChartComponent data={chartData} options={options} />
    </div>
  );
};

RevenueChart.propTypes = {
  monthlyData: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.shape({
        year: PropTypes.number.isRequired,
        month: PropTypes.number.isRequired,
      }).isRequired,
      revenue: PropTypes.number.isRequired,
    })
  ),
  type: PropTypes.oneOf(["line", "bar"]),
};

export default RevenueChart;
