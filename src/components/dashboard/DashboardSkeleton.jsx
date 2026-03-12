import { motion } from 'framer-motion';
import './DashboardSkeleton.css';

export function DashboardSkeleton() {
  return (
    <motion.div
      className="dashboard-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="dashboard-skeleton-layout">
      <div className="dashboard-skeleton-left">
      <div className="dashboard-skeleton-hero">
        <div className="dashboard-skeleton-shimmer" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-subtitle" />
      </div>

      <div className="dashboard-skeleton-stats">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="skeleton-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.4 }}
          >
            <div className="skeleton-icon" />
            <div className="skeleton-card-content">
              <div className="skeleton-line skeleton-value" />
              <div className="skeleton-line skeleton-label" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="skeleton-line skeleton-section-title" />
      <div className="dashboard-skeleton-shortcuts">
        <div className="skeleton-shortcut" />
        <div className="skeleton-shortcut" />
        <div className="skeleton-shortcut" />
      </div>
      </div>

      <div className="dashboard-skeleton-right">
      <div className="dashboard-skeleton-charts">
        <motion.div
          className="skeleton-chart"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="skeleton-bars">
            {[40, 65, 85, 55, 70].map((h, i) => (
              <div key={i} className="skeleton-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </motion.div>
      </div>
      <div className="skeleton-blockchain">
        <div className="skeleton-blockchain-icon" />
        <div className="skeleton-blockchain-content">
          <div className="skeleton-line" style={{ width: '40%', marginBottom: '0.5rem' }} />
          <div className="skeleton-line" style={{ width: '90%' }} />
        </div>
      </div>
      </div>
      </div>
    </motion.div>
  );
}
